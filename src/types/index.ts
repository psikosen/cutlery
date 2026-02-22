// ============================================================
// SHADOW SYSTEM — Core Type Definitions
// ============================================================

// --- Enums & Constants ---

export type Domain = 'health' | 'mind' | 'discipline' | 'career' | 'finance' | 'social';

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'National' | 'Monarch';

export type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;

export type GeneTier = 'base' | 'dense' | 'hyper' | 'titan';

export type TraitTier = 'common' | 'rare' | 'epic' | 'legendary' | 'chimera';

export type TaskType = 'daily' | 'weekly' | 'boss' | 'emergency';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type CreatureId = 'gore_maw' | 'mind_weaver' | 'chain_wraith' | 'rot_engine' | 'gilt_horror' | 'hollow_singer';

export type BodySlot =
  | 'crown' | 'left_horn' | 'right_horn'
  | 'left_shoulder' | 'right_shoulder'
  | 'chest' | 'left_arm' | 'right_arm'
  | 'core' | 'left_leg' | 'right_leg'
  | 'tail' | 'left_wing' | 'right_wing'
  | 'aura';

// --- Gene Types per Domain ---

export type HealthGeneType = 'muscle_fiber' | 'bone_plate' | 'vein_network' | 'tendon_whip' | 'organ_sac' | 'tooth_row';
export type MindGeneType = 'eye_cluster' | 'neural_tendril' | 'skull_graft' | 'synapse_arc' | 'memory_sac' | 'psychic_crown';
export type DisciplineGeneType = 'chain_link' | 'iron_plate' | 'lock_core' | 'ember_node' | 'spectral_layer' | 'wardens_eye';
export type CareerGeneType = 'gear_assembly' | 'cable_nerve' | 'piston_limb' | 'furnace_core' | 'blueprint_glyph' | 'exhaust_vent';
export type FinanceGeneType = 'gold_scale' | 'coin_disc' | 'vault_door' | 'investment_tendril' | 'ledger_glyph' | 'crown_jewel';
export type SocialGeneType = 'mouth' | 'face_mask' | 'vocal_cord' | 'echo_chamber' | 'harmony_thread' | 'memory_face';

export type GeneType =
  | HealthGeneType | MindGeneType | DisciplineGeneType
  | CareerGeneType | FinanceGeneType | SocialGeneType;

// --- Data Entities ---

export interface Player {
  id: string;
  name: string;
  hunter_rank: HunterRank;
  total_power: number;
  gold: number;
  streak_current: number;
  streak_best: number;
  streak_last_date: string; // ISO date string YYYY-MM-DD
  total_tasks_completed: number;
  total_genes_acquired: number;
  achievements: string[];
  created_at: string;
}

export interface GeneVisualParams {
  size: number;
  color_shift: number;
  animation_speed: number;
  body_slot: BodySlot;
  procedural_seed: number;
}

export interface Gene {
  id: string;
  type: GeneType;
  domain: Domain;
  tier: GeneTier;
  stat_key: string;
  stat_value: number;
  visual_params: GeneVisualParams;
  acquired_from: string; // task id
  acquired_at: string;
}

export interface GeneInventoryEntry {
  count: number;
  tier_breakdown: { base: number; dense: number; hyper: number; titan: number };
  total_stat_value: number;
}

export interface BodySlotEntry {
  gene_type: GeneType;
  tier: GeneTier;
  visual_seed: number;
  gene_id: string;
}

export interface Creature {
  id: CreatureId;
  player_id: string;
  domain: Domain;
  evolution_stage: EvolutionStage;
  total_genes: number;
  total_power: number;
  genes: Record<string, GeneInventoryEntry>;
  traits: string[];
  body_slots: Record<string, BodySlotEntry[]>;
  appearance_seed: number;
  chromosome?: number[]; // Genetic algorithm chromosome for procedural appearance
  created_at: string;
}

export interface TaskRewards {
  xp: number;
  gold: number;
  gene_type: GeneType;
  gene_count: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  icon: string;
  domain: Domain;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: TaskType;
  rewards: TaskRewards;
  repeatable: boolean;
  completed_today: boolean;
  completed_count: number;
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  lore_text: string;
  tier: TraitTier;
  condition: {
    gene_type: string;
    gene_count: number;
    unique_types?: number;
  };
  effect: {
    type: 'stat_boost' | 'visual' | 'aura' | 'passive';
    stat_key?: string;
    value: number;
  };
  visual_modifier: {
    glow_color: string;
    particle_type: string;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  hint: string;
  icon: string;
  rarity: AchievementRarity;
  condition: { type: string; target: string; value: number };
  reward: { xp: number; gold: number; rare_gene?: GeneType };
  lore_text: string;
  unlocked: boolean;
  unlocked_at?: string;
}

// --- UI State ---

export type TabId = 'quests' | 'creatures' | 'hub' | 'lab' | 'trophies';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'gene' | 'evolution' | 'trait' | 'achievement' | 'rank' | 'streak';
  domain?: Domain;
  duration?: number;
  created_at: number;
}

