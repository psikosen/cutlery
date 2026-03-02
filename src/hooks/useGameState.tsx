import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type {
  Player, Creature, Gene, Task, Achievement, Notification,
  TabId, Domain, CreatureId, GeneType, GeneTier, Skill, SpecialAbility,
} from '../types';
import { CREATURE_NAMES, DOMAIN_TO_CREATURE } from '../types';
import {
  createDefaultPlayer, createAllCreatures, completeTask as engineCompleteTask,
  checkAchievements, fuseGenes as engineFuseGenes,
  calculateHunterRank, generateGene, applyGeneToCreature,
} from '../services/gameEngine';
import type { TaskCompletionResult } from '../services/gameEngine';
import {
  savePlayer, loadPlayer, saveCreature, saveCreaturesBatch, loadAllCreatures,
  saveGene, loadAllGenes, deleteGenes, saveTasks, loadAllTasks,
  saveAchievements, loadAllAchievements,
  saveSkills, loadAllSkills as loadAllSkillsDB,
  saveAbilities, loadAllAbilities as loadAllAbilitiesDB,
  saveMeta, loadMeta,
} from '../services/persistence';
import { apiGetServerTime } from '../services/api';
import { generateDefaultTasks } from '../data/defaultTasks';
import { DAILY_CALENDAR_REWARDS, getCalendarRewardByIndex } from '../data/dailyCalendarRewards';
import { getDefaultAchievements } from '../data/achievements';
import { getAllSkills } from '../data/skills';
import { getAllAbilities } from '../data/abilities';
import { selectTasksWithConstraints } from '../utils/proceduralGeneration';

interface WeeklyPulseMeta {
  week_start: string;
  servings: number;
  reward_claimed: boolean;
}

interface RitualStreakMeta {
  current: number;
  best: number;
  last_completed_date: string | null;
}

interface DailyCalendarMeta {
  cycle_index: number;
  last_claim_date: string | null;
  consecutive_claims: number;
  best_consecutive_claims: number;
}

interface LongevityPillars {
  legumes: boolean;
  produce_fiber: boolean;
  salt_sugar: boolean;
  hydration: boolean;
  healthy_fats: boolean;
  whole_foods: boolean;
  rituals: boolean;
}

interface LongevityScore {
  score: number;
  pillars_completed: number;
  pillars_total: number;
  pillars: LongevityPillars;
}

interface NutritionTargetsV2 {
  produce400: boolean;
  fiber25: boolean;
  legumes: boolean;
  hydration: boolean;
  salt_guard: boolean;
  sugar_guard: boolean;
  healthy_fats: boolean;
  whole_foods: boolean;
  completed: number;
  total: number;
}

interface MediterraneanArcProgress {
  completed: number;
  total: number;
  progress: number;
  phase: 'Initiation' | 'Foundation' | 'Expansion' | 'Mastery' | 'Ascendant';
  next_quest: string | null;
}

interface WeeklyPulseTracker {
  week_start: string;
  servings: number;
  target: number;
  reward_claimed: boolean;
  reward_gold: number;
  progress: number;
}

interface RitualStreakTracker {
  current: number;
  best: number;
  last_completed_date: string | null;
  today_completed: boolean;
  today_count: number;
}

interface DailyCalendarState {
  cycle_index: number;
  can_claim_today: boolean;
  last_claim_date: string | null;
  consecutive_claims: number;
  best_consecutive_claims: number;
  total_days: number;
  next_reward: {
    day: number;
    title: string;
    gold: number;
  };
}

interface NutritionInsights {
  longevity: LongevityScore;
  targets_v2: NutritionTargetsV2;
  mediterranean_arc: MediterraneanArcProgress;
  weekly_pulse: WeeklyPulseTracker;
  ritual_streak: RitualStreakTracker;
}

interface ForecastQuest {
  task_id: string;
  name: string;
  domain: Domain;
  type: Task['type'];
  difficulty: number;
  impact_score: number;
}

interface ShadowForecastState {
  date: string;
  quests: ForecastQuest[];
  completed_today: number;
}

interface RescueModeState {
  active: boolean;
  activated_at: string | null;
  expires_at: string | null;
  source_streak_date: string | null;
  required_count: number;
  completed_count: number;
  quest_ids: string[];
  resolved: boolean;
}

type TimeboxMinutes = 5 | 10 | 25;

interface TimeboxMission {
  minutes: TimeboxMinutes;
  label: string;
  reward_gold: number;
  completed: boolean;
  completed_at: string | null;
}

interface TimeboxState {
  date: string;
  missions: TimeboxMission[];
  completed_count: number;
}

type TimelineEventKind =
  | 'task'
  | 'evolution'
  | 'raid'
  | 'rescue'
  | 'streak'
  | 'bond'
  | 'calendar'
  | 'forecast'
  | 'system';

export interface TimelineEvent {
  id: string;
  created_at: number;
  date: string;
  title: string;
  detail: string;
  kind: TimelineEventKind;
  domain?: Domain;
}

export interface RaidBossState {
  id: string;
  name: string;
  domain: Domain;
  required_domains: Domain[];
  max_hp: number;
  hp: number;
  intro: string;
  flavor: string;
  week_tag: string;
  last_battle_date: string | null;
  completed_at: string | null;
}

type LastFeedDates = Partial<Record<CreatureId, string>>;
type CreatureHappinessMap = Record<CreatureId, number>;

const META_WEEKLY_PULSE = 'nutrition_weekly_pulse_v1';
const META_RITUAL_STREAK = 'nutrition_ritual_streak_v1';
const META_LAST_FEED_DATES = 'last_feed_dates_v1';
const META_DAILY_CALENDAR = 'daily_reward_calendar_v1';
const META_CREATURE_HAPPINESS = 'creature_happiness_v1';
const META_SHADOW_FORECAST = 'shadow_forecast_v1';
const META_RESCUE_MODE = 'rescue_mode_v1';
const META_TIMEBOX = 'timebox_missions_v1';
const META_RAIDS = 'raid_state_v1';
const META_TIMELINE = 'timeline_events_v1';
const LEGACY_META_LAST_FEED_DATE = 'last_feed_date';
const WEEKLY_PULSE_TARGET = 4;
const WEEKLY_PULSE_REWARD_GOLD = 75;
const CREATURE_HAPPINESS_BASELINE = 50;
const PET_HAPPINESS_BOOST = 3;
const FEED_HAPPINESS_BOOST = 12;
const WATCH_SECONDS_PER_POINT = 20;
const ALL_CREATURE_IDS = Object.keys(CREATURE_NAMES) as CreatureId[];
const FORECAST_QUEST_COUNT = 3;
const RESCUE_REQUIRED_COUNT = 3;
const RESCUE_REWARD_GOLD = 90;
const RESCUE_WINDOW_MS = 24 * 60 * 60 * 1000;
const TIMELINE_MAX_EVENTS = 160;

const TIMEBOX_MISSION_DEFS: Array<{ minutes: TimeboxMinutes; label: string; reward_gold: number }> = [
  { minutes: 5, label: 'Micro Reset', reward_gold: 8 },
  { minutes: 10, label: 'Focus Burst', reward_gold: 14 },
  { minutes: 25, label: 'Deep Sprint', reward_gold: 24 },
];

