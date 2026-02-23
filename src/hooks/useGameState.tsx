import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type {
  Player, Creature, Gene, Task, Achievement, Notification,
  TabId, Domain, CreatureId, GeneType, GeneTier, Skill, SpecialAbility,
} from '../types';
import { CREATURE_NAMES } from '../types';
import {
  createDefaultPlayer, createAllCreatures, completeTask as engineCompleteTask,
  checkAchievements, fuseGenes as engineFuseGenes,
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
import { generateDefaultTasks } from '../data/defaultTasks';
import { DAILY_CALENDAR_REWARDS, getCalendarRewardByIndex } from '../data/dailyCalendarRewards';
import { getDefaultAchievements } from '../data/achievements';
import { getAllSkills } from '../data/skills';
import { getAllAbilities } from '../data/abilities';

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

type LastFeedDates = Partial<Record<CreatureId, string>>;
type CreatureHappinessMap = Record<CreatureId, number>;

const META_WEEKLY_PULSE = 'nutrition_weekly_pulse_v1';
const META_RITUAL_STREAK = 'nutrition_ritual_streak_v1';
const META_LAST_FEED_DATES = 'last_feed_dates_v1';
const META_DAILY_CALENDAR = 'daily_reward_calendar_v1';
const META_CREATURE_HAPPINESS = 'creature_happiness_v1';
const LEGACY_META_LAST_FEED_DATE = 'last_feed_date';
const WEEKLY_PULSE_TARGET = 4;
const WEEKLY_PULSE_REWARD_GOLD = 75;
const CREATURE_HAPPINESS_BASELINE = 50;
const PET_HAPPINESS_BOOST = 3;
const FEED_HAPPINESS_BOOST = 12;
const WATCH_SECONDS_PER_POINT = 20;
const ALL_CREATURE_IDS = Object.keys(CREATURE_NAMES) as CreatureId[];

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
  calendar: buildDailyCalendarState(createDefaultDailyCalendarMeta()),
  nutrition: buildNutritionInsights([], createDefaultWeeklyPulseMeta(), createDefaultRitualStreakMeta()),
};

// ============================================================
// ACTIONS
// ============================================================

type GameAction =
  | { type: 'INIT_COMPLETE'; player: Player; creatures: Creature[]; genes: Gene[]; tasks: Task[]; achievements: Achievement[]; skills: Skill[]; abilities: SpecialAbility[]; lastFeedDates: LastFeedDates; creatureHappiness: CreatureHappinessMap; calendar: DailyCalendarState; nutrition: NutritionInsights }
  | { type: 'SHOW_NAME_INPUT' }
  | { type: 'SET_PLAYER_NAME'; name: string }
  | { type: 'TASK_COMPLETED'; result: TaskCompletionResult; task: Task; achievements: Achievement[]; nutrition: NutritionInsights }
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
  stateRef.current = state;

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

        if (achievements.length === 0) {
          achievements = getDefaultAchievements();
          await saveAchievements(achievements);
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
        const now = new Date();
        const weeklyPulse = normalizeWeeklyPulseMeta(await loadMeta(META_WEEKLY_PULSE), now);
        const ritualStreak = normalizeRitualStreakMeta(await loadMeta(META_RITUAL_STREAK), now);
        const creatureHappiness = normalizeCreatureHappiness(await loadMeta(META_CREATURE_HAPPINESS));
        const calendarMeta = normalizeDailyCalendarMeta(await loadMeta(META_DAILY_CALENDAR), now);
        const calendar = buildDailyCalendarState(calendarMeta, now);
        const nutrition = buildNutritionInsights(tasks, weeklyPulse, ritualStreak, now);
        await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
        await saveMeta(META_RITUAL_STREAK, ritualStreak);
        await saveMeta(META_LAST_FEED_DATES, lastFeedDates);
        await saveMeta(META_CREATURE_HAPPINESS, creatureHappiness);
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
          calendar,
          nutrition,
        });
      } catch (err) {
        console.error('Failed to load game state:', err);
        dispatch({ type: 'SHOW_NAME_INPUT' });
      }
    })();
  }, []);

  // Daily reset check — runs on mount and sets up a timer for midnight
  useEffect(() => {
    if (!state.initialized || !state.player) return;

    const performDailyReset = async () => {
      const s = stateRef.current;
      const now = new Date();
      const today = toIsoDate(now);

      // Load the last reset date from meta
      const lastReset = (await loadMeta('last_daily_reset')) as string | undefined;
      if (lastReset === today) return; // Already reset today

      const weeklyPulse = normalizeWeeklyPulseMeta(await loadMeta(META_WEEKLY_PULSE), now);
      const ritualStreak = normalizeRitualStreakMeta(await loadMeta(META_RITUAL_STREAK), now);
      const calendarMeta = normalizeDailyCalendarMeta(await loadMeta(META_DAILY_CALENDAR), now);
      const calendar = buildDailyCalendarState(calendarMeta, now);
      await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
      await saveMeta(META_RITUAL_STREAK, ritualStreak);
      await saveMeta(META_DAILY_CALENDAR, calendarMeta);

      // Check if any daily task needs resetting
      const dailyTasks = s.tasks.filter(t => t.type === 'daily' && t.completed_today);
      if (dailyTasks.length > 0 || lastReset !== today) {
        const resetTasks = s.tasks.map(t =>
          t.type === 'daily' ? { ...t, completed_today: false } : t
        );
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
    };

    performDailyReset();

    // Schedule next reset at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timer = setTimeout(() => {
      performDailyReset();
      // After the first midnight trigger, set up a daily interval
      intervalId = setInterval(performDailyReset, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timer);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [state.initialized, state.player]);

  const initializeGame = useCallback(async (name: string) => {
    const player = createDefaultPlayer(name);
    const creatures = createAllCreatures(player.id);
    const tasks = generateDefaultTasks();
    const achievements = getDefaultAchievements();
    const skills = getAllSkills();
    const abilities = getAllAbilities();
    const now = new Date();
    const weeklyPulse = createDefaultWeeklyPulseMeta(now);
    const ritualStreak = createDefaultRitualStreakMeta();
    const creatureHappiness = createDefaultCreatureHappiness();
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
      calendar,
      nutrition,
    });
  }, []);

  const handleCompleteTask = useCallback(async (task: Task) => {
    const s = stateRef.current;
    if (!s.player || task.completed_today) return;

    const result = engineCompleteTask(task, s.player, s.creatures, s.achievements, s.skills, s.abilities);
    const now = new Date();
    const today = toIsoDate(now);
    const yesterday = getYesterdayIso(now);
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

    const nutrition = buildNutritionInsights(updatedTasks, weeklyPulse, ritualStreak, now);

    // Persist
    await savePlayer(result.player);
    await saveCreature(result.creature);
    await saveGene(result.gene);
    for (const sg of result.streakGenes) await saveGene(sg);
    await saveTasks(updatedTasks);
    await saveMeta(META_WEEKLY_PULSE, weeklyPulse);
    await saveMeta(META_RITUAL_STREAK, ritualStreak);

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
    dispatch({ type: 'SET_CREATURE_HAPPINESS', creatureHappiness: nextMap });

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
    dispatch({ type: 'SET_LAST_FEED_DATES', feedDates: updatedLastFeedDates });
    dispatch({ type: 'SET_CREATURE_HAPPINESS', creatureHappiness: nextHappiness });
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