// --- Creature Rendering ---

export interface CreatureRenderConfig {
  bodyPoints: number;
  tentacles: number;
  eyes: number;
  mouths: number;
  ambientType: 'none' | 'faint_glow' | 'particles' | 'glow_drips' | 'aura_spines' | 'screen_bleed';
}

export const EVOLUTION_CONFIGS: Record<EvolutionStage, CreatureRenderConfig> = {
  0: { bodyPoints: 8, tentacles: 2, eyes: 1, mouths: 0, ambientType: 'none' },
  1: { bodyPoints: 12, tentacles: 5, eyes: 3, mouths: 1, ambientType: 'faint_glow' },
  2: { bodyPoints: 16, tentacles: 7, eyes: 5, mouths: 1, ambientType: 'particles' },
  3: { bodyPoints: 24, tentacles: 11, eyes: 7, mouths: 1, ambientType: 'glow_drips' },
  4: { bodyPoints: 32, tentacles: 15, eyes: 11, mouths: 2, ambientType: 'aura_spines' },
  5: { bodyPoints: 48, tentacles: 20, eyes: 15, mouths: 3, ambientType: 'screen_bleed' },
};

export const EVOLUTION_THRESHOLDS: Record<EvolutionStage, number> = {
  0: 0,
  1: 10,
  2: 30,
  3: 75,
  4: 150,
  5: 300,
};

export const HUNTER_RANK_THRESHOLDS: [number, HunterRank][] = [
  [35001, 'Monarch'],
  [20001, 'National'],
  [12001, 'SSS'],
  [7001, 'SS'],
  [3501, 'S'],
  [1501, 'A'],
  [601, 'B'],
  [201, 'C'],
  [51, 'D'],
  [0, 'E'],
];

export const DOMAIN_COLORS: Record<Domain, string> = {
  health: '#ff4444',
  mind: '#aa66ff',
  discipline: '#00ccff',
  career: '#44dd44',
  finance: '#ffaa00',
  social: '#ff6b9d',
};

export const CREATURE_NAMES: Record<CreatureId, string> = {
  gore_maw: 'Gore Maw',
  mind_weaver: 'Mind Weaver',
  chain_wraith: 'Chain Wraith',
  rot_engine: 'Rot Engine',
  gilt_horror: 'Gilt Horror',
  hollow_singer: 'Hollow Singer',
};

export const DOMAIN_TO_CREATURE: Record<Domain, CreatureId> = {
  health: 'gore_maw',
  mind: 'mind_weaver',
  discipline: 'chain_wraith',
  career: 'rot_engine',
  finance: 'gilt_horror',
  social: 'hollow_singer',
};

export const CREATURE_TO_DOMAIN: Record<CreatureId, Domain> = {
  gore_maw: 'health',
  mind_weaver: 'mind',
  chain_wraith: 'discipline',
  rot_engine: 'career',
  gilt_horror: 'finance',
  hollow_singer: 'social',
};

export const EVOLUTION_STAGE_NAMES: string[] = [
  'Embryo', 'Spawn', 'Whelp', 'Beast', 'Monstrosity', 'Eldritch'
];

export const GENE_STAT_VALUES: Record<GeneTier, number> = {
  base: 3,
  dense: 8,
  hyper: 20,
  titan: 50,
};

export const BODY_SLOTS: BodySlot[] = [
  'crown', 'left_horn', 'right_horn',
  'left_shoulder', 'right_shoulder',
  'chest', 'left_arm', 'right_arm',
  'core', 'left_leg', 'right_leg',
  'tail', 'left_wing', 'right_wing',
  'aura',
];

// Bilateral slot pairs for balanced placement
export const BILATERAL_PAIRS: [BodySlot, BodySlot][] = [
  ['left_horn', 'right_horn'],
  ['left_shoulder', 'right_shoulder'],
  ['left_arm', 'right_arm'],
  ['left_leg', 'right_leg'],
  ['left_wing', 'right_wing'],
];