const RAID_BOSS_BLUEPRINTS: Array<Omit<RaidBossState, 'hp' | 'week_tag' | 'last_battle_date' | 'completed_at'>> = [
  {
    id: 'raid_crimson_colossus',
    name: 'Lord Miserion',
    domain: 'health',
    required_domains: ['health', 'discipline', 'career'],
    max_hp: 360,
    intro: 'Lord Miserion emerges from the ash of burnout and self-neglect.',
    flavor: 'An iron tyrant of misery that fattens on skipped sleep and abandoned routines.',
  },
  {
    id: 'raid_void_oracle',
    name: 'Distractera Prime',
    domain: 'mind',
    required_domains: ['mind', 'social', 'discipline'],
    max_hp: 340,
    intro: 'Distractera Prime hijacks the signal. Every ping becomes a command.',
    flavor: 'A psychic queen of scattered focus, doomscroll loops, and fractured intent.',
  },
  {
    id: 'raid_gilded_hydra',
    name: 'The Debtfang Sovereign',
    domain: 'finance',
    required_domains: ['finance', 'career', 'health'],
    max_hp: 380,
    intro: 'The Debtfang Sovereign coils around your wallet and whispers, "Buy now."',
    flavor: 'A many-headed creditor serpent fed by impulse spending and lifestyle creep.',
  },
  {
    id: 'raid_doomscroll_baron',
    name: 'Doomscroll Baron',
    domain: 'mind',
    required_domains: ['mind', 'discipline', 'social'],
    max_hp: 335,
    intro: 'The Doomscroll Baron drags your attention into an endless feed.',
    flavor: 'A thumb-bound tyrant that harvests focus one swipe at a time.',
  },
  {
    id: 'raid_dreadmarshal',
    name: 'Dreadmarshal',
    domain: 'health',
    required_domains: ['health', 'mind', 'discipline'],
    max_hp: 350,
    intro: 'Dreadmarshal sounds the horn of panic before every important step.',
    flavor: 'A warlord of fear responses, false alarms, and tension loops.',
  },
  {
    id: 'raid_procrastinox',
    name: 'Procrastinox',
    domain: 'discipline',
    required_domains: ['discipline', 'career', 'mind'],
    max_hp: 355,
    intro: 'Procrastinox freezes the first move and glorifies "later."',
    flavor: 'A delay beast that turns minutes into debt and action into anxiety.',
  },
  {
    id: 'raid_shame_revenant',
    name: 'Shame Revenant',
    domain: 'social',
    required_domains: ['social', 'mind', 'health'],
    max_hp: 345,
    intro: 'The Shame Revenant repeats every old mistake in perfect detail.',
    flavor: 'A specter fed by self-judgment, avoidance, and isolation.',
  },
  {
    id: 'raid_overthink_oracle',
    name: 'The Overthink Oracle',
    domain: 'mind',
    required_domains: ['mind', 'career', 'discipline'],
    max_hp: 348,
    intro: 'The Overthink Oracle offers infinite plans and zero movement.',
    flavor: 'A prophecy engine that turns clarity into paralysis.',
  },
  {
    id: 'raid_fomo_hydra',
    name: 'FOMO Hydra',
    domain: 'social',
    required_domains: ['social', 'finance', 'mind'],
    max_hp: 372,
    intro: 'FOMO Hydra sprouts new heads for every option you do not take.',
    flavor: 'A multi-headed fear construct that prices peace above budget.',
  },
  {
    id: 'raid_sloth_leviathan',
    name: 'Sloth Leviathan',
    domain: 'discipline',
    required_domains: ['discipline', 'health', 'career'],
    max_hp: 360,
    intro: 'The Sloth Leviathan anchors your momentum to the floor.',
    flavor: 'A gravity giant fueled by skipped reps and delayed starts.',
  },
  {
    id: 'raid_rage_furnace',
    name: 'Rage Furnace',
    domain: 'health',
    required_domains: ['health', 'social', 'mind'],
    max_hp: 352,
    intro: 'Rage Furnace ignites at the smallest spark and burns the day.',
    flavor: 'A heat core of reactivity that consumes energy reserves.',
  },
  {
    id: 'raid_envy_archon',
    name: 'Envy Archon',
    domain: 'social',
    required_domains: ['social', 'mind', 'career'],
    max_hp: 342,
    intro: 'Envy Archon projects everyone else\'s highlight reel on your path.',
    flavor: 'A mirror sovereign that turns admiration into self-erasure.',
  },
  {
    id: 'raid_debt_wraith',
    name: 'Debt Wraith',
    domain: 'finance',
    required_domains: ['finance', 'discipline', 'career'],
    max_hp: 366,
    intro: 'Debt Wraith whispers minimum payments as if they were victory.',
    flavor: 'A collector spirit hidden in subscriptions, fees, and friction.',
  },
  {
    id: 'raid_scattermind_kraken',
    name: 'Scattermind Kraken',
    domain: 'mind',
    required_domains: ['mind', 'career', 'social'],
    max_hp: 358,
    intro: 'Scattermind Kraken pulls each thought in a different direction.',
    flavor: 'A tentacled attention thief that interrupts deep work at source.',
  },
  {
    id: 'raid_burnout_monarch',
    name: 'Burnout Monarch',
    domain: 'career',
    required_domains: ['career', 'health', 'discipline'],
    max_hp: 374,
    intro: 'Burnout Monarch crowns overwork and taxes recovery.',
    flavor: 'A tyrant of unsustainable pace, empty output, and collapse cycles.',
  },
  {
    id: 'raid_perfection_tyrant',
    name: 'Perfection Tyrant',
    domain: 'career',
    required_domains: ['career', 'mind', 'discipline'],
    max_hp: 368,
    intro: 'Perfection Tyrant rejects progress unless it is flawless.',
    flavor: 'A gatekeeper that blocks shipping, practicing, and iteration.',
  },
  {
    id: 'raid_comfort_maw',
    name: 'Comfort Maw',
    domain: 'health',
    required_domains: ['health', 'social', 'finance'],
    max_hp: 356,
    intro: 'Comfort Maw offers instant relief with long-tail consequences.',
    flavor: 'A soothing predator of overconsumption and emotional eating loops.',
  },
  {
    id: 'raid_impulse_seraph',
    name: 'Impulse Seraph',
    domain: 'finance',
    required_domains: ['finance', 'mind', 'social'],
    max_hp: 348,
    intro: 'Impulse Seraph blesses every craving with one-click checkout.',
    flavor: 'A radiant deceiver that converts urges into recurring bills.',
  },
  {
    id: 'raid_compare_lord',
    name: 'Comparelord Vex',
    domain: 'social',
    required_domains: ['social', 'mind', 'career'],
    max_hp: 350,
    intro: 'Comparelord Vex keeps score when you should be building.',
    flavor: 'A ranking demon that drains confidence and creative risk.',
  },
  {
    id: 'raid_noise_emperor',
    name: 'Noise Emperor',
    domain: 'mind',
    required_domains: ['mind', 'social', 'discipline'],
    max_hp: 354,
    intro: 'Noise Emperor fills every silence with urgency.',
    flavor: 'A static crown that blurs priorities and buries signal.',
  },
  {
    id: 'raid_avoidance_sphinx',
    name: 'Avoidance Sphinx',
    domain: 'discipline',
    required_domains: ['discipline', 'mind', 'social'],
    max_hp: 347,
    intro: 'Avoidance Sphinx asks riddles until the real task expires.',
    flavor: 'A puzzle beast that trades discomfort for delay and drift.',
  },
  {
    id: 'raid_lonewolf_warden',
    name: 'Lonewolf Warden',
    domain: 'social',
    required_domains: ['social', 'career', 'health'],
    max_hp: 340,
    intro: 'Lonewolf Warden locks every burden behind "I got this."',
    flavor: 'A sentinel of isolation that blocks support and shared momentum.',
  },
  {
    id: 'raid_sunkcost_behemoth',
    name: 'Sunkcost Behemoth',
    domain: 'finance',
    required_domains: ['finance', 'mind', 'career'],
    max_hp: 376,
    intro: 'Sunkcost Behemoth chains you to losing paths with old effort.',
    flavor: 'A colossal bias engine that mistakes past spend for future value.',
  },
  {
    id: 'raid_fearforge',
    name: 'Fearforge Titan',
    domain: 'career',
    required_domains: ['career', 'mind', 'social'],
    max_hp: 362,
    intro: 'Fearforge Titan hammers every opportunity into a threat.',
    flavor: 'A forged giant of rejection fear, stage fright, and hesitancy.',
  },
  {
    id: 'raid_excuse_alchemist',
    name: 'Excuse Alchemist',
    domain: 'discipline',
    required_domains: ['discipline', 'career', 'mind'],
    max_hp: 346,
    intro: 'Excuse Alchemist turns valid constraints into permanent stalls.',
    flavor: 'A silver-tongued transmuter of reasons, rationalizations, and reroutes.',
  },
  {
    id: 'raid_fragfocus_lord',
    name: 'Fragfocus Lord',
    domain: 'mind',
    required_domains: ['mind', 'career', 'discipline'],
    max_hp: 352,
    intro: 'Fragfocus Lord shatters deep work into glittering fragments.',
    flavor: 'A prism tyrant that swaps immersion for constant context switching.',
  },
  {
    id: 'raid_cynic_king',
    name: 'Cynic King',
    domain: 'social',
    required_domains: ['social', 'mind', 'discipline'],
    max_hp: 344,
    intro: 'Cynic King mocks effort before effort can compound.',
    flavor: 'A corrosive monarch of sarcasm, distrust, and stalled collaboration.',
  },
  {
    id: 'raid_shortterm_drake',
    name: 'Shortterm Drake',
    domain: 'finance',
    required_domains: ['finance', 'health', 'career'],
    max_hp: 358,
    intro: 'Shortterm Drake offers tiny wins that bankrupt tomorrow.',
    flavor: 'A fast-reward dragon that burns long-term plans for quick dopamine.',
  },
  {
    id: 'raid_habit_breaker',
    name: 'Habitbreaker Colossus',
    domain: 'health',
    required_domains: ['health', 'discipline', 'mind'],
    max_hp: 370,
    intro: 'Habitbreaker Colossus stomps consistency right before it compounds.',
    flavor: 'A schedule giant that resets progress through one missed chain.',
  },
  {
    id: 'raid_overcommit_hera',
    name: 'Overcommit Hera',
    domain: 'career',
    required_domains: ['career', 'social', 'discipline'],
    max_hp: 349,
    intro: 'Overcommit Hera blesses every request and curses every deadline.',
    flavor: 'A contract empress of yes-bias, overload, and deadline collapse.',
  },
  {
    id: 'raid_nightowl_phantom',
    name: 'Nightowl Phantom',
    domain: 'health',
    required_domains: ['health', 'mind', 'career'],
    max_hp: 343,
    intro: 'Nightowl Phantom steals recovery one "last thing" at a time.',
    flavor: 'A midnight specter that taxes sleep, mood, and daytime clarity.',
  },
  {
    id: 'raid_gloom_matriarch',
    name: 'Gloom Matriarch',
    domain: 'mind',
    required_domains: ['mind', 'health', 'social'],
    max_hp: 351,
    intro: 'Gloom Matriarch paints future states in grayscale certainty.',
    flavor: 'A fog queen of catastrophizing, hopeless loops, and learned helplessness.',
  },
];

interface BondPerkProfile {
  tier: 'dormant' | 'linked' | 'resonant' | 'ascendant';
  gold_multiplier: number;
  mutation_chance: number;
}

const PULSE_KEYWORDS = ['lentil', 'bean', 'chickpea', 'pulse', 'legume'];
const RITUAL_KEYWORDS = [
  'slow table',
  '80% full',
  'comfortably full',
  'shared bean table',
  'shared meal',
  'phone-free shared meal',
];
const MEDITERRANEAN_ARC_KEYWORD = 'mediterranean arc';
const TARGET_KEYWORDS = {
  produce400: ['400g produce', 'produce floor', 'fruit', 'vegetable', 'produce'],
  fiber25: ['fibre 25', 'fiber 25', 'fibre', 'fiber', 'whole grain'],
  legumes: ['lentil', 'bean', 'chickpea', 'pulse', 'legume'],
  hydration: ['hydration', 'water', 'hydrat'],
  salt_guard: ['salt', 'sodium', 'low-salt', '<5g'],
  sugar_guard: ['sugar', 'added sugar', 'free sugar', 'sugary drink'],
  healthy_fats: ['olive', 'fish', 'omega', 'nut', 'seed'],
  whole_foods: ['whole-food', 'whole food', 'meal prep', 'batch-cook', 'pantry', 'waste-free'],
};

function toIsoDate(input = new Date()): string {
  return input.toISOString().split('T')[0];
}

function getStartOfIsoWeek(input = new Date()): string {
  const date = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return toIsoDate(date);
}

function getYesterdayIso(input = new Date()): string {
  const date = new Date(input);
  date.setUTCDate(date.getUTCDate() - 1);
  return toIsoDate(date);
}

function clampNonNegativeInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function clampHappiness(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return CREATURE_HAPPINESS_BASELINE;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createDefaultCreatureHappiness(): CreatureHappinessMap {
  const defaults: Partial<CreatureHappinessMap> = {};
  for (const creatureId of ALL_CREATURE_IDS) {
    defaults[creatureId] = CREATURE_HAPPINESS_BASELINE;
  }
  return defaults as CreatureHappinessMap;
}

function toTaskText(task: Task): string {
  return `${task.name} ${task.description}`.toLowerCase();
}

function taskMatchesKeywords(task: Task, keywords: string[]): boolean {
  const text = toTaskText(task);
  return keywords.some((keyword) => text.includes(keyword));
}

function isPulseTask(task: Task): boolean {
  return taskMatchesKeywords(task, PULSE_KEYWORDS);
}

function isRitualTask(task: Task): boolean {
  return taskMatchesKeywords(task, RITUAL_KEYWORDS);
}

function createDefaultWeeklyPulseMeta(now = new Date()): WeeklyPulseMeta {
  return {
    week_start: getStartOfIsoWeek(now),
    servings: 0,
    reward_claimed: false,
  };
}

function createDefaultRitualStreakMeta(): RitualStreakMeta {
  return {
    current: 0,
    best: 0,
    last_completed_date: null,
  };
}

function createDefaultDailyCalendarMeta(): DailyCalendarMeta {
  return {
    cycle_index: 0,
    last_claim_date: null,
    consecutive_claims: 0,
    best_consecutive_claims: 0,
  };
}

function normalizeWeeklyPulseMeta(raw: unknown, now = new Date()): WeeklyPulseMeta {
  const currentWeek = getStartOfIsoWeek(now);
  if (!raw || typeof raw !== 'object') {
    return createDefaultWeeklyPulseMeta(now);
  }

  const maybe = raw as Partial<WeeklyPulseMeta>;
  if (maybe.week_start !== currentWeek) {
    return createDefaultWeeklyPulseMeta(now);
  }

  return {
    week_start: currentWeek,
    servings: clampNonNegativeInt(maybe.servings),
    reward_claimed: !!maybe.reward_claimed,
  };
}

function normalizeRitualStreakMeta(raw: unknown, now = new Date()): RitualStreakMeta {
  if (!raw || typeof raw !== 'object') {
    return createDefaultRitualStreakMeta();
  }

  const maybe = raw as Partial<RitualStreakMeta>;
  const today = toIsoDate(now);
  const yesterday = getYesterdayIso(now);
  const lastCompletedDate = typeof maybe.last_completed_date === 'string' ? maybe.last_completed_date : null;
  let current = clampNonNegativeInt(maybe.current);
  if (!lastCompletedDate || (lastCompletedDate !== today && lastCompletedDate !== yesterday)) {
    current = 0;
  }
  const best = Math.max(clampNonNegativeInt(maybe.best), current);

  return {
    current,
    best,
    last_completed_date: lastCompletedDate,
  };
}

function normalizeDailyCalendarMeta(raw: unknown, now = new Date()): DailyCalendarMeta {
  const totalDays = DAILY_CALENDAR_REWARDS.length;
  const today = toIsoDate(now);
  const yesterday = getYesterdayIso(now);

  if (!raw || typeof raw !== 'object') {
    return createDefaultDailyCalendarMeta();
  }

  const maybe = raw as Partial<DailyCalendarMeta>;
  const rawCycleIndex = clampNonNegativeInt(maybe.cycle_index);
  const cycleIndex = totalDays > 0 ? rawCycleIndex % totalDays : 0;
  const lastClaimDate = typeof maybe.last_claim_date === 'string' ? maybe.last_claim_date : null;
  let consecutiveClaims = clampNonNegativeInt(maybe.consecutive_claims);
  const bestConsecutiveClaims = clampNonNegativeInt(maybe.best_consecutive_claims);

  if (!lastClaimDate || (lastClaimDate !== today && lastClaimDate !== yesterday)) {
    consecutiveClaims = 0;
  }

  return {
    cycle_index: cycleIndex,
    last_claim_date: lastClaimDate,
    consecutive_claims: consecutiveClaims,
    best_consecutive_claims: Math.max(bestConsecutiveClaims, consecutiveClaims),
  };
}

function buildDailyCalendarState(meta: DailyCalendarMeta, now = new Date()): DailyCalendarState {
  const today = toIsoDate(now);
  const nextReward = getCalendarRewardByIndex(meta.cycle_index);
  return {
    cycle_index: meta.cycle_index,
    can_claim_today: meta.last_claim_date !== today,
    last_claim_date: meta.last_claim_date,
    consecutive_claims: meta.consecutive_claims,
    best_consecutive_claims: meta.best_consecutive_claims,
    total_days: DAILY_CALENDAR_REWARDS.length,
    next_reward: {
      day: nextReward.day,
      title: nextReward.title,
      gold: nextReward.gold,
    },
  };
}

function normalizeLastFeedDates(raw: unknown): LastFeedDates {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const maybe = raw as Record<string, unknown>;
  const normalized: LastFeedDates = {};
  for (const creatureId of ALL_CREATURE_IDS) {
    const value = maybe[creatureId];
    if (typeof value === 'string' && value.length > 0) {
      normalized[creatureId] = value;
    }
  }
  return normalized;
}

function normalizeCreatureHappiness(raw: unknown): CreatureHappinessMap {
  const defaults = createDefaultCreatureHappiness();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const maybe = raw as Record<string, unknown>;
  for (const creatureId of ALL_CREATURE_IDS) {
    const value = maybe[creatureId];
    defaults[creatureId] = clampHappiness(value);
  }
  return defaults;
}

function migrateLastFeedDates(rawMap: unknown, legacyRaw: unknown): LastFeedDates {
  const normalized = normalizeLastFeedDates(rawMap);
  if (Object.keys(normalized).length > 0) {
    return normalized;
  }
  if (typeof legacyRaw === 'string' && legacyRaw.length > 0) {
    return { gore_maw: legacyRaw };
  }
  return normalized;
}

function createTimelineEvent(
  title: string,
  detail: string,
  kind: TimelineEventKind,
  domain?: Domain,
  now = Date.now(),
): TimelineEvent {
  return {
    id: `timeline_${now}_${Math.floor(Math.random() * 1000)}`,
    created_at: now,
    date: new Date(now).toISOString(),
    title,
    detail,
    kind,
    domain,
  };
}

function normalizeTimeline(raw: unknown): TimelineEvent[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .filter((entry): entry is Partial<TimelineEvent> => !!entry && typeof entry === 'object')
    .map((entry, index) => {
      const createdAt = typeof entry.created_at === 'number'
        ? entry.created_at
        : Date.now() - index;
      return {
        id: typeof entry.id === 'string' ? entry.id : `timeline_${createdAt}_${index}`,
        created_at: createdAt,
        date: typeof entry.date === 'string' ? entry.date : new Date(createdAt).toISOString(),
        title: typeof entry.title === 'string' ? entry.title : 'System Event',
        detail: typeof entry.detail === 'string' ? entry.detail : '',
        kind: (typeof entry.kind === 'string' ? entry.kind : 'system') as TimelineEventKind,
        domain: typeof entry.domain === 'string' ? entry.domain as Domain : undefined,
      };
    })
    .sort((a, b) => b.created_at - a.created_at);
  return normalized.slice(0, TIMELINE_MAX_EVENTS);
}

function pushTimelineEvent(events: TimelineEvent[], event: TimelineEvent): TimelineEvent[] {
  return [event, ...events]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, TIMELINE_MAX_EVENTS);
}

