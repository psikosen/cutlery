import type { Skill, Domain, CreatureId, SkillTier } from '../types';

// ============================================================
// CREATURE SKILLS
// ============================================================
// Each creature has a skill tree of 8 skills that unlock through
// progression. Skills provide permanent passive bonuses that
// enhance gameplay mechanics (gene bonuses, gold/xp multipliers,
// streak protection, fusion discounts, and domain synergies).
//
// Skill Tiers:
//   basic        — Unlocked early, small bonuses
//   advanced     — Mid-game, moderate bonuses
//   master       — Late-game, significant bonuses
//   transcendent — End-game, powerful unique effects

interface SkillTemplate {
  name: string;
  description: string;
  lore_text: string;
  tier: SkillTier;
  domain: Domain;
  creature_id: CreatureId;
  condition_type: 'evolution_stage' | 'gene_count' | 'gene_type_count' | 'trait_count' | 'power';
  condition_value: number;
  condition_gene_type?: string;
  effect_type: 'stat_multiplier' | 'gene_bonus' | 'gold_multiplier' | 'xp_multiplier' | 'streak_shield' | 'fusion_discount' | 'domain_synergy';
  effect_stat_key?: string;
  effect_value: number;
  effect_duration?: string;
  effect_target_domain?: Domain;
  icon: string;
}

