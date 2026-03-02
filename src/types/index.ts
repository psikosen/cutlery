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

export type SkillTier = 'basic' | 'advanced' | 'master' | 'transcendent';

export type AbilityRarity = 'rare' | 'epic' | 'legendary' | 'mythic';

export type CreatureId = 'gore_maw' | 'mind_weaver' | 'chain_wraith' | 'rot_engine' | 'gilt_horror' | 'hollow_singer';

export type BodySlot =
  | 'crown' | 'left_horn' | 'right_horn'
  | 'left_shoulder' | 'right_shoulder'
  | 'chest' | 'left_arm' | 'right_arm'
  | 'core' | 'left_leg' | 'right_leg'
  | 'tail' | 'left_wing' | 'right_wing'
  | 'aura';

// --- Gene Types per Domain ---

export type HealthGeneType = 'muscle_fiber' | 'bone_plate' | 'vein_network' | 'tendon_whip' | 'organ_sac' | 'tooth_row' | 'blood_shard' | 'nerve_bundle' | 'marrow_core' | 'lung_bellows' | 'heart_pump' | 'claw_hook' | 'actn3_fiber' | 'mstn_inhibitor' | 'col1a1_weave' | 'vegf_capillary' | 'ppargc1a_core' | 'igf1_driver' | 'nos3_flow';
export type MindGeneType = 'eye_cluster' | 'neural_tendril' | 'skull_graft' | 'synapse_arc' | 'memory_sac' | 'psychic_crown' | 'cortex_fold' | 'dream_gland' | 'third_eye' | 'cerebral_lobe' | 'psionic_node' | 'temporal_gland' | 'logic_matrix' | 'astral_fiber' | 'insight_lens' | 'bdnf_burst' | 'comt_filter' | 'grin2b_gate' | 'slc6a4_tide' | 'foxp2_phrase' | 'wwc1_trace' | 'chrna4_focus';
export type DisciplineGeneType = 'chain_link' | 'iron_plate' | 'lock_core' | 'ember_node' | 'spectral_layer' | 'wardens_eye' | 'anchor_bone' | 'scar_tissue' | 'ritual_glyph' | 'iron_spine' | 'will_node' | 'clock_anchor' | 'bmal1_cycle' | 'per3_stride' | 'cry1_quiet' | 'adora2a_brake' | 'nr3c1_steel';
export type CareerGeneType = 'gear_assembly' | 'cable_nerve' | 'piston_limb' | 'furnace_core' | 'blueprint_glyph' | 'exhaust_vent' | 'spark_plug' | 'conduit_wire' | 'output_valve' | 'turbine_arm' | 'crane_claw' | 'creb1_forge' | 'mtor_engine' | 'ampk_switch' | 'nrf2_shield' | 'hif1a_drive' | 'klotho_thread' | 'sirt1_focus';
export type FinanceGeneType = 'gold_scale' | 'coin_disc' | 'vault_door' | 'investment_tendril' | 'ledger_glyph' | 'crown_jewel' | 'debt_fang' | 'compound_crystal' | 'trade_tendril' | 'gilded_claw' | 'treasure_organ' | 'apoe_vault' | 'lpl_stream' | 'abca1_cache' | 'cpt1_furnace' | 'ppara_yield' | 'hmgcr_mint';
export type SocialGeneType = 'mouth' | 'face_mask' | 'vocal_cord' | 'echo_chamber' | 'harmony_thread' | 'memory_face' | 'mirror_shard' | 'pulse_drum' | 'bond_marrow' | 'empathy_lobe' | 'resonance_horn' | 'oxtr_bridge' | 'avpr1a_signal' | 'cd38_resonance' | 'shank3_mesh' | 'cntnap2_dialogue' | 'grin2a_sync' | 'gabra2_calm';

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
  custom_name?: string;
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

// --- Skills & Special Abilities ---

export interface SkillCondition {
  type: 'evolution_stage' | 'gene_count' | 'gene_type_count' | 'trait_count' | 'power';
  creature?: CreatureId;
  gene_type?: GeneType;
  value: number;
}