function hashText(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getBondPerkProfile(happiness: number): BondPerkProfile {
  if (happiness >= 85) {
    return { tier: 'ascendant', gold_multiplier: 1.2, mutation_chance: 0.26 };
  }
  if (happiness >= 70) {
    return { tier: 'resonant', gold_multiplier: 1.12, mutation_chance: 0.16 };
  }
  if (happiness >= 55) {
    return { tier: 'linked', gold_multiplier: 1.06, mutation_chance: 0.08 };
  }
  return { tier: 'dormant', gold_multiplier: 1, mutation_chance: 0 };
}

function computeImpactScore(task: Task, daySeed: string): number {
  let score = (task.difficulty * 18) + task.rewards.gold + (task.rewards.xp * 0.45);
  if (task.type === 'boss') score += 30;
  if (task.type === 'weekly') score += 16;
  if (task.type === 'emergency') score += 24;
  if (!task.completed_today) score += 9;
  score += hashText(`${daySeed}:${task.id}`) % 7;
  return Math.round(score);
}

function buildShadowForecast(tasks: Task[], now = new Date()): ShadowForecastState {
  const date = toIsoDate(now);
  const selected = selectTasksWithConstraints(tasks, {
    targetCount: FORECAST_QUEST_COUNT,
    daySeed: date,
    baseScore: (task) => computeImpactScore(task, date),
    preferIncomplete: true,
    maxPerDomain: 1,
    maxPerType: 2,
    maxPerCategory: 1,
  });
  const quests = selected.map((task) => ({
    task_id: task.id,
    name: task.name,
    domain: task.domain,
    type: task.type,
    difficulty: task.difficulty,
    impact_score: computeImpactScore(task, date),
  }));
  const completedToday = quests.filter((entry) => tasks.find((task) => task.id === entry.task_id)?.completed_today).length;
  return { date, quests, completed_today: completedToday };
}

function createDefaultRescueMode(): RescueModeState {
  return {
    active: false,
    activated_at: null,
    expires_at: null,
    source_streak_date: null,
    required_count: RESCUE_REQUIRED_COUNT,
    completed_count: 0,
    quest_ids: [],
    resolved: false,
  };
}

function pickRescueQuestIds(tasks: Task[], now = new Date()): string[] {
  const forecast = buildShadowForecast(tasks, now);
  const candidates = tasks.filter((task) => !task.completed_today && task.type !== 'boss');
  const selected = selectTasksWithConstraints(candidates, {
    targetCount: RESCUE_REQUIRED_COUNT,
    daySeed: forecast.date,
    baseScore: (task) => computeImpactScore(task, forecast.date),
    preferIncomplete: true,
    maxPerDomain: 1,
    maxPerType: 2,
    maxPerCategory: 1,
  }).map((task) => task.id);

  for (const entry of forecast.quests) {
    if (selected.length >= RESCUE_REQUIRED_COUNT) break;
    if (!selected.includes(entry.task_id)) selected.push(entry.task_id);
  }

  for (const candidate of candidates) {
    if (selected.length >= RESCUE_REQUIRED_COUNT) break;
    if (!selected.includes(candidate.id)) selected.push(candidate.id);
  }

  return selected.slice(0, RESCUE_REQUIRED_COUNT);
}

function hasStreakBreak(player: Player, now = new Date()): boolean {
  if (!player.streak_last_date || player.streak_current <= 0) return false;
  const today = toIsoDate(now);
  const yesterday = getYesterdayIso(now);
  return player.streak_last_date !== today && player.streak_last_date !== yesterday;
}

function normalizeRescueMode(raw: unknown, tasks: Task[], now = new Date()): RescueModeState {
  const defaults = createDefaultRescueMode();
  if (!raw || typeof raw !== 'object') return defaults;

  const maybe = raw as Partial<RescueModeState>;
  const questIds = Array.isArray(maybe.quest_ids)
    ? maybe.quest_ids.filter((id): id is string => typeof id === 'string')
    : [];
  const requiredCount = Math.max(1, clampNonNegativeInt(maybe.required_count) || RESCUE_REQUIRED_COUNT);
  const completedFromTasks = questIds.filter((questId) => tasks.find((task) => task.id === questId)?.completed_today).length;
  const completedCount = Math.min(
    requiredCount,
    Math.max(clampNonNegativeInt(maybe.completed_count), completedFromTasks),
  );
  const expiresAt = typeof maybe.expires_at === 'string' ? maybe.expires_at : null;
  const expiryMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const stillActive = Boolean(
    maybe.active
      && questIds.length > 0
      && Number.isFinite(expiryMs)
      && expiryMs > now.getTime(),
  );
  const resolved = Boolean(maybe.resolved || completedCount >= requiredCount);

  return {
    active: stillActive && !resolved,
    activated_at: typeof maybe.activated_at === 'string' ? maybe.activated_at : null,
    expires_at: expiresAt,
    source_streak_date: typeof maybe.source_streak_date === 'string' ? maybe.source_streak_date : null,
    required_count: requiredCount,
    completed_count: completedCount,
    quest_ids: questIds.slice(0, requiredCount),
    resolved,
  };
}

function maybeActivateRescueMode(
  current: RescueModeState,
  player: Player,
  tasks: Task[],
  now = new Date(),
): { rescueMode: RescueModeState; activated: boolean } {
  const normalized = normalizeRescueMode(current, tasks, now);
  if (normalized.active || normalized.resolved) {
    return { rescueMode: normalized, activated: false };
  }
  if (!hasStreakBreak(player, now)) {
    return { rescueMode: normalized, activated: false };
  }
  if (normalized.source_streak_date === player.streak_last_date) {
    return { rescueMode: normalized, activated: false };
  }

  const activatedAtMs = now.getTime();
  const rescueMode: RescueModeState = {
    active: true,
    activated_at: new Date(activatedAtMs).toISOString(),
    expires_at: new Date(activatedAtMs + RESCUE_WINDOW_MS).toISOString(),
    source_streak_date: player.streak_last_date,
    required_count: RESCUE_REQUIRED_COUNT,
    completed_count: 0,
    quest_ids: pickRescueQuestIds(tasks, now),
    resolved: false,
  };
  return { rescueMode, activated: true };
}

function createDefaultTimeboxState(now = new Date()): TimeboxState {
  return {
    date: toIsoDate(now),
    missions: TIMEBOX_MISSION_DEFS.map((def) => ({
      minutes: def.minutes,
      label: def.label,
      reward_gold: def.reward_gold,
      completed: false,
      completed_at: null,
    })),
    completed_count: 0,
  };
}

function normalizeTimeboxState(raw: unknown, now = new Date()): TimeboxState {
  const today = toIsoDate(now);
  if (!raw || typeof raw !== 'object') return createDefaultTimeboxState(now);
  const maybe = raw as Partial<TimeboxState>;
  if (maybe.date !== today || !Array.isArray(maybe.missions)) {
    return createDefaultTimeboxState(now);
  }
  const missionByMinutes = new Map<number, Partial<TimeboxMission>>();
  for (const mission of maybe.missions) {
    if (!mission || typeof mission !== 'object') continue;
    if (typeof mission.minutes !== 'number') continue;
    missionByMinutes.set(mission.minutes, mission);
  }
  const missions = TIMEBOX_MISSION_DEFS.map((def) => {
    const existing = missionByMinutes.get(def.minutes);
    return {
      minutes: def.minutes,
      label: def.label,
      reward_gold: def.reward_gold,
      completed: Boolean(existing?.completed),
      completed_at: typeof existing?.completed_at === 'string' ? existing.completed_at : null,
    } as TimeboxMission;
  });
  return {
    date: today,
    missions,
    completed_count: missions.filter((mission) => mission.completed).length,
  };
}

function createDefaultRaids(now = new Date()): RaidBossState[] {
  const weekTag = getStartOfIsoWeek(now);
  return RAID_BOSS_BLUEPRINTS.map((raid) => ({
    ...raid,
    hp: raid.max_hp,
    week_tag: weekTag,
    last_battle_date: null,
    completed_at: null,
  }));
}

function normalizeRaids(raw: unknown, now = new Date()): RaidBossState[] {
  const weekTag = getStartOfIsoWeek(now);
  if (!Array.isArray(raw)) return createDefaultRaids(now);

  const byId = new Map<string, Partial<RaidBossState>>();
  for (const raid of raw) {
    if (!raid || typeof raid !== 'object') continue;
    const maybeRaid = raid as Partial<RaidBossState>;
    if (typeof maybeRaid.id !== 'string') continue;
    byId.set(maybeRaid.id, maybeRaid);
  }

  return RAID_BOSS_BLUEPRINTS.map((blueprint) => {
    const existing = byId.get(blueprint.id);
    if (!existing || existing.week_tag !== weekTag) {
      return {
        ...blueprint,
        hp: blueprint.max_hp,
        week_tag: weekTag,
        last_battle_date: null,
        completed_at: null,
      };
    }
    const hp = clampNonNegativeInt(existing.hp);
    return {
      ...blueprint,
      hp: Math.max(0, Math.min(blueprint.max_hp, hp)),
      week_tag: weekTag,
      last_battle_date: typeof existing.last_battle_date === 'string' ? existing.last_battle_date : null,
      completed_at: typeof existing.completed_at === 'string' ? existing.completed_at : null,
    };
  });
}

function buildNutritionInsights(
  tasks: Task[],
  weeklyPulse: WeeklyPulseMeta,
  ritualStreak: RitualStreakMeta,
  now = new Date(),
): NutritionInsights {
  const today = toIsoDate(now);
  const completedToday = tasks.filter((task) => task.completed_today);

  const pillars: LongevityPillars = {
    legumes: completedToday.some(isPulseTask) || weeklyPulse.servings > 0,
    produce_fiber: completedToday.some((task) => taskMatchesKeywords(task, [
      'produce',
      'vegetable',
      'fruit',
      'fibre',
      'fiber',
      'plant variety',
      'whole grain',
      'mediterranean plate',
    ])),
    salt_sugar: completedToday.some((task) => taskMatchesKeywords(task, [
      'salt',
      'sodium',
      'sugar',
      'low-salt',
    ])),
    hydration: completedToday.some((task) => taskMatchesKeywords(task, [
      'hydration',
      'water',
      'hydrat',
    ])),
    healthy_fats: completedToday.some((task) => taskMatchesKeywords(task, [
      'fish',
      'nut',
      'olive',
      'omega',
    ])),
    whole_foods: completedToday.some((task) => taskMatchesKeywords(task, [
      'meal prep',
      'batch-cook',
      'whole-food',
      'lunch upgrade',
      'waste-free',
      'pantry',
    ])),
    rituals: completedToday.some(isRitualTask) || ritualStreak.last_completed_date === today,
  };

  const pillarsCompleted = Object.values(pillars).filter(Boolean).length;
  const pillarsTotal = Object.values(pillars).length;
  const baseScore = (pillarsCompleted / pillarsTotal) * 90;
  const pulseBonus = Math.min(
    10,
    Math.round((Math.min(weeklyPulse.servings, WEEKLY_PULSE_TARGET) / WEEKLY_PULSE_TARGET) * 10),
  );
  const score = Math.min(100, Math.round(baseScore + pulseBonus));

  const ritualTodayCount = completedToday.filter(isRitualTask).length;
  const targetsV2: NutritionTargetsV2 = {
    produce400: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.produce400)),
    fiber25: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.fiber25)),
    legumes: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.legumes)),
    hydration: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.hydration)),
    salt_guard: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.salt_guard)),
    sugar_guard: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.sugar_guard)),
    healthy_fats: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.healthy_fats)),
    whole_foods: completedToday.some((task) => taskMatchesKeywords(task, TARGET_KEYWORDS.whole_foods)),
    completed: 0,
    total: 8,
  };
  targetsV2.completed = [
    targetsV2.produce400,
    targetsV2.fiber25,
    targetsV2.legumes,
    targetsV2.hydration,
    targetsV2.salt_guard,
    targetsV2.sugar_guard,
    targetsV2.healthy_fats,
    targetsV2.whole_foods,
  ].filter(Boolean).length;

  const arcTasks = tasks.filter((task) => toTaskText(task).includes(MEDITERRANEAN_ARC_KEYWORD));
  const arcCompleted = arcTasks.filter((task) => task.completed_today).length;
  const arcProgress = arcTasks.length > 0 ? arcCompleted / arcTasks.length : 0;
  const nextArcTask = arcTasks.find((task) => !task.completed_today)?.name || null;
  const arcPhase: MediterraneanArcProgress['phase'] = arcProgress >= 1
    ? 'Ascendant'
    : arcProgress >= 0.75
    ? 'Mastery'
    : arcProgress >= 0.5
    ? 'Expansion'
    : arcProgress >= 0.25
    ? 'Foundation'
    : 'Initiation';

  return {
    longevity: {
      score,
      pillars_completed: pillarsCompleted,
      pillars_total: pillarsTotal,
      pillars,
    },
    targets_v2: targetsV2,
    mediterranean_arc: {
      completed: arcCompleted,
      total: arcTasks.length,
      progress: arcProgress,
      phase: arcPhase,
      next_quest: nextArcTask,
    },
    weekly_pulse: {
      week_start: weeklyPulse.week_start,
      servings: weeklyPulse.servings,
      target: WEEKLY_PULSE_TARGET,
      reward_claimed: weeklyPulse.reward_claimed,
      reward_gold: WEEKLY_PULSE_REWARD_GOLD,
      progress: Math.max(0, Math.min(1, weeklyPulse.servings / WEEKLY_PULSE_TARGET)),
    },
    ritual_streak: {
      current: ritualStreak.current,
      best: ritualStreak.best,
      last_completed_date: ritualStreak.last_completed_date,
      today_completed: ritualStreak.last_completed_date === today || ritualTodayCount > 0,
      today_count: ritualTodayCount,
    },
  };
}

// ============================================================
// STATE
// ============================================================

interface GameState {
  initialized: boolean;
  loading: boolean;
  player: Player | null;
  creatures: Creature[];
  genes: Gene[];
  tasks: Task[];
  achievements: Achievement[];
  skills: Skill[];
  abilities: SpecialAbility[];
  notifications: Notification[];
  activeTab: TabId;
  selectedCreature: CreatureId | null;
  domainFilter: Domain | null;
  showEvolution: { creatureId: CreatureId; oldStage: number; newStage: number } | null;
  showNameInput: boolean;
  lastFeedDates: LastFeedDates;
  creatureHappiness: CreatureHappinessMap;
  shadowForecast: ShadowForecastState;
  rescueMode: RescueModeState;
  timebox: TimeboxState;
  raids: RaidBossState[];
  timeline: TimelineEvent[];
  calendar: DailyCalendarState;
  nutrition: NutritionInsights;
}

const initialState: GameState = {
  initialized: false,
  loading: true,
  player: null,
  creatures: [],
  genes: [],
  tasks: [],
  achievements: [],
  skills: [],
  abilities: [],
  notifications: [],
  activeTab: 'hub',
  selectedCreature: null,
  domainFilter: null,
  showEvolution: null,
  showNameInput: false,
  lastFeedDates: {},
  creatureHappiness: createDefaultCreatureHappiness(),
  shadowForecast: buildShadowForecast([]),
  rescueMode: createDefaultRescueMode(),
  timebox: createDefaultTimeboxState(),
  raids: createDefaultRaids(),
  timeline: [],
  calendar: buildDailyCalendarState(createDefaultDailyCalendarMeta()),
  nutrition: buildNutritionInsights([], createDefaultWeeklyPulseMeta(), createDefaultRitualStreakMeta()),
};

// ============================================================
// ACTIONS
// ============================================================