// Slot affinities per gene type
export const GENE_SLOT_AFFINITIES: Partial<Record<GeneType, BodySlot[]>> = {
  // Health - Gore Maw
  muscle_fiber: ['left_arm', 'right_arm', 'left_shoulder', 'right_shoulder', 'chest'],
  bone_plate: ['left_shoulder', 'right_shoulder', 'chest', 'crown'],
  vein_network: ['core', 'left_leg', 'right_leg', 'left_arm', 'right_arm'],
  tendon_whip: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'tail'],
  organ_sac: ['core', 'chest'],
  tooth_row: ['crown', 'left_arm', 'right_arm', 'left_shoulder', 'right_shoulder', 'chest', 'core', 'left_leg', 'right_leg', 'tail'],
  // Mind - Mind Weaver
  eye_cluster: ['crown', 'left_shoulder', 'right_shoulder', 'chest', 'core'],
  neural_tendril: ['crown', 'left_horn', 'right_horn', 'left_arm', 'right_arm'],
  skull_graft: ['crown', 'left_shoulder', 'right_shoulder'],
  synapse_arc: ['left_arm', 'right_arm', 'crown', 'chest'],
  memory_sac: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  psychic_crown: ['crown', 'left_horn', 'right_horn', 'aura'],
  // Discipline - Chain Wraith
  chain_link: ['left_arm', 'right_arm', 'chest', 'core', 'left_leg', 'right_leg'],
  iron_plate: ['chest', 'left_shoulder', 'right_shoulder', 'core'],
  lock_core: ['chest', 'core'],
  ember_node: ['left_shoulder', 'right_shoulder', 'crown', 'chest'],
  spectral_layer: ['aura', 'left_wing', 'right_wing'],
  wardens_eye: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  // Career - Rot Engine
  gear_assembly: ['chest', 'left_shoulder', 'right_shoulder', 'core'],
  cable_nerve: ['left_arm', 'right_arm', 'left_leg', 'right_leg'],
  piston_limb: ['left_arm', 'right_arm', 'left_leg', 'right_leg'],
  furnace_core: ['core', 'chest'],
  blueprint_glyph: ['chest', 'left_arm', 'right_arm', 'core'],
  exhaust_vent: ['left_shoulder', 'right_shoulder', 'left_wing', 'right_wing'],
  // Finance - Gilt Horror
  gold_scale: ['chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],
  coin_disc: ['chest', 'core', 'left_shoulder', 'right_shoulder'],
  vault_door: ['chest', 'core', 'left_shoulder', 'right_shoulder'],
  investment_tendril: ['left_arm', 'right_arm', 'tail'],
  ledger_glyph: ['chest', 'left_arm', 'right_arm', 'core'],
  crown_jewel: ['crown', 'left_shoulder', 'right_shoulder'],
  // Social - Hollow Singer
  mouth: ['chest', 'left_shoulder', 'right_shoulder', 'core', 'left_arm', 'right_arm'],
  face_mask: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  vocal_cord: ['chest', 'left_arm', 'right_arm'],
  echo_chamber: ['core', 'chest'],
  harmony_thread: ['left_arm', 'right_arm', 'left_wing', 'right_wing', 'aura'],
  memory_face: ['chest', 'left_shoulder', 'right_shoulder', 'core'],
};

export const GENE_STAT_KEYS: Record<GeneType, string> = {
  muscle_fiber: 'Strength', bone_plate: 'Defense', vein_network: 'Stamina',
  tendon_whip: 'Agility', organ_sac: 'Vitality', tooth_row: 'Power',
  eye_cluster: 'Perception', neural_tendril: 'Intelligence', skull_graft: 'Wisdom',
  synapse_arc: 'Focus', memory_sac: 'Memory', psychic_crown: 'Influence',
  chain_link: 'Consistency', iron_plate: 'Willpower', lock_core: 'Resilience',
  ember_node: 'Discipline', spectral_layer: 'Calm', wardens_eye: 'Vigilance',
  gear_assembly: 'Productivity', cable_nerve: 'Networking', piston_limb: 'Craft',
  furnace_core: 'Focus', blueprint_glyph: 'Strategy', exhaust_vent: 'Output',
  gold_scale: 'Savings', coin_disc: 'Awareness', vault_door: 'Security',
  investment_tendril: 'Growth', ledger_glyph: 'Knowledge', crown_jewel: 'Wealth',
  mouth: 'Communication', face_mask: 'Charisma', vocal_cord: 'Influence',
  echo_chamber: 'Empathy', harmony_thread: 'Leadership', memory_face: 'Bonds',
};