export interface SkillEffect {
  type: 'stat_multiplier' | 'gene_bonus' | 'gold_multiplier' | 'xp_multiplier' | 'streak_shield' | 'fusion_discount' | 'domain_synergy';
  stat_key?: string;
  value: number;
  duration?: string; // 'permanent' | 'per_task' | 'daily'
  target_domain?: Domain;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  lore_text: string;
  tier: SkillTier;
  domain: Domain;
  creature_id: CreatureId;
  condition: SkillCondition;
  effect: SkillEffect;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface AbilityCondition {
  type: 'cross_domain' | 'total_power' | 'max_evolution' | 'total_skills' | 'total_traits' | 'gene_mastery';
  domains?: Domain[];
  value: number;
  secondary_value?: number;
}

export interface AbilityEffect {
  type: 'global_multiplier' | 'gene_transmute' | 'auto_streak' | 'titan_forge' | 'domain_resonance' | 'shadow_extraction' | 'evolution_burst';
  value: number;
  description: string;
}

export interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  lore_text: string;
  rarity: AbilityRarity;
  condition: AbilityCondition;
  effect: AbilityEffect;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

// --- UI State ---

export type TabId = 'quests' | 'creatures' | 'hub' | 'raids' | 'calendar' | 'timeline' | 'lab' | 'trophies' | 'account';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'gene' | 'evolution' | 'trait' | 'achievement' | 'rank' | 'streak' | 'skill' | 'ability';
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
  blood_shard: ['core', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],
  nerve_bundle: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'crown'],
  marrow_core: ['core', 'chest', 'left_leg', 'right_leg'],
  // Mind - Mind Weaver
  eye_cluster: ['crown', 'left_shoulder', 'right_shoulder', 'chest', 'core'],
  neural_tendril: ['crown', 'left_horn', 'right_horn', 'left_arm', 'right_arm'],
  skull_graft: ['crown', 'left_shoulder', 'right_shoulder'],
  synapse_arc: ['left_arm', 'right_arm', 'crown', 'chest'],
  memory_sac: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  psychic_crown: ['crown', 'left_horn', 'right_horn', 'aura'],
  cortex_fold: ['crown', 'left_horn', 'right_horn', 'chest'],
  dream_gland: ['crown', 'core', 'aura'],
  third_eye: ['crown', 'left_shoulder', 'right_shoulder'],
  // Discipline - Chain Wraith
  chain_link: ['left_arm', 'right_arm', 'chest', 'core', 'left_leg', 'right_leg'],
  iron_plate: ['chest', 'left_shoulder', 'right_shoulder', 'core'],
  lock_core: ['chest', 'core'],
  ember_node: ['left_shoulder', 'right_shoulder', 'crown', 'chest'],
  spectral_layer: ['aura', 'left_wing', 'right_wing'],
  wardens_eye: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  anchor_bone: ['left_leg', 'right_leg', 'core', 'chest'],
  scar_tissue: ['chest', 'left_arm', 'right_arm', 'left_shoulder', 'right_shoulder'],
  ritual_glyph: ['core', 'chest', 'crown', 'aura'],
  // Career - Rot Engine
  gear_assembly: ['chest', 'left_shoulder', 'right_shoulder', 'core'],
  cable_nerve: ['left_arm', 'right_arm', 'left_leg', 'right_leg'],
  piston_limb: ['left_arm', 'right_arm', 'left_leg', 'right_leg'],
  furnace_core: ['core', 'chest'],
  blueprint_glyph: ['chest', 'left_arm', 'right_arm', 'core'],
  exhaust_vent: ['left_shoulder', 'right_shoulder', 'left_wing', 'right_wing'],
  spark_plug: ['crown', 'left_shoulder', 'right_shoulder', 'core'],
  conduit_wire: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'chest'],
  output_valve: ['left_shoulder', 'right_shoulder', 'left_wing', 'right_wing', 'core'],
  // Finance - Gilt Horror
  gold_scale: ['chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],
  coin_disc: ['chest', 'core', 'left_shoulder', 'right_shoulder'],
  vault_door: ['chest', 'core', 'left_shoulder', 'right_shoulder'],
  investment_tendril: ['left_arm', 'right_arm', 'tail'],
  ledger_glyph: ['chest', 'left_arm', 'right_arm', 'core'],
  crown_jewel: ['crown', 'left_shoulder', 'right_shoulder'],
  debt_fang: ['left_arm', 'right_arm', 'crown', 'chest'],
  compound_crystal: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  trade_tendril: ['left_arm', 'right_arm', 'tail', 'chest'],
  // Social - Hollow Singer
  mouth: ['chest', 'left_shoulder', 'right_shoulder', 'core', 'left_arm', 'right_arm'],
  face_mask: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  vocal_cord: ['chest', 'left_arm', 'right_arm'],
  echo_chamber: ['core', 'chest'],
  harmony_thread: ['left_arm', 'right_arm', 'left_wing', 'right_wing', 'aura'],
  memory_face: ['chest', 'left_shoulder', 'right_shoulder', 'core'],
  mirror_shard: ['crown', 'chest', 'left_arm', 'right_arm'],
  pulse_drum: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  bond_marrow: ['core', 'left_arm', 'right_arm', 'chest'],
  // --- New Organs & Appendages ---
  // Health - Gore Maw (organs + appendage)
  lung_bellows: ['chest', 'core', 'left_shoulder', 'right_shoulder'],
  heart_pump: ['chest', 'core'],
  claw_hook: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'tail'],
  // Mind - Mind Weaver (brain power organs)
  cerebral_lobe: ['crown', 'left_horn', 'right_horn', 'left_shoulder', 'right_shoulder'],
  psionic_node: ['crown', 'left_horn', 'right_horn', 'aura'],
  temporal_gland: ['crown', 'core', 'left_horn', 'right_horn'],
  logic_matrix: ['crown', 'chest', 'core', 'left_shoulder', 'right_shoulder'],
  astral_fiber: ['aura', 'left_wing', 'right_wing', 'crown'],
  insight_lens: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  // Discipline - Chain Wraith (spine + willpower organ)
  iron_spine: ['core', 'chest', 'crown', 'left_leg', 'right_leg'],
  will_node: ['core', 'chest', 'crown'],
  // Career - Rot Engine (mechanical appendages)
  turbine_arm: ['left_arm', 'right_arm', 'left_shoulder', 'right_shoulder'],
  crane_claw: ['left_arm', 'right_arm', 'left_leg', 'right_leg'],
  // Finance - Gilt Horror (claw + organ)
  gilded_claw: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'tail'],
  treasure_organ: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  // Social - Hollow Singer (empathy organ + communication appendage)
  empathy_lobe: ['crown', 'chest', 'core', 'left_shoulder', 'right_shoulder'],
  resonance_horn: ['left_horn', 'right_horn', 'crown', 'left_shoulder', 'right_shoulder'],
  // --- Research-inspired gene expansions ---
  // Health
  actn3_fiber: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'chest'],
  mstn_inhibitor: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  col1a1_weave: ['left_leg', 'right_leg', 'left_arm', 'right_arm', 'chest'],
  vegf_capillary: ['core', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],
  ppargc1a_core: ['core', 'chest', 'left_leg', 'right_leg'],
  igf1_driver: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  nos3_flow: ['core', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],
  // Mind
  bdnf_burst: ['crown', 'left_horn', 'right_horn', 'aura'],
  comt_filter: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  grin2b_gate: ['crown', 'left_horn', 'right_horn'],
  slc6a4_tide: ['core', 'chest', 'aura'],
  foxp2_phrase: ['crown', 'chest', 'left_shoulder', 'right_shoulder'],
  wwc1_trace: ['crown', 'core', 'chest'],
  chrna4_focus: ['crown', 'left_horn', 'right_horn', 'chest'],
  // Discipline
  clock_anchor: ['core', 'chest', 'crown'],
  bmal1_cycle: ['core', 'aura', 'crown'],
  per3_stride: ['left_leg', 'right_leg', 'core', 'chest'],
  cry1_quiet: ['aura', 'core', 'chest'],
  adora2a_brake: ['core', 'left_arm', 'right_arm', 'chest'],
  nr3c1_steel: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  // Career
  creb1_forge: ['crown', 'chest', 'core'],
  mtor_engine: ['core', 'chest', 'left_arm', 'right_arm'],
  ampk_switch: ['core', 'left_leg', 'right_leg', 'chest'],
  nrf2_shield: ['left_shoulder', 'right_shoulder', 'chest', 'core'],
  hif1a_drive: ['core', 'chest', 'left_leg', 'right_leg'],
  klotho_thread: ['aura', 'core', 'chest'],
  sirt1_focus: ['crown', 'core', 'chest', 'left_horn', 'right_horn'],
  // Finance
  apoe_vault: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  lpl_stream: ['left_arm', 'right_arm', 'left_leg', 'right_leg', 'core'],
  abca1_cache: ['chest', 'core', 'left_shoulder', 'right_shoulder'],
  cpt1_furnace: ['core', 'chest', 'left_leg', 'right_leg'],
  ppara_yield: ['core', 'chest', 'left_arm', 'right_arm'],
  hmgcr_mint: ['core', 'chest', 'crown'],
  // Social
  oxtr_bridge: ['chest', 'core', 'aura'],
  avpr1a_signal: ['crown', 'chest', 'aura'],
  cd38_resonance: ['core', 'chest', 'left_shoulder', 'right_shoulder'],
  shank3_mesh: ['crown', 'left_shoulder', 'right_shoulder', 'chest'],
  cntnap2_dialogue: ['crown', 'chest', 'left_arm', 'right_arm'],
  grin2a_sync: ['crown', 'aura', 'left_horn', 'right_horn'],
  gabra2_calm: ['aura', 'core', 'chest'],
};