type GameAction =
  | {
    type: 'INIT_COMPLETE';
    player: Player;
    creatures: Creature[];
    genes: Gene[];
    tasks: Task[];
    achievements: Achievement[];
    skills: Skill[];
    abilities: SpecialAbility[];
    lastFeedDates: LastFeedDates;
    creatureHappiness: CreatureHappinessMap;
    shadowForecast: ShadowForecastState;
    rescueMode: RescueModeState;
    timebox: TimeboxState;
    raids: RaidBossState[];
    timeline: TimelineEvent[];
    calendar: DailyCalendarState;
    nutrition: NutritionInsights;
  }
  | { type: 'SHOW_NAME_INPUT' }
  | { type: 'SET_PLAYER_NAME'; name: string }
  | {
    type: 'TASK_COMPLETED';
    result: TaskCompletionResult;
    task: Task;
    achievements: Achievement[];
    nutrition: NutritionInsights;
    shadowForecast: ShadowForecastState;
    rescueMode: RescueModeState;
    timeline: TimelineEvent[];
  }
  | { type: 'GENE_FUSED'; creature: Creature; newGene: Gene; removedGeneIds: string[] }
  | { type: 'RENAME_CREATURE'; creatureId: CreatureId; customName: string | null }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_SELECTED_CREATURE'; id: CreatureId | null }
  | { type: 'SET_DOMAIN_FILTER'; domain: Domain | null }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'DISMISS_EVOLUTION' }
  | { type: 'RESET_DAILY_TASKS'; tasks: Task[]; nutrition: NutritionInsights }
  | { type: 'SET_LAST_FEED_DATES'; feedDates: LastFeedDates }
  | { type: 'SET_CREATURE_HAPPINESS'; creatureHappiness: CreatureHappinessMap }
  | { type: 'UPDATE_CREATURES'; creatures: Creature[] }
  | { type: 'UPDATE_PLAYER'; player: Player }
  | { type: 'UPDATE_SHADOW_FORECAST'; shadowForecast: ShadowForecastState }
  | { type: 'UPDATE_RESCUE_MODE'; rescueMode: RescueModeState }
  | { type: 'UPDATE_TIMEBOX'; timebox: TimeboxState }
  | { type: 'UPDATE_RAIDS'; raids: RaidBossState[] }
  | { type: 'UPDATE_TIMELINE'; timeline: TimelineEvent[] }
  | { type: 'UPDATE_CALENDAR'; calendar: DailyCalendarState }
  | { type: 'UPDATE_NUTRITION'; nutrition: NutritionInsights };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_COMPLETE':
      return {
        ...state,
        initialized: true,
        loading: false,
        player: action.player,
        creatures: action.creatures,
        genes: action.genes,
        tasks: action.tasks,
        achievements: action.achievements,
        skills: action.skills,
        abilities: action.abilities,
        showNameInput: false,
        lastFeedDates: action.lastFeedDates,
        creatureHappiness: action.creatureHappiness,
        shadowForecast: action.shadowForecast,
        rescueMode: action.rescueMode,
        timebox: action.timebox,
        raids: action.raids,
        timeline: action.timeline,
        calendar: action.calendar,
        nutrition: action.nutrition,
      };

    case 'SHOW_NAME_INPUT':
      return { ...state, loading: false, showNameInput: true };

    case 'SET_PLAYER_NAME':
      return state;

    case 'TASK_COMPLETED': {
      const { result, task } = action;
      const updatedTasks = state.tasks.map(t =>
        t.id === task.id ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t
      );
      return {
        ...state,
        player: result.player,
        creatures: result.updatedCreatures,
        genes: [...state.genes, result.gene, ...result.streakGenes],
        tasks: updatedTasks,
        achievements: action.achievements,
        skills: result.updatedSkills || state.skills,
        abilities: result.updatedAbilities || state.abilities,
        nutrition: action.nutrition,
        shadowForecast: action.shadowForecast,
        rescueMode: action.rescueMode,
        timeline: action.timeline,
        notifications: [...state.notifications, ...result.notifications],
        showEvolution: result.evolved ? {
          creatureId: result.creature.id,
          oldStage: result.oldStage,
          newStage: result.newStage,
        } : state.showEvolution,
      };
    }

    case 'GENE_FUSED': {
      const updatedGenes = state.genes
        .filter(g => !action.removedGeneIds.includes(g.id))
        .concat(action.newGene);
      const updatedCreatures = state.creatures.map(c =>
        c.id === action.creature.id ? action.creature : c
      );
      return { ...state, genes: updatedGenes, creatures: updatedCreatures };
    }

    case 'RENAME_CREATURE':
      return {
        ...state,
        creatures: state.creatures.map(c => (
          c.id === action.creatureId
            ? { ...c, custom_name: action.customName || undefined }
            : c
        )),
      };

    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_SELECTED_CREATURE':
      return { ...state, selectedCreature: action.id };

    case 'SET_DOMAIN_FILTER':
      return { ...state, domainFilter: action.domain };

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.notification],
      };

    case 'DISMISS_EVOLUTION':
      return { ...state, showEvolution: null };

    case 'RESET_DAILY_TASKS':
      return { ...state, tasks: action.tasks, nutrition: action.nutrition };

    case 'SET_LAST_FEED_DATES':
      return { ...state, lastFeedDates: action.feedDates };

    case 'SET_CREATURE_HAPPINESS':
      return { ...state, creatureHappiness: action.creatureHappiness };

    case 'UPDATE_CREATURES':
      return { ...state, creatures: action.creatures };

    case 'UPDATE_PLAYER':
      return { ...state, player: action.player };

    case 'UPDATE_SHADOW_FORECAST':
      return { ...state, shadowForecast: action.shadowForecast };

    case 'UPDATE_RESCUE_MODE':
      return { ...state, rescueMode: action.rescueMode };

    case 'UPDATE_TIMEBOX':
      return { ...state, timebox: action.timebox };

    case 'UPDATE_RAIDS':
      return { ...state, raids: action.raids };

    case 'UPDATE_TIMELINE':
      return { ...state, timeline: action.timeline };

    case 'UPDATE_CALENDAR':
      return { ...state, calendar: action.calendar };

    case 'UPDATE_NUTRITION':
      return { ...state, nutrition: action.nutrition };

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  completeTask: (task: Task) => Promise<void>;
  fuseGenes: (creatureId: CreatureId, geneType: GeneType, tier: GeneTier) => Promise<void>;
  renameCreature: (creatureId: CreatureId, customName: string) => Promise<void>;
  feedCreature: (creatureId: CreatureId) => Promise<{ success: boolean; message: string }>;
  petCreature: (creatureId: CreatureId) => Promise<{ success: boolean; message: string; happiness: number }>;
  addWatchTimeForCreature: (creatureId: CreatureId, watchedSeconds: number) => Promise<void>;
  completeTimeboxMission: (minutes: TimeboxMinutes) => Promise<{ success: boolean; message: string }>;
  resolveRaidBattle: (raidId: string, totalDamage: number) => Promise<{ success: boolean; message: string; raid?: RaidBossState }>;
  claimDailyCalendarReward: () => Promise<{ success: boolean; message: string }>;
  claimWeeklyPulseReward: () => Promise<{ success: boolean; message: string }>;
  initializeGame: (name: string) => Promise<void>;
  setTab: (tab: TabId) => void;
  selectCreature: (id: CreatureId | null) => void;
  setDomainFilter: (domain: Domain | null) => void;
  dismissNotification: (id: string) => void;
  dismissEvolution: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  const serverClockOffsetMsRef = useRef(0);
  stateRef.current = state;

  const getReferenceNow = useCallback(() => {
    return new Date(Date.now() + serverClockOffsetMsRef.current);
  }, []);

  const syncReferenceClock = useCallback(async () => {
    const serverNow = await apiGetServerTime();
    if (serverNow) {
      serverClockOffsetMsRef.current = serverNow.getTime() - Date.now();
      return serverNow;
    }
    return getReferenceNow();
  }, [getReferenceNow]);

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const player = await loadPlayer();
        if (!player) {
          dispatch({ type: 'SHOW_NAME_INPUT' });
          return;
        }

        const creatures = await loadAllCreatures();
        const genes = await loadAllGenes();
        let tasks = await loadAllTasks();
        let achievements = await loadAllAchievements();

        const defaultTasks = generateDefaultTasks();
        if (tasks.length === 0) {
          tasks = defaultTasks;
          await saveTasks(tasks);
        } else {
          // Keep player progress, but append any newly introduced default quests.
          const existingTaskIds = new Set(tasks.map((t) => t.id));
          const missingTasks = defaultTasks.filter((t) => !existingTaskIds.has(t.id));
          if (missingTasks.length > 0) {
            await saveTasks(missingTasks);
            tasks = [...tasks, ...missingTasks];
          }
        }

        const defaultAchievements = getDefaultAchievements();
        if (achievements.length === 0) {
          achievements = defaultAchievements;
          await saveAchievements(achievements);
        } else {
          // Preserve player unlock history, but append any newly introduced trophies.
          const existingAchievementIds = new Set(achievements.map((a) => a.id));
          const missingAchievements = defaultAchievements.filter((a) => !existingAchievementIds.has(a.id));
          if (missingAchievements.length > 0) {
            await saveAchievements(missingAchievements);
            achievements = [...achievements, ...missingAchievements];
          }
        }

        let skills = await loadAllSkillsDB();
        if (skills.length === 0) {
          skills = getAllSkills();
          await saveSkills(skills);
        }

        let abilities = await loadAllAbilitiesDB();
        if (abilities.length === 0) {
          abilities = getAllAbilities();
          await saveAbilities(abilities);
        }
        const rawLastFeedDates = await loadMeta(META_LAST_FEED_DATES);
        const legacyLastFeedDate = await loadMeta(LEGACY_META_LAST_FEED_DATE);
        const lastFeedDates = migrateLastFeedDates(rawLastFeedDates, legacyLastFeedDate);
        const now = await syncReferenceClock();
        const weeklyPulse = normalizeWeeklyPulseMeta(await loadMeta(META_WEEKLY_PULSE), now);
        const ritualStreak = normalizeRitualStreakMeta(await loadMeta(META_RITUAL_STREAK), now);
        const creatureHappiness = normalizeCreatureHappiness(await loadMeta(META_CREATURE_HAPPINESS));
        const shadowForecast = buildShadowForecast(tasks, now);
        const normalizedRescue = normalizeRescueMode(await loadMeta(META_RESCUE_MODE), tasks, now);
        const rescueActivation = maybeActivateRescueMode(normalizedRescue, player, tasks, now);
        const rescueMode = rescueActivation.rescueMode;
        const timebox = normalizeTimeboxState(await loadMeta(META_TIMEBOX), now);
        const raids = normalizeRaids(await loadMeta(META_RAIDS), now);
        let timeline = normalizeTimeline(await loadMeta(META_TIMELINE));
        if (timeline.length === 0) {
          timeline = [
            createTimelineEvent(
              'System Linked',
              'Your shadow archive is now recording milestones.',
              'system',
              undefined,
              now.getTime(),
            ),
          ];
        }
        if (rescueActivation.activated) {
          timeline = pushTimelineEvent(
            timeline,
            createTimelineEvent(
              'Rescue Mode Activated',
              'Streak break detected. Complete rescue quests in 24h to stabilize momentum.',
              'rescue',
              undefined,
              now.getTime(),
            ),
          );
        }
        const calendarMeta = normalizeDailyCalendarMeta(await loadMeta(META_DAILY_CALENDAR), now);
        const calendar = buildDailyCalendarState(calendarMeta, now);
        const nutrition = buildNutritionInsights(tasks, weeklyPulse, ritualStreak, now);
        await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
        await saveMeta(META_RITUAL_STREAK, ritualStreak);
        await saveMeta(META_LAST_FEED_DATES, lastFeedDates);
        await saveMeta(META_CREATURE_HAPPINESS, creatureHappiness);
        await saveMeta(META_SHADOW_FORECAST, shadowForecast);
        await saveMeta(META_RESCUE_MODE, rescueMode);
        await saveMeta(META_TIMEBOX, timebox);
        await saveMeta(META_RAIDS, raids);
        await saveMeta(META_TIMELINE, timeline);
        await saveMeta(META_DAILY_CALENDAR, calendarMeta);

        // Daily reset is handled in the separate useEffect below

        dispatch({
          type: 'INIT_COMPLETE',
          player,
          creatures,
          genes,
          tasks,
          achievements,
          skills,
          abilities,
          lastFeedDates,
          creatureHappiness,
          shadowForecast,
          rescueMode,
          timebox,
          raids,
          timeline,
          calendar,
          nutrition,
        });
      } catch (err) {
        console.error('Failed to load game state:', err);
        dispatch({ type: 'SHOW_NAME_INPUT' });
      }
    })();
  }, [syncReferenceClock]);

  // Daily reset check — runs on mount and sets up a timer for midnight
  useEffect(() => {
    if (!state.initialized || !state.player) return;

    const performDailyReset = async () => {
      const s = stateRef.current;
      if (!s.player) return;
      const now = await syncReferenceClock();
      const today = toIsoDate(now);

      // Load the last reset date from meta
      const lastReset = (await loadMeta('last_daily_reset')) as string | undefined;
      if (lastReset === today) return; // Already reset today

      const weeklyPulse = normalizeWeeklyPulseMeta(await loadMeta(META_WEEKLY_PULSE), now);
      const ritualStreak = normalizeRitualStreakMeta(await loadMeta(META_RITUAL_STREAK), now);
      const raids = normalizeRaids(await loadMeta(META_RAIDS), now);
      const timebox = normalizeTimeboxState(await loadMeta(META_TIMEBOX), now);
      let timeline = normalizeTimeline(await loadMeta(META_TIMELINE));
      const calendarMeta = normalizeDailyCalendarMeta(await loadMeta(META_DAILY_CALENDAR), now);
      const calendar = buildDailyCalendarState(calendarMeta, now);
      await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
      await saveMeta(META_RITUAL_STREAK, ritualStreak);
      await saveMeta(META_DAILY_CALENDAR, calendarMeta);
      await saveMeta(META_RAIDS, raids);
      await saveMeta(META_TIMEBOX, timebox);

      // Check if any daily task needs resetting
      const dailyTasks = s.tasks.filter(t => t.type === 'daily' && t.completed_today);
      let nextTasks = s.tasks;
      if (dailyTasks.length > 0 || lastReset !== today) {
        const resetTasks = s.tasks.map(t =>
          t.type === 'daily' ? { ...t, completed_today: false } : t
        );
        nextTasks = resetTasks;
        const nutrition = buildNutritionInsights(resetTasks, weeklyPulse, ritualStreak, now);
        await saveTasks(resetTasks);
        await saveMeta('last_daily_reset', today);
        dispatch({ type: 'RESET_DAILY_TASKS', tasks: resetTasks, nutrition });
        dispatch({ type: 'UPDATE_CALENDAR', calendar });
      } else {
        const nutrition = buildNutritionInsights(s.tasks, weeklyPulse, ritualStreak, now);
        dispatch({ type: 'UPDATE_NUTRITION', nutrition });
        dispatch({ type: 'UPDATE_CALENDAR', calendar });
      }

      const shadowForecast = buildShadowForecast(nextTasks, now);
      const normalizedRescue = normalizeRescueMode(await loadMeta(META_RESCUE_MODE), nextTasks, now);
      const rescueActivation = maybeActivateRescueMode(normalizedRescue, s.player, nextTasks, now);
      const rescueMode = rescueActivation.rescueMode;
      if (rescueActivation.activated) {
        timeline = pushTimelineEvent(
          timeline,
          createTimelineEvent(
            'Rescue Mode Activated',
            'Streak break detected. Complete rescue quests in 24h to stabilize momentum.',
            'rescue',
          ),
        );
      }
      await saveMeta(META_SHADOW_FORECAST, shadowForecast);
      await saveMeta(META_RESCUE_MODE, rescueMode);
      await saveMeta(META_TIMELINE, timeline);
      dispatch({ type: 'UPDATE_SHADOW_FORECAST', shadowForecast });
      dispatch({ type: 'UPDATE_RESCUE_MODE', rescueMode });
      dispatch({ type: 'UPDATE_TIMEBOX', timebox });
      dispatch({ type: 'UPDATE_RAIDS', raids });
      dispatch({ type: 'UPDATE_TIMELINE', timeline });
    };

    performDailyReset();

    // Re-check frequently so resets stay correct even after sleep/wake or timezone drift.
    const intervalId = setInterval(performDailyReset, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [state.initialized, state.player, syncReferenceClock]);

  const initializeGame = useCallback(async (name: string) => {
    const player = createDefaultPlayer(name);
    const creatures = createAllCreatures(player.id);
    const tasks = generateDefaultTasks();
    const achievements = getDefaultAchievements();
    const skills = getAllSkills();
    const abilities = getAllAbilities();
    const now = await syncReferenceClock();
    const weeklyPulse = createDefaultWeeklyPulseMeta(now);
    const ritualStreak = createDefaultRitualStreakMeta();
    const creatureHappiness = createDefaultCreatureHappiness();
    const shadowForecast = buildShadowForecast(tasks, now);
    const rescueMode = createDefaultRescueMode();
    const timebox = createDefaultTimeboxState(now);
    const raids = createDefaultRaids(now);
    const timeline = [
      createTimelineEvent(
        'System Linked',
        'Hunter initialization complete. Chronicle recording started.',
        'system',
      ),
    ];
    const calendarMeta = createDefaultDailyCalendarMeta();
    const calendar = buildDailyCalendarState(calendarMeta, now);
    const nutrition = buildNutritionInsights(tasks, weeklyPulse, ritualStreak, now);

    await savePlayer(player);
    await saveCreaturesBatch(creatures);
    await saveTasks(tasks);
    await saveAchievements(achievements);
    await saveSkills(skills);
    await saveAbilities(abilities);
    await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
    await saveMeta(META_RITUAL_STREAK, ritualStreak);
    await saveMeta(META_LAST_FEED_DATES, {});
    await saveMeta(META_CREATURE_HAPPINESS, creatureHappiness);
    await saveMeta(META_SHADOW_FORECAST, shadowForecast);
    await saveMeta(META_RESCUE_MODE, rescueMode);
    await saveMeta(META_TIMEBOX, timebox);
    await saveMeta(META_RAIDS, raids);
    await saveMeta(META_TIMELINE, timeline);
    await saveMeta(META_DAILY_CALENDAR, calendarMeta);

    dispatch({
      type: 'INIT_COMPLETE',
      player,
      creatures,
      genes: [],
      tasks,
      achievements,
      skills,
      abilities,
      lastFeedDates: {},
      creatureHappiness,
      shadowForecast,
      rescueMode,
      timebox,
      raids,
      timeline,
      calendar,
      nutrition,
    });
  }, [syncReferenceClock]);

  const handleCompleteTask = useCallback(async (task: Task) => {
    const s = stateRef.current;
    if (!s.player || task.completed_today) return;

    let result = engineCompleteTask(task, s.player, s.creatures, s.achievements, s.skills, s.abilities);
    const now = new Date();
    const today = toIsoDate(now);
    const yesterday = getYesterdayIso(now);
    let timeline = normalizeTimeline(await loadMeta(META_TIMELINE));
    const activeCreatureId = DOMAIN_TO_CREATURE[task.domain];
    const activeCreatureHappiness = clampHappiness(s.creatureHappiness[activeCreatureId] ?? CREATURE_HAPPINESS_BASELINE);
    const bondPerk = getBondPerkProfile(activeCreatureHappiness);

    if (bondPerk.gold_multiplier > 1) {
      const extraGold = Math.max(1, Math.round(task.rewards.gold * (bondPerk.gold_multiplier - 1)));
      result = {
        ...result,
        player: {
          ...result.player,
          gold: result.player.gold + extraGold,
        },
        notifications: [
          ...result.notifications,
          {
            id: `bond_gold_${Date.now()}`,
            title: 'Bond Perk Triggered',
            message: `${CREATURE_NAMES[activeCreatureId]} granted +${extraGold} gold (${bondPerk.tier}).`,
            type: 'streak',
            domain: task.domain,
            created_at: Date.now(),
          },
        ],
      };
      timeline = pushTimelineEvent(
        timeline,
        createTimelineEvent(
          'Bond Perk',
          `${CREATURE_NAMES[activeCreatureId]} boosted rewards for ${task.name}.`,
          'bond',
          task.domain,
        ),
      );
    }

    if (bondPerk.mutation_chance > 0 && Math.random() < bondPerk.mutation_chance) {
      const mutationCreature = result.updatedCreatures.find((creature) => creature.id === activeCreatureId);
      if (mutationCreature) {
        const bonusGene = generateGene(
          task.rewards.gene_type,
          task.domain,
          `${task.id}_bond_${Date.now()}`,
          mutationCreature,
        );
        const mutationResult = applyGeneToCreature(mutationCreature, bonusGene);
        const updatedCreatures = result.updatedCreatures.map((creature) =>
          creature.id === activeCreatureId ? mutationResult.creature : creature
        );
        let updatedPlayer: Player = {
          ...result.player,
          total_genes_acquired: result.player.total_genes_acquired + 1,
          total_power: updatedCreatures.reduce((sum, creature) => sum + creature.total_power, 0),
        };
        const rankFromMutation = calculateHunterRank(updatedPlayer.total_power);
        const extraNotifications: Notification[] = [
          {
            id: `bond_gene_${Date.now()}`,
            title: 'Bond Mutation Spark',
            message: `${bonusGene.type.replace(/_/g, ' ')} emerged from creature bond resonance.`,
            type: 'gene',
            domain: task.domain,
            created_at: Date.now(),
          },
        ];
        if (rankFromMutation !== updatedPlayer.hunter_rank) {
          extraNotifications.push({
            id: `bond_rank_${Date.now()}`,
            title: 'RANK UP',
            message: `Hunter Rank: ${updatedPlayer.hunter_rank} → ${rankFromMutation}`,
            type: 'rank',
            created_at: Date.now(),
          });
          updatedPlayer = { ...updatedPlayer, hunter_rank: rankFromMutation };
        }
        if (mutationResult.evolved && !result.evolved) {
          extraNotifications.push({
            id: `bond_evolution_${Date.now()}`,
            title: 'EVOLUTION',
            message: `${CREATURE_NAMES[activeCreatureId]} evolved through bond resonance.`,
            type: 'evolution',
            domain: task.domain,
            created_at: Date.now(),
          });
        }
        result = {
          ...result,
          creature: mutationResult.creature,
          updatedCreatures,
          player: updatedPlayer,
          streakGenes: [...result.streakGenes, bonusGene],
          evolved: result.evolved || mutationResult.evolved,
          oldStage: result.evolved ? result.oldStage : mutationResult.oldStage,
          newStage: result.evolved ? result.newStage : mutationResult.newStage,
          notifications: [...result.notifications, ...extraNotifications],
        };
        timeline = pushTimelineEvent(
          timeline,
          createTimelineEvent(
            'Mutation Spark',
            `${CREATURE_NAMES[activeCreatureId]} generated a bonus gene from high happiness.`,
            'bond',
            task.domain,
          ),
        );
      }
    }

    const updatedTasks = s.tasks.map(t =>
      t.id === task.id ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t
    );

    const weeklyPulse = normalizeWeeklyPulseMeta(await loadMeta(META_WEEKLY_PULSE), now);
    if (isPulseTask(task)) {
      weeklyPulse.servings += 1;
    }

    const ritualStreak = normalizeRitualStreakMeta(await loadMeta(META_RITUAL_STREAK), now);
    if (isRitualTask(task) && ritualStreak.last_completed_date !== today) {
      ritualStreak.current = ritualStreak.last_completed_date === yesterday
        ? ritualStreak.current + 1
        : 1;
      ritualStreak.best = Math.max(ritualStreak.best, ritualStreak.current);
      ritualStreak.last_completed_date = today;
    }

    const shadowForecast = buildShadowForecast(updatedTasks, now);
    let rescueMode = normalizeRescueMode(await loadMeta(META_RESCUE_MODE), updatedTasks, now);
    if (rescueMode.active) {
      const rescueCompleted = rescueMode.quest_ids.filter((questId) =>
        updatedTasks.find((entry) => entry.id === questId)?.completed_today
      ).length;
      rescueMode = {
        ...rescueMode,
        completed_count: Math.min(rescueMode.required_count, rescueCompleted),
      };

      if (rescueMode.quest_ids.includes(task.id)) {
        timeline = pushTimelineEvent(
          timeline,
          createTimelineEvent(
            'Rescue Objective Cleared',
            `${task.name} completed (${rescueMode.completed_count}/${rescueMode.required_count}).`,
            'rescue',
            task.domain,
          ),
        );
      }

      if (rescueMode.completed_count >= rescueMode.required_count) {
        result = {
          ...result,
          player: {
            ...result.player,
            gold: result.player.gold + RESCUE_REWARD_GOLD,
          },
          notifications: [
            ...result.notifications,
            {
              id: `rescue_clear_${Date.now()}`,
              title: 'Rescue Mode Complete',
              message: `Recovery line stabilized. +${RESCUE_REWARD_GOLD} gold secured.`,
              type: 'streak',
              created_at: Date.now(),
            },
          ],
        };
        rescueMode = { ...rescueMode, active: false, resolved: true };
        timeline = pushTimelineEvent(
          timeline,
          createTimelineEvent(
            'Rescue Mode Stabilized',
            `Recovery chain complete. Bonus +${RESCUE_REWARD_GOLD} gold secured.`,
            'rescue',
          ),
        );
      }
    }

    timeline = pushTimelineEvent(
      timeline,
      createTimelineEvent(
        'Quest Cleared',
        `${task.name} completed (+${task.rewards.gold} gold).`,
        'task',
        task.domain,
      ),
    );
    if (result.evolved) {
      timeline = pushTimelineEvent(
        timeline,
        createTimelineEvent(
          'Evolution',
          `${CREATURE_NAMES[result.creature.id]} reached ${result.newStage}.`,
          'evolution',
          result.creature.domain,
        ),
      );
    }

    const nutrition = buildNutritionInsights(updatedTasks, weeklyPulse, ritualStreak, now);

    // Persist
    await savePlayer(result.player);
    await saveCreature(result.creature);
    await saveGene(result.gene);
    for (const sg of result.streakGenes) await saveGene(sg);
    await saveTasks(updatedTasks);
    await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
    await saveMeta(META_RITUAL_STREAK, ritualStreak);
    await saveMeta(META_SHADOW_FORECAST, shadowForecast);
    await saveMeta(META_RESCUE_MODE, rescueMode);
    await saveMeta(META_TIMELINE, timeline);

    // Save creatures that actually changed (primary creature + chain_wraith from streak genes)
    // Use total_genes/total_power comparison instead of reference equality
    for (const c of result.updatedCreatures) {
      const original = s.creatures.find(o => o.id === c.id);
      if (!original || original.total_genes !== c.total_genes || original.total_power !== c.total_power || original.evolution_stage !== c.evolution_stage) {
        await saveCreature(c);
      }
    }

    // Re-check achievements with full state
    const achResult = checkAchievements(result.player, result.updatedCreatures, s.achievements, result.updatedSkills, result.updatedAbilities);
    await saveAchievements(achResult.achievements);

    // Save updated skills and abilities
    if (result.updatedSkills) await saveSkills(result.updatedSkills);
    if (result.updatedAbilities) await saveAbilities(result.updatedAbilities);

    dispatch({
      type: 'TASK_COMPLETED',
      result,
      task,
      achievements: achResult.achievements,
      nutrition,
      shadowForecast,
      rescueMode,
      timeline,
    });
  }, []);

  const handleFuseGenes = useCallback(async (creatureId: CreatureId, geneType: GeneType, tier: GeneTier) => {
    const s = stateRef.current;
    const creature = s.creatures.find(c => c.id === creatureId);
    if (!creature) return;

    const result = engineFuseGenes(creature, geneType, tier, s.genes);
    if (!result) return;

    await saveCreature(result.creature);
    await saveGene(result.newGene);
    await deleteGenes(result.removedGeneIds);

    dispatch({
      type: 'GENE_FUSED',
      creature: result.creature,
      newGene: result.newGene,
      removedGeneIds: result.removedGeneIds,
    });
  }, []);

  const handleRenameCreature = useCallback(async (creatureId: CreatureId, customName: string) => {
    const s = stateRef.current;
    const current = s.creatures.find(c => c.id === creatureId);
    if (!current) return;

    const trimmed = customName.trim().slice(0, 28);
    const updated: Creature = {
      ...current,
      custom_name: trimmed.length > 0 ? trimmed : undefined,
    };
    await saveCreature(updated);

    dispatch({
      type: 'RENAME_CREATURE',
      creatureId,
      customName: trimmed.length > 0 ? trimmed : null,
    });
  }, []);

  const handlePetCreature = useCallback(async (creatureId: CreatureId) => {
    const s = stateRef.current;
    const creature = s.creatures.find(c => c.id === creatureId);
    if (!creature) {
      return { success: false, message: 'Creature not found', happiness: CREATURE_HAPPINESS_BASELINE };
    }

    const persisted = normalizeCreatureHappiness(await loadMeta(META_CREATURE_HAPPINESS));
    const currentMap: CreatureHappinessMap = { ...persisted, ...s.creatureHappiness };
    const currentValue = currentMap[creatureId] ?? CREATURE_HAPPINESS_BASELINE;
    const nextValue = clampHappiness(currentValue + PET_HAPPINESS_BOOST);
    const nextMap: CreatureHappinessMap = { ...currentMap, [creatureId]: nextValue };
    const creatureName = creature.custom_name || CREATURE_NAMES[creature.id];

    await saveMeta(META_CREATURE_HAPPINESS, nextMap);
    const timeline = pushTimelineEvent(
      normalizeTimeline(await loadMeta(META_TIMELINE)),
      createTimelineEvent(
        'Creature Petted',
        `${creatureName} gained happiness from direct interaction.`,
        'bond',
        creature.domain,
      ),
    );
    await saveMeta(META_TIMELINE, timeline);
    dispatch({ type: 'SET_CREATURE_HAPPINESS', creatureHappiness: nextMap });
    dispatch({ type: 'UPDATE_TIMELINE', timeline });

    return {
      success: true,
      message: `${creatureName} enjoyed the pet. Happiness ${nextValue}%`,
      happiness: nextValue,
    };
  }, []);

  const handleAddWatchTimeForCreature = useCallback(async (creatureId: CreatureId, watchedSeconds: number) => {
    const s = stateRef.current;
    if (!s.creatures.some(c => c.id === creatureId)) return;
    const gain = Math.floor(watchedSeconds / WATCH_SECONDS_PER_POINT);
    if (gain <= 0) return;

    const persisted = normalizeCreatureHappiness(await loadMeta(META_CREATURE_HAPPINESS));
    const currentMap: CreatureHappinessMap = { ...persisted, ...s.creatureHappiness };
    const currentValue = currentMap[creatureId] ?? CREATURE_HAPPINESS_BASELINE;
    const nextValue = clampHappiness(currentValue + gain);
    if (nextValue === currentValue) return;

    const nextMap: CreatureHappinessMap = { ...currentMap, [creatureId]: nextValue };
    await saveMeta(META_CREATURE_HAPPINESS, nextMap);
    dispatch({ type: 'SET_CREATURE_HAPPINESS', creatureHappiness: nextMap });
  }, []);

  const handleFeedCreature = useCallback(async (creatureId: CreatureId) => {
    const s = stateRef.current;
    const creature = s.creatures.find(c => c.id === creatureId);
    if (!creature) {
      return { success: false, message: 'Creature not found' };
    }

    const today = new Date().toISOString().split('T')[0];
    const persistedFeedDates = normalizeLastFeedDates(await loadMeta(META_LAST_FEED_DATES));
    const lastFeedDates: LastFeedDates = { ...persistedFeedDates, ...s.lastFeedDates };
    const creatureName = creature.custom_name || CREATURE_NAMES[creature.id];
    if (lastFeedDates[creatureId] === today) {
      return { success: false, message: `${creatureName} has already been fed today.` };
    }

    const updatedLastFeedDates: LastFeedDates = {
      ...lastFeedDates,
      [creatureId]: today,
    };
    const persistedHappiness = normalizeCreatureHappiness(await loadMeta(META_CREATURE_HAPPINESS));
    const currentHappiness: CreatureHappinessMap = { ...persistedHappiness, ...s.creatureHappiness };
    const boostedHappiness = clampHappiness(
      (currentHappiness[creatureId] ?? CREATURE_HAPPINESS_BASELINE) + FEED_HAPPINESS_BOOST,
    );
    const nextHappiness: CreatureHappinessMap = {
      ...currentHappiness,
      [creatureId]: boostedHappiness,
    };

    await saveMeta(META_LAST_FEED_DATES, updatedLastFeedDates);
    await saveMeta(META_CREATURE_HAPPINESS, nextHappiness);
    const timeline = pushTimelineEvent(
      normalizeTimeline(await loadMeta(META_TIMELINE)),
      createTimelineEvent(
        'Creature Fed',
        `${creatureName} was fed and happiness rose to ${boostedHappiness}%.`,
        'bond',
        creature.domain,
      ),
    );
    await saveMeta(META_TIMELINE, timeline);
    dispatch({ type: 'SET_LAST_FEED_DATES', feedDates: updatedLastFeedDates });
    dispatch({ type: 'SET_CREATURE_HAPPINESS', creatureHappiness: nextHappiness });
    dispatch({ type: 'UPDATE_TIMELINE', timeline });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `feed_${Date.now()}`,
        title: 'Creature Fed',
        message: `${creature.custom_name || CREATURE_NAMES[creature.id]} devoured the food particles.`,
        type: 'streak',
        domain: creature.domain,
        duration: 3500,
        created_at: Date.now(),
      },
    });
    return {
      success: true,
      message: `${creatureName} fed. Happiness ${boostedHappiness}%. This creature can be fed again tomorrow.`,
    };
  }, []);

  const handleCompleteTimeboxMission = useCallback(async (minutes: TimeboxMinutes) => {
    const s = stateRef.current;
    if (!s.player) {
      return { success: false, message: 'Player data not found.' };
    }
    const now = new Date();
    const timebox = normalizeTimeboxState(await loadMeta(META_TIMEBOX), now);
    const mission = timebox.missions.find((entry) => entry.minutes === minutes);
    if (!mission) {
      return { success: false, message: 'Mission not found.' };
    }
    if (mission.completed) {
      return { success: false, message: `${minutes}-minute mission already completed today.` };
    }

    mission.completed = true;
    mission.completed_at = now.toISOString();
    timebox.completed_count = timebox.missions.filter((entry) => entry.completed).length;

    const updatedPlayer: Player = {
      ...s.player,
      gold: s.player.gold + mission.reward_gold,
    };
    const timeline = pushTimelineEvent(
      normalizeTimeline(await loadMeta(META_TIMELINE)),
      createTimelineEvent(
        `Timebox ${minutes}m Complete`,
        `${mission.label} completed. Reward +${mission.reward_gold} gold.`,
        'task',
      ),
    );

    await saveMeta(META_TIMEBOX, timebox);
    await saveMeta(META_TIMELINE, timeline);
    await savePlayer(updatedPlayer);

    dispatch({ type: 'UPDATE_TIMEBOX', timebox });
    dispatch({ type: 'UPDATE_TIMELINE', timeline });
    dispatch({ type: 'UPDATE_PLAYER', player: updatedPlayer });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `timebox_${minutes}_${Date.now()}`,
        title: 'Timebox Mission Complete',
        message: `${minutes}-minute mission cleared. +${mission.reward_gold} gold.`,
        type: 'streak',
        created_at: Date.now(),
      },
    });

    return { success: true, message: `${minutes}-minute mission complete. +${mission.reward_gold} gold.` };
  }, []);

  const handleResolveRaidBattle = useCallback(async (raidId: string, totalDamage: number) => {
    const s = stateRef.current;
    if (!s.player) {
      return { success: false, message: 'Player data not found.' };
    }

    const now = new Date();
    const today = toIsoDate(now);
    const raids = normalizeRaids(await loadMeta(META_RAIDS), now);
    const raid = raids.find((entry) => entry.id === raidId);
    if (!raid) {
      return { success: false, message: 'Raid not found.' };
    }
    if (raid.completed_at) {
      return { success: false, message: `${raid.name} already defeated this week.`, raid };
    }
    if (raid.last_battle_date === today) {
      return { success: false, message: `${raid.name} already challenged today.`, raid };
    }

    const safeDamage = Math.max(1, Math.round(totalDamage));
    raid.hp = Math.max(0, raid.hp - safeDamage);
    raid.last_battle_date = today;

    let updatedPlayer = s.player;
    let message = `${raid.name} took ${safeDamage} damage.`;
    if (raid.hp <= 0) {
      raid.completed_at = now.toISOString();
      const rewardGold = 120 + (raid.required_domains.length * 15);
      updatedPlayer = {
        ...s.player,
        gold: s.player.gold + rewardGold,
      };
      message = `${raid.name} collapsed. Raid reward +${rewardGold} gold.`;
      await savePlayer(updatedPlayer);
      dispatch({ type: 'UPDATE_PLAYER', player: updatedPlayer });
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          id: `raid_clear_${Date.now()}`,
          title: 'Raid Boss Defeated',
          message,
          type: 'rank',
          domain: raid.domain,
          created_at: Date.now(),
        },
      });
    } else {
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          id: `raid_hit_${Date.now()}`,
          title: 'Raid Damage Recorded',
          message,
          type: 'streak',
          domain: raid.domain,
          created_at: Date.now(),
        },
      });
    }

    const timeline = pushTimelineEvent(
      normalizeTimeline(await loadMeta(META_TIMELINE)),
      createTimelineEvent(
        raid.hp <= 0 ? 'Raid Cleared' : 'Raid Assault',
        raid.hp <= 0
          ? `${raid.name} defeated. Weekly raid completed.`
          : `${raid.name} took ${safeDamage} damage (${raid.hp}/${raid.max_hp} HP left).`,
        'raid',
        raid.domain,
      ),
    );

    await saveMeta(META_RAIDS, raids);
    await saveMeta(META_TIMELINE, timeline);
    dispatch({ type: 'UPDATE_RAIDS', raids: [...raids] });
    dispatch({ type: 'UPDATE_TIMELINE', timeline });

    return { success: true, message, raid };
  }, []);

  const handleClaimDailyCalendarReward = useCallback(async () => {
    const s = stateRef.current;
    if (!s.player) {
      return { success: false, message: 'Player data not found.' };
    }

    const now = new Date();
    const today = toIsoDate(now);
    const yesterday = getYesterdayIso(now);
    const calendarMeta = normalizeDailyCalendarMeta(await loadMeta(META_DAILY_CALENDAR), now);

    if (calendarMeta.last_claim_date === today) {
      const calendar = buildDailyCalendarState(calendarMeta, now);
      dispatch({ type: 'UPDATE_CALENDAR', calendar });
      return { success: false, message: 'Daily calendar reward already claimed today.' };
    }

    const reward = getCalendarRewardByIndex(calendarMeta.cycle_index);
    calendarMeta.consecutive_claims = calendarMeta.last_claim_date === yesterday
      ? calendarMeta.consecutive_claims + 1
      : 1;
    calendarMeta.best_consecutive_claims = Math.max(
      calendarMeta.best_consecutive_claims,
      calendarMeta.consecutive_claims,
    );
    calendarMeta.last_claim_date = today;
    calendarMeta.cycle_index = (calendarMeta.cycle_index + 1) % DAILY_CALENDAR_REWARDS.length;

    const updatedPlayer: Player = {
      ...s.player,
      gold: s.player.gold + reward.gold,
    };
    const calendar = buildDailyCalendarState(calendarMeta, now);

    await savePlayer(updatedPlayer);
    await saveMeta(META_DAILY_CALENDAR, calendarMeta);

    dispatch({ type: 'UPDATE_PLAYER', player: updatedPlayer });
    dispatch({ type: 'UPDATE_CALENDAR', calendar });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `calendar_reward_${Date.now()}`,
        title: 'Daily Reward Claimed',
        message: `Day ${reward.day} ${reward.title}: +${reward.gold} gold.`,
        type: 'streak',
        domain: 'health',
        duration: 3600,
        created_at: Date.now(),
      },
    });
    const timeline = pushTimelineEvent(
      normalizeTimeline(await loadMeta(META_TIMELINE)),
      createTimelineEvent(
        'Daily Reward Claimed',
        `Day ${reward.day} ${reward.title} claimed for +${reward.gold} gold.`,
        'calendar',
      ),
    );
    await saveMeta(META_TIMELINE, timeline);
    dispatch({ type: 'UPDATE_TIMELINE', timeline });

    return {
      success: true,
      message: `Claimed Day ${reward.day}: +${reward.gold} gold.`,
    };
  }, []);

  const handleClaimWeeklyPulseReward = useCallback(async () => {
    const s = stateRef.current;
    if (!s.player) {
      return { success: false, message: 'Player data not found.' };
    }

    const now = new Date();
    const weeklyPulse = normalizeWeeklyPulseMeta(await loadMeta(META_WEEKLY_PULSE), now);
    const ritualStreak = normalizeRitualStreakMeta(await loadMeta(META_RITUAL_STREAK), now);
    const currentNutrition = buildNutritionInsights(s.tasks, weeklyPulse, ritualStreak, now);

    if (weeklyPulse.servings < WEEKLY_PULSE_TARGET) {
      dispatch({ type: 'UPDATE_NUTRITION', nutrition: currentNutrition });
      return {
        success: false,
        message: `Need ${WEEKLY_PULSE_TARGET - weeklyPulse.servings} more pulse servings this week.`,
      };
    }

    if (weeklyPulse.reward_claimed) {
      dispatch({ type: 'UPDATE_NUTRITION', nutrition: currentNutrition });
      return { success: false, message: 'Weekly pulse reward already claimed.' };
    }

    weeklyPulse.reward_claimed = true;
    const updatedPlayer: Player = {
      ...s.player,
      gold: s.player.gold + WEEKLY_PULSE_REWARD_GOLD,
    };
    const nutrition = buildNutritionInsights(s.tasks, weeklyPulse, ritualStreak, now);

    await savePlayer(updatedPlayer);
    await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
    await saveMeta(META_RITUAL_STREAK, ritualStreak);

    dispatch({ type: 'UPDATE_PLAYER', player: updatedPlayer });
    dispatch({ type: 'UPDATE_NUTRITION', nutrition });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `pulse_reward_${Date.now()}`,
        title: 'Pulse Reward Claimed',
        message: `+${WEEKLY_PULSE_REWARD_GOLD} gold from weekly pulse tracker.`,
        type: 'streak',
        domain: 'health',
        duration: 3800,
        created_at: Date.now(),
      },
    });
    const timeline = pushTimelineEvent(
      normalizeTimeline(await loadMeta(META_TIMELINE)),
      createTimelineEvent(
        'Weekly Pulse Reward',
        `Pulse tracker reward claimed (+${WEEKLY_PULSE_REWARD_GOLD} gold).`,
        'calendar',
        'health',
      ),
    );
    await saveMeta(META_TIMELINE, timeline);
    dispatch({ type: 'UPDATE_TIMELINE', timeline });

    return { success: true, message: `Reward claimed: +${WEEKLY_PULSE_REWARD_GOLD} gold.` };
  }, []);

  const setTab = useCallback((tab: TabId) => {
    dispatch({ type: 'SET_TAB', tab });
  }, []);

  const selectCreature = useCallback((id: CreatureId | null) => {
    dispatch({ type: 'SET_SELECTED_CREATURE', id });
  }, []);

  const setDomainFilter = useCallback((domain: Domain | null) => {
    dispatch({ type: 'SET_DOMAIN_FILTER', domain });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', id });
  }, []);

  const dismissEvolution = useCallback(() => {
    dispatch({ type: 'DISMISS_EVOLUTION' });
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    completeTask: handleCompleteTask,
    fuseGenes: handleFuseGenes,
    renameCreature: handleRenameCreature,
    feedCreature: handleFeedCreature,
    petCreature: handlePetCreature,
    addWatchTimeForCreature: handleAddWatchTimeForCreature,
    completeTimeboxMission: handleCompleteTimeboxMission,
    resolveRaidBattle: handleResolveRaidBattle,
    claimDailyCalendarReward: handleClaimDailyCalendarReward,
    claimWeeklyPulseReward: handleClaimWeeklyPulseReward,
    initializeGame,
    setTab,
    selectCreature,
    setDomainFilter,
    dismissNotification,
    dismissEvolution,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