const SKILL_TEMPLATES: SkillTemplate[] = [
  // ===== GORE MAW — Health Skills =====
  {
    name: 'Blood Surge',
    description: '+15% Strength from all gene acquisitions',
    lore_text: 'The blood quickens. Power floods the sinew.',
    tier: 'basic', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'evolution_stage', condition_value: 1,
    effect_type: 'stat_multiplier', effect_stat_key: 'Strength', effect_value: 15,
    icon: '🩸',
  },
  {
    name: 'Iron Stomach',
    description: '+20% gold earned from health tasks',
    lore_text: 'It consumes. Everything is fuel.',
    tier: 'basic', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'gene_count', condition_value: 15,
    effect_type: 'gold_multiplier', effect_value: 20,
    icon: '🪙',
  },
  {
    name: 'Predator Instinct',
    description: '+20% XP from health tasks',
    lore_text: 'The hunt sharpens every sense.',
    tier: 'advanced', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'evolution_stage', condition_value: 2,
    effect_type: 'xp_multiplier', effect_value: 20,
    icon: '🐺',
  },
  {
    name: 'Adaptive Regeneration',
    description: 'Health genes grant +2 bonus stat points',
    lore_text: 'What was torn rebuilds stronger.',
    tier: 'advanced', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'gene_type_count', condition_value: 5, condition_gene_type: 'blood_shard',
    effect_type: 'gene_bonus', effect_value: 2,
    icon: '💚',
  },
  {
    name: 'Bone Fortress',
    description: '+30% Defense from all sources',
    lore_text: 'An armor no weapon was forged to break.',
    tier: 'master', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'evolution_stage', condition_value: 3,
    effect_type: 'stat_multiplier', effect_stat_key: 'Defense', effect_value: 30,
    icon: '🦴',
  },
  {
    name: 'Vital Overflow',
    description: 'Gene fusion costs 2 instead of 3 for health genes',
    lore_text: 'Excess vitality spills into the void.',
    tier: 'master', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'trait_count', condition_value: 4,
    effect_type: 'fusion_discount', effect_value: 1,
    icon: '🔻',
  },
  {
    name: 'Apex Predator',
    description: 'Health genes also grant +1 to discipline creature',
    lore_text: 'The body trained becomes the will forged.',
    tier: 'transcendent', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'evolution_stage', condition_value: 4,
    effect_type: 'domain_synergy', effect_value: 1, effect_target_domain: 'discipline',
    icon: '👑',
  },
  {
    name: 'Undying',
    description: 'All health stats doubled',
    lore_text: 'Death looked upon it and turned away.',
    tier: 'transcendent', domain: 'health', creature_id: 'gore_maw',
    condition_type: 'power', condition_value: 2000,
    effect_type: 'stat_multiplier', effect_stat_key: 'all', effect_value: 100,
    icon: '♾️',
  },

  // ===== MIND WEAVER — Mind Skills =====
  {
    name: 'Pattern Recognition',
    description: '+15% Perception from all sources',
    lore_text: 'It sees the thread that binds all things.',
    tier: 'basic', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'evolution_stage', condition_value: 1,
    effect_type: 'stat_multiplier', effect_stat_key: 'Perception', effect_value: 15,
    icon: '🔍',
  },
  {
    name: 'Cognitive Surplus',
    description: '+20% XP from mind tasks',
    lore_text: 'Knowledge breeds knowledge.',
    tier: 'basic', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'gene_count', condition_value: 15,
    effect_type: 'xp_multiplier', effect_value: 20,
    icon: '📈',
  },
  {
    name: 'Dreamcatcher',
    description: 'Mind genes grant +2 bonus stat points',
    lore_text: 'Even sleep serves the mind.',
    tier: 'advanced', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'gene_type_count', condition_value: 5, condition_gene_type: 'dream_gland',
    effect_type: 'gene_bonus', effect_value: 2,
    icon: '🌙',
  },
  {
    name: 'Synaptic Cascade',
    description: '+25% Intelligence from all sources',
    lore_text: 'One thought sparks a thousand more.',
    tier: 'advanced', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'evolution_stage', condition_value: 2,
    effect_type: 'stat_multiplier', effect_stat_key: 'Intelligence', effect_value: 25,
    icon: '⚡',
  },
  {
    name: 'Thought Weave',
    description: '+20% gold from mind tasks',
    lore_text: 'Each thread of thought spun to gold.',
    tier: 'master', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'evolution_stage', condition_value: 3,
    effect_type: 'gold_multiplier', effect_value: 20,
    icon: '🕸️',
  },
  {
    name: 'Precognition',
    description: 'Gene fusion costs 2 instead of 3 for mind genes',
    lore_text: 'It knew the outcome before the experiment began.',
    tier: 'master', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'trait_count', condition_value: 4,
    effect_type: 'fusion_discount', effect_value: 1,
    icon: '🔮',
  },
  {
    name: 'Hive Mind',
    description: 'Mind genes also grant +1 to career creature',
    lore_text: 'Intelligence distributed is intelligence multiplied.',
    tier: 'transcendent', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'evolution_stage', condition_value: 4,
    effect_type: 'domain_synergy', effect_value: 1, effect_target_domain: 'career',
    icon: '🧠',
  },
  {
    name: 'Omniscience',
    description: 'All mind stats doubled',
    lore_text: 'It has seen everything. Past. Present. The spaces in between.',
    tier: 'transcendent', domain: 'mind', creature_id: 'mind_weaver',
    condition_type: 'power', condition_value: 2000,
    effect_type: 'stat_multiplier', effect_stat_key: 'all', effect_value: 100,
    icon: '👁️',
  },

  // ===== CHAIN WRAITH — Discipline Skills =====
  {
    name: 'Binding Oath',
    description: '+15% Consistency from all sources',
    lore_text: 'The oath was sworn. The chain will not break.',
    tier: 'basic', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'evolution_stage', condition_value: 1,
    effect_type: 'stat_multiplier', effect_stat_key: 'Consistency', effect_value: 15,
    icon: '⛓️',
  },
  {
    name: 'Tempered Will',
    description: '+20% gold from discipline tasks',
    lore_text: 'Discipline is its own reward. Gold is a bonus.',
    tier: 'basic', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'gene_count', condition_value: 15,
    effect_type: 'gold_multiplier', effect_value: 20,
    icon: '🛡️',
  },
  {
    name: 'Streak Guardian',
    description: 'One missed day per week does not break streak',
    lore_text: 'The chain forgives one weakness. Only one.',
    tier: 'advanced', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'evolution_stage', condition_value: 2,
    effect_type: 'streak_shield', effect_value: 1,
    icon: '🛡️',
  },
  {
    name: 'Pain Tolerance',
    description: 'Discipline genes grant +2 bonus stat points',
    lore_text: 'What does not break it makes it harder.',
    tier: 'advanced', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'gene_type_count', condition_value: 5, condition_gene_type: 'scar_tissue',
    effect_type: 'gene_bonus', effect_value: 2,
    icon: '💪',
  },
  {
    name: 'Ritual Power',
    description: '+25% Willpower from all sources',
    lore_text: 'The ritual is the power. The repetition is the spell.',
    tier: 'master', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'evolution_stage', condition_value: 3,
    effect_type: 'stat_multiplier', effect_stat_key: 'Willpower', effect_value: 25,
    icon: '🕯️',
  },
  {
    name: 'Unbreakable',
    description: 'Gene fusion costs 2 instead of 3 for discipline genes',
    lore_text: 'What cannot break will only condense.',
    tier: 'master', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'trait_count', condition_value: 4,
    effect_type: 'fusion_discount', effect_value: 1,
    icon: '🔒',
  },
  {
    name: 'Iron Resolve',
    description: 'Discipline genes also grant +1 to health creature',
    lore_text: 'The will commands. The body obeys.',
    tier: 'transcendent', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'evolution_stage', condition_value: 4,
    effect_type: 'domain_synergy', effect_value: 1, effect_target_domain: 'health',
    icon: '⚔️',
  },
  {
    name: 'Eternal Vigil',
    description: 'All discipline stats doubled',
    lore_text: 'It has watched since the beginning. It will watch until the end.',
    tier: 'transcendent', domain: 'discipline', creature_id: 'chain_wraith',
    condition_type: 'power', condition_value: 2000,
    effect_type: 'stat_multiplier', effect_stat_key: 'all', effect_value: 100,
    icon: '🏔️',
  },

  // ===== ROT ENGINE — Career Skills =====
  {
    name: 'Efficiency Protocol',
    description: '+15% Productivity from all sources',
    lore_text: 'The engine optimizes. Always.',
    tier: 'basic', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'evolution_stage', condition_value: 1,
    effect_type: 'stat_multiplier', effect_stat_key: 'Productivity', effect_value: 15,
    icon: '⚙️',
  },
  {
    name: 'Output Boost',
    description: '+20% XP from career tasks',
    lore_text: 'Production yields production.',
    tier: 'basic', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'gene_count', condition_value: 15,
    effect_type: 'xp_multiplier', effect_value: 20,
    icon: '📊',
  },
  {
    name: 'Innovation Spark',
    description: 'Career genes grant +2 bonus stat points',
    lore_text: 'A single spark can ignite an empire.',
    tier: 'advanced', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'gene_type_count', condition_value: 5, condition_gene_type: 'spark_plug',
    effect_type: 'gene_bonus', effect_value: 2,
    icon: '💡',
  },
  {
    name: 'Assembly Line',
    description: '+25% Craft from all sources',
    lore_text: 'One becomes many. Many becomes infinite.',
    tier: 'advanced', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'evolution_stage', condition_value: 2,
    effect_type: 'stat_multiplier', effect_stat_key: 'Craft', effect_value: 25,
    icon: '🏭',
  },
  {
    name: 'Profit Engine',
    description: '+30% gold from career tasks',
    lore_text: 'The engine runs on ambition and produces gold.',
    tier: 'master', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'evolution_stage', condition_value: 3,
    effect_type: 'gold_multiplier', effect_value: 30,
    icon: '💰',
  },
  {
    name: 'Rapid Prototyping',
    description: 'Gene fusion costs 2 instead of 3 for career genes',
    lore_text: 'Why build once when you can iterate endlessly?',
    tier: 'master', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'trait_count', condition_value: 4,
    effect_type: 'fusion_discount', effect_value: 1,
    icon: '🔧',
  },
  {
    name: 'Network Effect',
    description: 'Career genes also grant +1 to finance creature',
    lore_text: 'Work feeds wealth. Wealth fuels work.',
    tier: 'transcendent', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'evolution_stage', condition_value: 4,
    effect_type: 'domain_synergy', effect_value: 1, effect_target_domain: 'finance',
    icon: '🌐',
  },
  {
    name: 'Perpetual Motion',
    description: 'All career stats doubled',
    lore_text: 'The engine has transcended fuel. It runs on pure will.',
    tier: 'transcendent', domain: 'career', creature_id: 'rot_engine',
    condition_type: 'power', condition_value: 2000,
    effect_type: 'stat_multiplier', effect_stat_key: 'all', effect_value: 100,
    icon: '♾️',
  },

  // ===== GILT HORROR — Finance Skills =====
  {
    name: 'Midas Touch',
    description: '+15% Savings from all sources',
    lore_text: 'Everything it touches turns to gold.',
    tier: 'basic', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'evolution_stage', condition_value: 1,
    effect_type: 'stat_multiplier', effect_stat_key: 'Savings', effect_value: 15,
    icon: '✋',
  },
  {
    name: 'Compound Interest',
    description: '+20% gold from finance tasks',
    lore_text: 'Gold breeds gold breeds gold.',
    tier: 'basic', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'gene_count', condition_value: 15,
    effect_type: 'gold_multiplier', effect_value: 20,
    icon: '📈',
  },
  {
    name: 'Risk Assessment',
    description: 'Finance genes grant +2 bonus stat points',
    lore_text: 'Calculated risks yield calculated rewards.',
    tier: 'advanced', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'gene_type_count', condition_value: 5, condition_gene_type: 'debt_fang',
    effect_type: 'gene_bonus', effect_value: 2,
    icon: '⚖️',
  },
  {
    name: 'Market Sense',
    description: '+25% Growth from all sources',
    lore_text: 'It feels the market pulse in its golden veins.',
    tier: 'advanced', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'evolution_stage', condition_value: 2,
    effect_type: 'stat_multiplier', effect_stat_key: 'Growth', effect_value: 25,
    icon: '📊',
  },
  {
    name: 'Diversified Portfolio',
    description: '+25% XP from finance tasks',
    lore_text: 'Spread wide. Grow everywhere.',
    tier: 'master', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'evolution_stage', condition_value: 3,
    effect_type: 'xp_multiplier', effect_value: 25,
    icon: '🗂️',
  },
  {
    name: 'Golden Forge',
    description: 'Gene fusion costs 2 instead of 3 for finance genes',
    lore_text: 'Wealth compressed is wealth refined.',
    tier: 'master', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'trait_count', condition_value: 4,
    effect_type: 'fusion_discount', effect_value: 1,
    icon: '🔥',
  },
  {
    name: 'Wealth Cascade',
    description: 'Finance genes also grant +1 to social creature',
    lore_text: 'Wealth opens doors that skill cannot.',
    tier: 'transcendent', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'evolution_stage', condition_value: 4,
    effect_type: 'domain_synergy', effect_value: 1, effect_target_domain: 'social',
    icon: '🏛️',
  },
  {
    name: 'Dragon Hoard',
    description: 'All finance stats doubled',
    lore_text: 'Atop its mountain of gold, it surveys all it owns — which is everything.',
    tier: 'transcendent', domain: 'finance', creature_id: 'gilt_horror',
    condition_type: 'power', condition_value: 2000,
    effect_type: 'stat_multiplier', effect_stat_key: 'all', effect_value: 100,
    icon: '🐉',
  },

  // ===== HOLLOW SINGER — Social Skills =====
  {
    name: 'First Impression',
    description: '+15% Charisma from all sources',
    lore_text: 'They remember its voice long after.',
    tier: 'basic', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'evolution_stage', condition_value: 1,
    effect_type: 'stat_multiplier', effect_stat_key: 'Charisma', effect_value: 15,
    icon: '🎭',
  },
  {
    name: 'Social Capital',
    description: '+20% gold from social tasks',
    lore_text: 'Connections are the true currency.',
    tier: 'basic', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'gene_count', condition_value: 15,
    effect_type: 'gold_multiplier', effect_value: 20,
    icon: '💎',
  },
  {
    name: 'Emotional Intelligence',
    description: 'Social genes grant +2 bonus stat points',
    lore_text: 'To know others is to know yourself.',
    tier: 'advanced', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'gene_type_count', condition_value: 5, condition_gene_type: 'mirror_shard',
    effect_type: 'gene_bonus', effect_value: 2,
    icon: '💜',
  },
  {
    name: 'Resonance',
    description: '+25% Empathy from all sources',
    lore_text: 'Its frequency matches every heart.',
    tier: 'advanced', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'evolution_stage', condition_value: 2,
    effect_type: 'stat_multiplier', effect_stat_key: 'Empathy', effect_value: 25,
    icon: '🔔',
  },
  {
    name: 'Rallying Cry',
    description: '+25% XP from social tasks',
    lore_text: 'Its voice carries across the void.',
    tier: 'master', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'evolution_stage', condition_value: 3,
    effect_type: 'xp_multiplier', effect_value: 25,
    icon: '📣',
  },
  {
    name: 'Soul Bond',
    description: 'Gene fusion costs 2 instead of 3 for social genes',
    lore_text: 'Bonds compressed become unbreakable.',
    tier: 'master', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'trait_count', condition_value: 4,
    effect_type: 'fusion_discount', effect_value: 1,
    icon: '🔗',
  },
  {
    name: 'Chorus of Shadows',
    description: 'Social genes also grant +1 to mind creature',
    lore_text: 'Through others, we learn ourselves.',
    tier: 'transcendent', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'evolution_stage', condition_value: 4,
    effect_type: 'domain_synergy', effect_value: 1, effect_target_domain: 'mind',
    icon: '🎵',
  },
  {
    name: 'Symphony of Souls',
    description: 'All social stats doubled',
    lore_text: 'Every soul it has touched sings in unison. The chorus shakes reality.',
    tier: 'transcendent', domain: 'social', creature_id: 'hollow_singer',
    condition_type: 'power', condition_value: 2000,
    effect_type: 'stat_multiplier', effect_stat_key: 'all', effect_value: 100,
    icon: '🌟',
  },
];

let skillCounter = 0;

export function getAllSkills(): Skill[] {
  return SKILL_TEMPLATES.map((t) => {
    skillCounter++;
    return {
      id: `skill_${t.creature_id}_${skillCounter}`,
      name: t.name,
      description: t.description,
      lore_text: t.lore_text,
      tier: t.tier,
      domain: t.domain,
      creature_id: t.creature_id,
      condition: {
        type: t.condition_type,
        creature: t.creature_id,
        gene_type: t.condition_gene_type as any,
        value: t.condition_value,
      },
      effect: {
        type: t.effect_type,
        stat_key: t.effect_stat_key,
        value: t.effect_value,
        duration: t.effect_duration || 'permanent',
        target_domain: t.effect_target_domain,
      },
      icon: t.icon,
      unlocked: false,
    };
  });
}

export function getSkillsForCreature(creatureId: CreatureId): Skill[] {
  return getAllSkills().filter(s => s.creature_id === creatureId);
}