export const GENE_STAT_KEYS: Record<GeneType, string> = {
  muscle_fiber: 'Strength', bone_plate: 'Defense', vein_network: 'Stamina',
  tendon_whip: 'Agility', organ_sac: 'Vitality', tooth_row: 'Power',
  blood_shard: 'Regeneration', nerve_bundle: 'Reflexes', marrow_core: 'Endurance',
  eye_cluster: 'Perception', neural_tendril: 'Intelligence', skull_graft: 'Wisdom',
  synapse_arc: 'Focus', memory_sac: 'Memory', psychic_crown: 'Influence',
  cortex_fold: 'Creativity', dream_gland: 'Intuition', third_eye: 'Foresight',
  chain_link: 'Consistency', iron_plate: 'Willpower', lock_core: 'Resilience',
  ember_node: 'Discipline', spectral_layer: 'Calm', wardens_eye: 'Vigilance',
  anchor_bone: 'Determination', scar_tissue: 'Tolerance', ritual_glyph: 'Routine',
  gear_assembly: 'Productivity', cable_nerve: 'Networking', piston_limb: 'Craft',
  furnace_core: 'Focus', blueprint_glyph: 'Strategy', exhaust_vent: 'Output',
  spark_plug: 'Innovation', conduit_wire: 'Adaptability', output_valve: 'Execution',
  gold_scale: 'Savings', coin_disc: 'Awareness', vault_door: 'Security',
  investment_tendril: 'Growth', ledger_glyph: 'Knowledge', crown_jewel: 'Wealth',
  debt_fang: 'Risk Management', compound_crystal: 'Patience', trade_tendril: 'Negotiation',
  mouth: 'Communication', face_mask: 'Charisma', vocal_cord: 'Influence',
  echo_chamber: 'Empathy', harmony_thread: 'Leadership', memory_face: 'Bonds',
  mirror_shard: 'Authenticity', pulse_drum: 'Motivation', bond_marrow: 'Loyalty',
  // New organs & appendages
  lung_bellows: 'Breath', heart_pump: 'Circulation', claw_hook: 'Grip',
  cerebral_lobe: 'Logic', psionic_node: 'Projection', temporal_gland: 'Precognition',
  logic_matrix: 'Reasoning', astral_fiber: 'Awareness', insight_lens: 'Insight',
  iron_spine: 'Fortitude', will_node: 'Resolve',
  turbine_arm: 'Throughput', crane_claw: 'Precision',
  gilded_claw: 'Acquisition', treasure_organ: 'Accumulation',
  empathy_lobe: 'Compassion', resonance_horn: 'Broadcast',
  // Research-inspired gene expansions
  actn3_fiber: 'Burst Force', mstn_inhibitor: 'Hypertrophy', col1a1_weave: 'Tissue Integrity',
  vegf_capillary: 'Oxygen Delivery', ppargc1a_core: 'Endurance Adaptation', igf1_driver: 'Repair Rate',
  nos3_flow: 'Blood Flow',
  bdnf_burst: 'Plasticity', comt_filter: 'Cognitive Control', grin2b_gate: 'Learning Velocity',
  slc6a4_tide: 'Mood Stability', foxp2_phrase: 'Expression', wwc1_trace: 'Recall Retention',
  chrna4_focus: 'Sustained Attention',
  clock_anchor: 'Rhythm Lock', bmal1_cycle: 'Cycle Precision', per3_stride: 'Daily Momentum',
  cry1_quiet: 'Impulse Quieting', adora2a_brake: 'Fatigue Control', nr3c1_steel: 'Stress Recovery',
  creb1_forge: 'Skill Encoding', mtor_engine: 'Output Growth', ampk_switch: 'Energy Allocation',
  nrf2_shield: 'Resilience', hif1a_drive: 'Load Tolerance', klotho_thread: 'Maintenance',
  sirt1_focus: 'Efficiency',
  apoe_vault: 'Reserve Strategy', lpl_stream: 'Asset Flow', abca1_cache: 'Resource Transport',
  cpt1_furnace: 'Capital Burn', ppara_yield: 'Compounding Yield', hmgcr_mint: 'Value Minting',
  oxtr_bridge: 'Bonding', avpr1a_signal: 'Social Signaling', cd38_resonance: 'Warmth',
  shank3_mesh: 'Reciprocity', cntnap2_dialogue: 'Dialogue Clarity', grin2a_sync: 'Coordination',
  gabra2_calm: 'Social Calm',
};
