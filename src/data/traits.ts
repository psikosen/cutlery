import type { Trait, GeneType, Domain } from '../types';
import { DOMAIN_COLORS } from '../types';

interface TraitTemplate {
  gene_type: GeneType | 'any' | 'mixed';
  gene_count: number;
  unique_types?: number;
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'chimera';
  name: string;
  description: string;
  lore_text: string;
  stat_key?: string;
  value: number;
  domain: Domain;
}

const TRAIT_TEMPLATES: TraitTemplate[] = [
  // --- GORE MAW TRAITS ---
  { gene_type: 'muscle_fiber', gene_count: 3, tier: 'common', name: 'Muscle Mass', description: '+10% Strength from all sources', lore_text: 'The flesh remembers what the mind forgets.', stat_key: 'Strength', value: 10, domain: 'health' },
  { gene_type: 'muscle_fiber', gene_count: 7, tier: 'rare', name: 'Hypertrophy', description: 'Muscle mutations grow 50% larger', lore_text: 'It hungers. It grows. It never stops.', stat_key: 'Strength', value: 25, domain: 'health' },
  { gene_type: 'muscle_fiber', gene_count: 15, tier: 'epic', name: 'Titan Musculature', description: '+50% Strength, creature size increases', lore_text: 'Beneath the hide, an engine of sinew.', stat_key: 'Strength', value: 50, domain: 'health' },
  { gene_type: 'muscle_fiber', gene_count: 30, tier: 'legendary', name: 'Living Colossus', description: 'Strength stat doubled', lore_text: 'It stood, and the earth complained.', stat_key: 'Strength', value: 100, domain: 'health' },
  { gene_type: 'bone_plate', gene_count: 3, tier: 'common', name: 'Bone Plating', description: '+10% Defense from all sources', lore_text: 'Armor grown, not forged.', stat_key: 'Defense', value: 10, domain: 'health' },
  { gene_type: 'bone_plate', gene_count: 7, tier: 'rare', name: 'Exoskeleton', description: 'Full armor shell visible', lore_text: 'What blade could pierce this?', stat_key: 'Defense', value: 25, domain: 'health' },
  { gene_type: 'vein_network', gene_count: 3, tier: 'common', name: 'Blood Rush', description: '+10% Stamina', lore_text: 'The blood sings in its veins.', stat_key: 'Stamina', value: 10, domain: 'health' },
  { gene_type: 'vein_network', gene_count: 7, tier: 'rare', name: 'Circulatory Web', description: 'Veins glow with inner light', lore_text: 'A network that spans the whole of it.', stat_key: 'Stamina', value: 25, domain: 'health' },
  { gene_type: 'tendon_whip', gene_count: 3, tier: 'common', name: 'Elastic Form', description: '+10% Agility', lore_text: 'It moves like water through bone.', stat_key: 'Agility', value: 10, domain: 'health' },
  { gene_type: 'organ_sac', gene_count: 3, tier: 'common', name: 'Regeneration', description: '+10% Vitality', lore_text: 'Cut it. It grows back. Try again.', stat_key: 'Vitality', value: 10, domain: 'health' },
  { gene_type: 'tooth_row', gene_count: 3, tier: 'common', name: 'Maw of Teeth', description: '+10% Power', lore_text: 'Every tooth a trophy.', stat_key: 'Power', value: 10, domain: 'health' },

  // --- MIND WEAVER TRAITS ---
  { gene_type: 'eye_cluster', gene_count: 3, tier: 'common', name: 'Watchful', description: '+10% Perception', lore_text: 'It sees all. It forgets nothing.', stat_key: 'Perception', value: 10, domain: 'mind' },
  { gene_type: 'eye_cluster', gene_count: 7, tier: 'rare', name: 'Omnivision', description: 'Eyes track independently', lore_text: 'Where do you hide from a thousand eyes?', stat_key: 'Perception', value: 25, domain: 'mind' },
  { gene_type: 'neural_tendril', gene_count: 3, tier: 'common', name: 'Quick Learner', description: '+10% Intelligence', lore_text: 'Knowledge flows like current.', stat_key: 'Intelligence', value: 10, domain: 'mind' },
  { gene_type: 'neural_tendril', gene_count: 7, tier: 'rare', name: 'Neural Network', description: 'Tendrils arc with lightning', lore_text: 'A mind unbound by matter.', stat_key: 'Intelligence', value: 25, domain: 'mind' },
  { gene_type: 'skull_graft', gene_count: 3, tier: 'common', name: 'Accumulated Wisdom', description: '+10% Wisdom', lore_text: 'The skulls whisper old truths.', stat_key: 'Wisdom', value: 10, domain: 'mind' },
  { gene_type: 'synapse_arc', gene_count: 3, tier: 'common', name: 'Lightning Mind', description: '+10% Focus', lore_text: 'Thought moves at the speed of light.', stat_key: 'Focus', value: 10, domain: 'mind' },
  { gene_type: 'memory_sac', gene_count: 3, tier: 'common', name: 'Perfect Recall', description: '+10% Memory', lore_text: 'Every moment, preserved in amber.', stat_key: 'Memory', value: 10, domain: 'mind' },
  { gene_type: 'psychic_crown', gene_count: 3, tier: 'common', name: 'Psychic Aura', description: '+10% Influence', lore_text: 'Its presence reshapes thought.', stat_key: 'Influence', value: 10, domain: 'mind' },

  // --- CHAIN WRAITH TRAITS ---
  { gene_type: 'chain_link', gene_count: 3, tier: 'common', name: 'Bound', description: '+10% Consistency', lore_text: 'Each link a day. Each day a promise.', stat_key: 'Consistency', value: 10, domain: 'discipline' },
  { gene_type: 'chain_link', gene_count: 7, tier: 'rare', name: 'Unbreakable Chain', description: 'Chains glow with spectral fire', lore_text: 'Forged in routine. Tempered by will.', stat_key: 'Consistency', value: 25, domain: 'discipline' },
  { gene_type: 'chain_link', gene_count: 15, tier: 'epic', name: 'Eternal Binding', description: '+50% Consistency', lore_text: 'The chain has no beginning. No end.', stat_key: 'Consistency', value: 50, domain: 'discipline' },
  { gene_type: 'iron_plate', gene_count: 3, tier: 'common', name: 'Iron Will', description: '+10% Willpower', lore_text: 'Temptation breaks upon its armor.', stat_key: 'Willpower', value: 10, domain: 'discipline' },
  { gene_type: 'lock_core', gene_count: 3, tier: 'common', name: 'Lockdown', description: '+10% Resilience', lore_text: 'What is locked can never be lost.', stat_key: 'Resilience', value: 10, domain: 'discipline' },
  { gene_type: 'ember_node', gene_count: 3, tier: 'common', name: 'Morning Fire', description: '+10% Discipline', lore_text: 'It burns brightest at dawn.', stat_key: 'Discipline', value: 10, domain: 'discipline' },
  { gene_type: 'spectral_layer', gene_count: 3, tier: 'common', name: 'Ghost Shroud', description: '+10% Calm', lore_text: 'Silence is its armor.', stat_key: 'Calm', value: 10, domain: 'discipline' },
  { gene_type: 'wardens_eye', gene_count: 3, tier: 'common', name: 'Ever Watching', description: '+10% Vigilance', lore_text: 'The warden never sleeps.', stat_key: 'Vigilance', value: 10, domain: 'discipline' },

  // --- ROT ENGINE TRAITS ---
  { gene_type: 'gear_assembly', gene_count: 3, tier: 'common', name: 'Efficient Machine', description: '+10% Productivity', lore_text: 'The gears turn. The work gets done.', stat_key: 'Productivity', value: 10, domain: 'career' },
  { gene_type: 'gear_assembly', gene_count: 7, tier: 'rare', name: 'Industrial Complex', description: 'Gears visibly rotate', lore_text: 'An engine that builds engines.', stat_key: 'Productivity', value: 25, domain: 'career' },
  { gene_type: 'cable_nerve', gene_count: 3, tier: 'common', name: 'Connected', description: '+10% Networking', lore_text: 'Every cable a bridge.', stat_key: 'Networking', value: 10, domain: 'career' },
  { gene_type: 'piston_limb', gene_count: 3, tier: 'common', name: 'Practiced Hands', description: '+10% Craft', lore_text: 'Repetition forges mastery.', stat_key: 'Craft', value: 10, domain: 'career' },
  { gene_type: 'furnace_core', gene_count: 3, tier: 'common', name: 'Burning Focus', description: '+10% Focus', lore_text: 'The furnace never dims.', stat_key: 'Focus', value: 10, domain: 'career' },
  { gene_type: 'blueprint_glyph', gene_count: 3, tier: 'common', name: 'Master Planner', description: '+10% Strategy', lore_text: 'Every line drawn with purpose.', stat_key: 'Strategy', value: 10, domain: 'career' },
  { gene_type: 'exhaust_vent', gene_count: 3, tier: 'common', name: 'Release Valve', description: '+10% Output', lore_text: 'Pressure creates. Venting delivers.', stat_key: 'Output', value: 10, domain: 'career' },

  // --- GILT HORROR TRAITS ---
  { gene_type: 'gold_scale', gene_count: 3, tier: 'common', name: 'Gilded Hide', description: '+10% Savings', lore_text: 'Each scale a coin saved.', stat_key: 'Savings', value: 10, domain: 'finance' },
  { gene_type: 'gold_scale', gene_count: 7, tier: 'rare', name: 'Golden Armor', description: 'Scales shimmer and reflect', lore_text: 'Wealth made manifest.', stat_key: 'Savings', value: 25, domain: 'finance' },
  { gene_type: 'coin_disc', gene_count: 3, tier: 'common', name: 'Penny Wise', description: '+10% Awareness', lore_text: 'It counts. It always counts.', stat_key: 'Awareness', value: 10, domain: 'finance' },
  { gene_type: 'vault_door', gene_count: 3, tier: 'common', name: 'Fortified', description: '+10% Security', lore_text: 'No thief can breach this.', stat_key: 'Security', value: 10, domain: 'finance' },
  { gene_type: 'investment_tendril', gene_count: 3, tier: 'common', name: 'Compound Growth', description: '+10% Growth', lore_text: 'From one tendril, a thousand grow.', stat_key: 'Growth', value: 10, domain: 'finance' },
  { gene_type: 'ledger_glyph', gene_count: 3, tier: 'common', name: 'Financial Literacy', description: '+10% Knowledge', lore_text: 'The numbers tell a story.', stat_key: 'Knowledge', value: 10, domain: 'finance' },
  { gene_type: 'crown_jewel', gene_count: 3, tier: 'common', name: 'Crowned', description: '+10% Wealth', lore_text: 'A jewel for every triumph.', stat_key: 'Wealth', value: 10, domain: 'finance' },

  // --- HOLLOW SINGER TRAITS ---
  { gene_type: 'mouth', gene_count: 3, tier: 'common', name: 'Many Voices', description: '+10% Communication', lore_text: 'Every mouth speaks truth.', stat_key: 'Communication', value: 10, domain: 'social' },
  { gene_type: 'mouth', gene_count: 7, tier: 'rare', name: 'Chorus', description: 'Mouths hum in harmony', lore_text: 'A symphony of connection.', stat_key: 'Communication', value: 25, domain: 'social' },
  { gene_type: 'face_mask', gene_count: 3, tier: 'common', name: 'Many Faces', description: '+10% Charisma', lore_text: 'It wears the faces of all it has met.', stat_key: 'Charisma', value: 10, domain: 'social' },
  { gene_type: 'vocal_cord', gene_count: 3, tier: 'common', name: 'Resonant Voice', description: '+10% Influence', lore_text: 'Its voice moves mountains.', stat_key: 'Influence', value: 10, domain: 'social' },
  { gene_type: 'echo_chamber', gene_count: 3, tier: 'common', name: 'Deep Listener', description: '+10% Empathy', lore_text: 'It hears what words cannot say.', stat_key: 'Empathy', value: 10, domain: 'social' },
  { gene_type: 'harmony_thread', gene_count: 3, tier: 'common', name: 'Team Player', description: '+10% Leadership', lore_text: 'Connected to all.', stat_key: 'Leadership', value: 10, domain: 'social' },
  { gene_type: 'memory_face', gene_count: 3, tier: 'common', name: 'Remembered', description: '+10% Bonds', lore_text: 'Every face a bond that cannot break.', stat_key: 'Bonds', value: 10, domain: 'social' },
];

export function getAllTraits(): Trait[] {
  return TRAIT_TEMPLATES.map((t, i) => ({
    id: `trait_${t.domain}_${t.gene_type}_${t.tier}_${i}`,
    name: t.name,
    description: t.description,
    lore_text: t.lore_text,
    tier: t.tier,
    condition: {
      gene_type: t.gene_type,
      gene_count: t.gene_count,
      unique_types: t.unique_types,
    },
    effect: {
      type: 'stat_boost' as const,
      stat_key: t.stat_key,
      value: t.value,
    },
    visual_modifier: {
      glow_color: DOMAIN_COLORS[t.domain],
      particle_type: t.tier === 'legendary' ? 'intense' : t.tier === 'epic' ? 'medium' : 'subtle',
    },
  }));
}
