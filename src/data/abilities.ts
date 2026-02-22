import type { SpecialAbility, AbilityRarity } from '../types';

// ============================================================
// SPECIAL ABILITIES
// ============================================================
// Special abilities are powerful effects unlocked through
// cross-domain mastery, total power milestones, and advanced
// progression. They represent the player's growing command
// over the shadow system itself.
//
// Unlock types:
//   cross_domain   — Requires multiple domains at certain levels
//   total_power    — Requires total power across all creatures
//   max_evolution  — Requires creatures at specific evolution stages
//   total_skills   — Requires a number of skills unlocked
//   total_traits   — Requires total traits across all creatures
//   gene_mastery   — Requires a total number of genes of specific tiers

interface AbilityTemplate {
  name: string;
  description: string;
  lore_text: string;
  rarity: AbilityRarity;
  condition_type: 'cross_domain' | 'total_power' | 'max_evolution' | 'total_skills' | 'total_traits' | 'gene_mastery';
  condition_value: number;
  condition_secondary_value?: number;
  condition_domains?: string[];
  effect_type: 'global_multiplier' | 'gene_transmute' | 'auto_streak' | 'titan_forge' | 'domain_resonance' | 'shadow_extraction' | 'evolution_burst';
  effect_value: number;
  effect_description: string;
  icon: string;
}

const ABILITY_TEMPLATES: AbilityTemplate[] = [
  // --- Cross-Domain Synergies ---
  {
    name: 'Body & Mind',
    description: 'Health and Mind creatures resonate, amplifying both',
    lore_text: 'Sound mind in a sound body. The ancient truth made manifest.',
    rarity: 'rare',
    condition_type: 'cross_domain', condition_value: 2, condition_domains: ['health', 'mind'],
    effect_type: 'domain_resonance', effect_value: 10,
    effect_description: '+10% to all Health and Mind stats',
    icon: '🧬',
  },
  {
    name: 'Iron Discipline',
    description: 'Discipline and Health creatures forge an unbreakable bond',
    lore_text: 'The body obeys the will. The will is strengthened by the body.',
    rarity: 'rare',
    condition_type: 'cross_domain', condition_value: 2, condition_domains: ['discipline', 'health'],
    effect_type: 'domain_resonance', effect_value: 10,
    effect_description: '+10% to all Discipline and Health stats',
    icon: '🔗',
  },
  {
    name: 'Strategic Mind',
    description: 'Mind and Career creatures unlock latent potential',
    lore_text: 'Intelligence applied to purpose creates empires.',
    rarity: 'rare',
    condition_type: 'cross_domain', condition_value: 2, condition_domains: ['mind', 'career'],
    effect_type: 'domain_resonance', effect_value: 10,
    effect_description: '+10% to all Mind and Career stats',
    icon: '🎯',
  },
  {
    name: 'Wealth of Connection',
    description: 'Finance and Social creatures discover mutual growth',
    lore_text: 'Relationships are the most valuable investment.',
    rarity: 'rare',
    condition_type: 'cross_domain', condition_value: 2, condition_domains: ['finance', 'social'],
    effect_type: 'domain_resonance', effect_value: 10,
    effect_description: '+10% to all Finance and Social stats',
    icon: '🤝',
  },
  {
    name: 'Disciplined Wealth',
    description: 'Discipline and Finance in perfect harmony',
    lore_text: 'The patient hand gathers the most gold.',
    rarity: 'rare',
    condition_type: 'cross_domain', condition_value: 2, condition_domains: ['discipline', 'finance'],
    effect_type: 'domain_resonance', effect_value: 10,
    effect_description: '+10% to all Discipline and Finance stats',
    icon: '⚖️',
  },
  {
    name: 'Creative Network',
    description: 'Career and Social creatures amplify each other',
    lore_text: 'The work speaks. The people listen. Both grow.',
    rarity: 'rare',
    condition_type: 'cross_domain', condition_value: 2, condition_domains: ['career', 'social'],
    effect_type: 'domain_resonance', effect_value: 10,
    effect_description: '+10% to all Career and Social stats',
    icon: '🌐',
  },

  // --- Power Milestone Abilities ---
  {
    name: 'Shadow Extraction',
    description: 'Extract bonus genes from every completed task',
    lore_text: 'The shadows yield their secrets to the worthy.',
    rarity: 'epic',
    condition_type: 'total_power', condition_value: 500,
    effect_type: 'shadow_extraction', effect_value: 1,
    effect_description: '10% chance to gain a bonus gene per task',
    icon: '🌑',
  },
  {
    name: 'Shadow Harvest',
    description: 'Enhanced extraction pulls more from the void',
    lore_text: 'The void is generous to those who take.',
    rarity: 'legendary',
    condition_type: 'total_power', condition_value: 3000,
    effect_type: 'shadow_extraction', effect_value: 2,
    effect_description: '20% chance for bonus gene, 5% chance for dense tier',
    icon: '🌘',
  },
  {
    name: 'Monarch\'s Authority',
    description: 'All stats gain a global multiplier',
    lore_text: 'The Monarch commands. Reality complies.',
    rarity: 'mythic',
    condition_type: 'total_power', condition_value: 10000,
    effect_type: 'global_multiplier', effect_value: 25,
    effect_description: '+25% to ALL stats across all creatures',
    icon: '👑',
  },
  {
    name: 'Sovereign\'s Domain',
    description: 'Absolute power over the shadow realm',
    lore_text: 'You are no longer a hunter. You are the system.',
    rarity: 'mythic',
    condition_type: 'total_power', condition_value: 25000,
    effect_type: 'global_multiplier', effect_value: 50,
    effect_description: '+50% to ALL stats across all creatures',
    icon: '🏰',
  },

  // --- Evolution Milestone Abilities ---
  {
    name: 'Twin Beasts',
    description: 'Two creatures at Beast stage unlock primal fury',
    lore_text: 'Two beasts howl in unison. The walls tremble.',
    rarity: 'epic',
    condition_type: 'max_evolution', condition_value: 3, condition_secondary_value: 2,
    effect_type: 'evolution_burst', effect_value: 15,
    effect_description: '+15% gene stat values for all creatures',
    icon: '🐺',
  },
  {
    name: 'Monstrosity Rising',
    description: 'A creature reaching Monstrosity warps nearby shadows',
    lore_text: 'The monstrosity does not evolve. It transcends.',
    rarity: 'legendary',
    condition_type: 'max_evolution', condition_value: 4, condition_secondary_value: 1,
    effect_type: 'evolution_burst', effect_value: 25,
    effect_description: '+25% gene stat values for all creatures',
    icon: '👹',
  },
  {
    name: 'Eldritch Convergence',
    description: 'An Eldritch creature tears the veil between worlds',
    lore_text: 'The boundary was never real. Now everyone can see that.',
    rarity: 'mythic',
    condition_type: 'max_evolution', condition_value: 5, condition_secondary_value: 1,
    effect_type: 'evolution_burst', effect_value: 50,
    effect_description: '+50% gene stat values for all creatures',
    icon: '🌀',
  },

  // --- Skill & Trait Mastery Abilities ---
  {
    name: 'Trait Resonance',
    description: 'Your collected traits amplify each other',
    lore_text: 'Each trait is a note. Together they form a symphony.',
    rarity: 'epic',
    condition_type: 'total_traits', condition_value: 10,
    effect_type: 'global_multiplier', effect_value: 10,
    effect_description: '+10% to all stats',
    icon: '✨',
  },
  {
    name: 'Trait Ascendancy',
    description: 'Deep trait mastery unlocks hidden potential',
    lore_text: 'Twenty traits. Twenty mutations. Twenty steps toward godhood.',
    rarity: 'legendary',
    condition_type: 'total_traits', condition_value: 20,
    effect_type: 'global_multiplier', effect_value: 20,
    effect_description: '+20% to all stats',
    icon: '🌟',
  },
  {
    name: 'Skill Synergy',
    description: 'Your unlocked skills create feedback loops',
    lore_text: 'The skills interweave. The system optimizes itself.',
    rarity: 'epic',
    condition_type: 'total_skills', condition_value: 12,
    effect_type: 'global_multiplier', effect_value: 10,
    effect_description: '+10% to all stats',
    icon: '🔄',
  },
  {
    name: 'Skill Mastery',
    description: 'Complete skill mastery transcends individual creatures',
    lore_text: 'Mastery of many skills yields mastery of all things.',
    rarity: 'legendary',
    condition_type: 'total_skills', condition_value: 30,
    effect_type: 'global_multiplier', effect_value: 20,
    effect_description: '+20% to all stats',
    icon: '⭐',
  },

  // --- Gene Mastery Abilities ---
  {
    name: 'Titan Forge',
    description: 'Gene fusion occasionally produces titan-tier genes',
    lore_text: 'In the forge of the titans, base metal becomes divine.',
    rarity: 'legendary',
    condition_type: 'gene_mastery', condition_value: 10, condition_secondary_value: 3,
    effect_type: 'titan_forge', effect_value: 10,
    effect_description: '10% chance for fusion to skip a tier',
    icon: '🔥',
  },
  {
    name: 'Gene Transmutation',
    description: 'Convert genes between domains',
    lore_text: 'The boundaries between gene types dissolve.',
    rarity: 'epic',
    condition_type: 'gene_mastery', condition_value: 50, condition_secondary_value: 1,
    effect_type: 'gene_transmute', effect_value: 1,
    effect_description: 'Convert 5 genes of one type to 3 of another type',
    icon: '🧪',
  },
  {
    name: 'Streak Immortality',
    description: 'Your streak becomes nearly unbreakable',
    lore_text: 'The chain extends into eternity. It knows no end.',
    rarity: 'legendary',
    condition_type: 'total_traits', condition_value: 15,
    effect_type: 'auto_streak', effect_value: 3,
    effect_description: 'Streak survives up to 3 missed days',
    icon: '♾️',
  },
];

let abilityCounter = 0;

export function getAllAbilities(): SpecialAbility[] {
  return ABILITY_TEMPLATES.map((t) => {
    abilityCounter++;
    return {
      id: `ability_${t.condition_type}_${abilityCounter}`,
      name: t.name,
      description: t.description,
      lore_text: t.lore_text,
      rarity: t.rarity,
      condition: {
        type: t.condition_type,
        domains: t.condition_domains as any,
        value: t.condition_value,
        secondary_value: t.condition_secondary_value,
      },
      effect: {
        type: t.effect_type,
        value: t.effect_value,
        description: t.effect_description,
      },
      icon: t.icon,
      unlocked: false,
    };
  });
}
