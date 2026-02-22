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
  { gene_type: 'blood_shard', gene_count: 3, tier: 'common', name: 'Bloodwell', description: '+10% Regeneration', lore_text: 'The blood remembers how to mend.', stat_key: 'Regeneration', value: 10, domain: 'health' },
  { gene_type: 'blood_shard', gene_count: 7, tier: 'rare', name: 'Crimson Tide', description: 'Wounds heal before they\'re felt', lore_text: 'It bleeds. And then it doesn\'t.', stat_key: 'Regeneration', value: 25, domain: 'health' },
  { gene_type: 'blood_shard', gene_count: 15, tier: 'epic', name: 'Immortal Ichor', description: '+50% Regeneration, glowing blood visible', lore_text: 'Its blood is not blood. It is something older.', stat_key: 'Regeneration', value: 50, domain: 'health' },
  { gene_type: 'nerve_bundle', gene_count: 3, tier: 'common', name: 'Sharp Reflexes', description: '+10% Reflexes', lore_text: 'Faster than thought. Faster than fear.', stat_key: 'Reflexes', value: 10, domain: 'health' },
  { gene_type: 'nerve_bundle', gene_count: 7, tier: 'rare', name: 'Lightning Nerves', description: 'Reactions become near-instant', lore_text: 'It moves before the threat exists.', stat_key: 'Reflexes', value: 25, domain: 'health' },
  { gene_type: 'marrow_core', gene_count: 3, tier: 'common', name: 'Deep Reserves', description: '+10% Endurance', lore_text: 'It draws from wells that never empty.', stat_key: 'Endurance', value: 10, domain: 'health' },
  { gene_type: 'marrow_core', gene_count: 7, tier: 'rare', name: 'Inexhaustible', description: 'Fatigue becomes a distant memory', lore_text: 'Long after others have fallen, it remains.', stat_key: 'Endurance', value: 25, domain: 'health' },

  // --- MIND WEAVER TRAITS ---
  { gene_type: 'eye_cluster', gene_count: 3, tier: 'common', name: 'Watchful', description: '+10% Perception', lore_text: 'It sees all. It forgets nothing.', stat_key: 'Perception', value: 10, domain: 'mind' },
  { gene_type: 'eye_cluster', gene_count: 7, tier: 'rare', name: 'Omnivision', description: 'Eyes track independently', lore_text: 'Where do you hide from a thousand eyes?', stat_key: 'Perception', value: 25, domain: 'mind' },
  { gene_type: 'neural_tendril', gene_count: 3, tier: 'common', name: 'Quick Learner', description: '+10% Intelligence', lore_text: 'Knowledge flows like current.', stat_key: 'Intelligence', value: 10, domain: 'mind' },
  { gene_type: 'neural_tendril', gene_count: 7, tier: 'rare', name: 'Neural Network', description: 'Tendrils arc with lightning', lore_text: 'A mind unbound by matter.', stat_key: 'Intelligence', value: 25, domain: 'mind' },
  { gene_type: 'skull_graft', gene_count: 3, tier: 'common', name: 'Accumulated Wisdom', description: '+10% Wisdom', lore_text: 'The skulls whisper old truths.', stat_key: 'Wisdom', value: 10, domain: 'mind' },
  { gene_type: 'synapse_arc', gene_count: 3, tier: 'common', name: 'Lightning Mind', description: '+10% Focus', lore_text: 'Thought moves at the speed of light.', stat_key: 'Focus', value: 10, domain: 'mind' },
  { gene_type: 'memory_sac', gene_count: 3, tier: 'common', name: 'Perfect Recall', description: '+10% Memory', lore_text: 'Every moment, preserved in amber.', stat_key: 'Memory', value: 10, domain: 'mind' },
  { gene_type: 'psychic_crown', gene_count: 3, tier: 'common', name: 'Psychic Aura', description: '+10% Influence', lore_text: 'Its presence reshapes thought.', stat_key: 'Influence', value: 10, domain: 'mind' },
  { gene_type: 'cortex_fold', gene_count: 3, tier: 'common', name: 'Creative Spark', description: '+10% Creativity', lore_text: 'The cortex folds in new directions.', stat_key: 'Creativity', value: 10, domain: 'mind' },
  { gene_type: 'cortex_fold', gene_count: 7, tier: 'rare', name: 'Divergent Thinker', description: 'Solutions appear from impossible angles', lore_text: 'It thinks sideways through walls.', stat_key: 'Creativity', value: 25, domain: 'mind' },
  { gene_type: 'cortex_fold', gene_count: 15, tier: 'epic', name: 'Genius Loci', description: '+50% Creativity, aura inspires nearby', lore_text: 'Near it, ideas bloom in minds not its own.', stat_key: 'Creativity', value: 50, domain: 'mind' },
  { gene_type: 'dream_gland', gene_count: 3, tier: 'common', name: 'Gut Feeling', description: '+10% Intuition', lore_text: 'It knows without knowing how it knows.', stat_key: 'Intuition', value: 10, domain: 'mind' },
  { gene_type: 'dream_gland', gene_count: 7, tier: 'rare', name: 'Dream Walker', description: 'Intuition becomes eerily accurate', lore_text: 'Its dreams show what waking eyes miss.', stat_key: 'Intuition', value: 25, domain: 'mind' },
  { gene_type: 'third_eye', gene_count: 3, tier: 'common', name: 'Inner Sight', description: '+10% Foresight', lore_text: 'The third eye opens. Time bends.', stat_key: 'Foresight', value: 10, domain: 'mind' },
  { gene_type: 'third_eye', gene_count: 7, tier: 'rare', name: 'Oracle\'s Vision', description: 'See patterns before they emerge', lore_text: 'The future is a book, and it reads ahead.', stat_key: 'Foresight', value: 25, domain: 'mind' },

  // --- CHAIN WRAITH TRAITS ---
  { gene_type: 'chain_link', gene_count: 3, tier: 'common', name: 'Bound', description: '+10% Consistency', lore_text: 'Each link a day. Each day a promise.', stat_key: 'Consistency', value: 10, domain: 'discipline' },
  { gene_type: 'chain_link', gene_count: 7, tier: 'rare', name: 'Unbreakable Chain', description: 'Chains glow with spectral fire', lore_text: 'Forged in routine. Tempered by will.', stat_key: 'Consistency', value: 25, domain: 'discipline' },
  { gene_type: 'chain_link', gene_count: 15, tier: 'epic', name: 'Eternal Binding', description: '+50% Consistency', lore_text: 'The chain has no beginning. No end.', stat_key: 'Consistency', value: 50, domain: 'discipline' },
  { gene_type: 'iron_plate', gene_count: 3, tier: 'common', name: 'Iron Will', description: '+10% Willpower', lore_text: 'Temptation breaks upon its armor.', stat_key: 'Willpower', value: 10, domain: 'discipline' },
  { gene_type: 'lock_core', gene_count: 3, tier: 'common', name: 'Lockdown', description: '+10% Resilience', lore_text: 'What is locked can never be lost.', stat_key: 'Resilience', value: 10, domain: 'discipline' },
  { gene_type: 'ember_node', gene_count: 3, tier: 'common', name: 'Morning Fire', description: '+10% Discipline', lore_text: 'It burns brightest at dawn.', stat_key: 'Discipline', value: 10, domain: 'discipline' },
  { gene_type: 'spectral_layer', gene_count: 3, tier: 'common', name: 'Ghost Shroud', description: '+10% Calm', lore_text: 'Silence is its armor.', stat_key: 'Calm', value: 10, domain: 'discipline' },
  { gene_type: 'wardens_eye', gene_count: 3, tier: 'common', name: 'Ever Watching', description: '+10% Vigilance', lore_text: 'The warden never sleeps.', stat_key: 'Vigilance', value: 10, domain: 'discipline' },
  { gene_type: 'anchor_bone', gene_count: 3, tier: 'common', name: 'Grounded', description: '+10% Determination', lore_text: 'Rooted deep. Immovable.', stat_key: 'Determination', value: 10, domain: 'discipline' },
  { gene_type: 'anchor_bone', gene_count: 7, tier: 'rare', name: 'Unshakable', description: 'Nothing can dislodge it from purpose', lore_text: 'Mountains move before it does.', stat_key: 'Determination', value: 25, domain: 'discipline' },
  { gene_type: 'anchor_bone', gene_count: 15, tier: 'epic', name: 'Adamantine Will', description: '+50% Determination, anchor visible on body', lore_text: 'Its will is the anchor of worlds.', stat_key: 'Determination', value: 50, domain: 'discipline' },
  { gene_type: 'scar_tissue', gene_count: 3, tier: 'common', name: 'Battle Hardened', description: '+10% Tolerance', lore_text: 'Every scar is a lesson survived.', stat_key: 'Tolerance', value: 10, domain: 'discipline' },
  { gene_type: 'scar_tissue', gene_count: 7, tier: 'rare', name: 'Pain Is Nothing', description: 'Discomfort becomes invisible', lore_text: 'It has been hurt so many times it forgot how to feel pain.', stat_key: 'Tolerance', value: 25, domain: 'discipline' },
  { gene_type: 'ritual_glyph', gene_count: 3, tier: 'common', name: 'Daily Ritual', description: '+10% Routine', lore_text: 'The glyph pulses with habitual power.', stat_key: 'Routine', value: 10, domain: 'discipline' },
  { gene_type: 'ritual_glyph', gene_count: 7, tier: 'rare', name: 'Sacred Pattern', description: 'Routines become effortless', lore_text: 'The ritual performs itself. The body follows.', stat_key: 'Routine', value: 25, domain: 'discipline' },

  // --- ROT ENGINE TRAITS ---
  { gene_type: 'gear_assembly', gene_count: 3, tier: 'common', name: 'Efficient Machine', description: '+10% Productivity', lore_text: 'The gears turn. The work gets done.', stat_key: 'Productivity', value: 10, domain: 'career' },
  { gene_type: 'gear_assembly', gene_count: 7, tier: 'rare', name: 'Industrial Complex', description: 'Gears visibly rotate', lore_text: 'An engine that builds engines.', stat_key: 'Productivity', value: 25, domain: 'career' },
  { gene_type: 'cable_nerve', gene_count: 3, tier: 'common', name: 'Connected', description: '+10% Networking', lore_text: 'Every cable a bridge.', stat_key: 'Networking', value: 10, domain: 'career' },
  { gene_type: 'piston_limb', gene_count: 3, tier: 'common', name: 'Practiced Hands', description: '+10% Craft', lore_text: 'Repetition forges mastery.', stat_key: 'Craft', value: 10, domain: 'career' },
  { gene_type: 'furnace_core', gene_count: 3, tier: 'common', name: 'Burning Focus', description: '+10% Focus', lore_text: 'The furnace never dims.', stat_key: 'Focus', value: 10, domain: 'career' },
  { gene_type: 'blueprint_glyph', gene_count: 3, tier: 'common', name: 'Master Planner', description: '+10% Strategy', lore_text: 'Every line drawn with purpose.', stat_key: 'Strategy', value: 10, domain: 'career' },
  { gene_type: 'exhaust_vent', gene_count: 3, tier: 'common', name: 'Release Valve', description: '+10% Output', lore_text: 'Pressure creates. Venting delivers.', stat_key: 'Output', value: 10, domain: 'career' },
  { gene_type: 'spark_plug', gene_count: 3, tier: 'common', name: 'Bright Idea', description: '+10% Innovation', lore_text: 'One spark changes everything.', stat_key: 'Innovation', value: 10, domain: 'career' },
  { gene_type: 'spark_plug', gene_count: 7, tier: 'rare', name: 'Serial Inventor', description: 'New ideas come in rapid bursts', lore_text: 'The sparks never stop. Each one a blueprint.', stat_key: 'Innovation', value: 25, domain: 'career' },
  { gene_type: 'spark_plug', gene_count: 15, tier: 'epic', name: 'Visionary Engine', description: '+50% Innovation, lightning arcs visible', lore_text: 'It does not follow the path. It builds new ones.', stat_key: 'Innovation', value: 50, domain: 'career' },
  { gene_type: 'conduit_wire', gene_count: 3, tier: 'common', name: 'Quick Adapter', description: '+10% Adaptability', lore_text: 'It bends. It never breaks.', stat_key: 'Adaptability', value: 10, domain: 'career' },
  { gene_type: 'conduit_wire', gene_count: 7, tier: 'rare', name: 'Shapeshifter', description: 'Pivots become seamless transitions', lore_text: 'Change is not disruption. Change is fuel.', stat_key: 'Adaptability', value: 25, domain: 'career' },
  { gene_type: 'output_valve', gene_count: 3, tier: 'common', name: 'Finisher', description: '+10% Execution', lore_text: 'The last mile is where it excels.', stat_key: 'Execution', value: 10, domain: 'career' },
  { gene_type: 'output_valve', gene_count: 7, tier: 'rare', name: 'Closer', description: 'Projects complete with relentless momentum', lore_text: 'Once it starts, it finishes. Always.', stat_key: 'Execution', value: 25, domain: 'career' },

  // --- GILT HORROR TRAITS ---
  { gene_type: 'gold_scale', gene_count: 3, tier: 'common', name: 'Gilded Hide', description: '+10% Savings', lore_text: 'Each scale a coin saved.', stat_key: 'Savings', value: 10, domain: 'finance' },
  { gene_type: 'gold_scale', gene_count: 7, tier: 'rare', name: 'Golden Armor', description: 'Scales shimmer and reflect', lore_text: 'Wealth made manifest.', stat_key: 'Savings', value: 25, domain: 'finance' },
  { gene_type: 'coin_disc', gene_count: 3, tier: 'common', name: 'Penny Wise', description: '+10% Awareness', lore_text: 'It counts. It always counts.', stat_key: 'Awareness', value: 10, domain: 'finance' },
  { gene_type: 'vault_door', gene_count: 3, tier: 'common', name: 'Fortified', description: '+10% Security', lore_text: 'No thief can breach this.', stat_key: 'Security', value: 10, domain: 'finance' },
  { gene_type: 'investment_tendril', gene_count: 3, tier: 'common', name: 'Compound Growth', description: '+10% Growth', lore_text: 'From one tendril, a thousand grow.', stat_key: 'Growth', value: 10, domain: 'finance' },
  { gene_type: 'ledger_glyph', gene_count: 3, tier: 'common', name: 'Financial Literacy', description: '+10% Knowledge', lore_text: 'The numbers tell a story.', stat_key: 'Knowledge', value: 10, domain: 'finance' },
  { gene_type: 'crown_jewel', gene_count: 3, tier: 'common', name: 'Crowned', description: '+10% Wealth', lore_text: 'A jewel for every triumph.', stat_key: 'Wealth', value: 10, domain: 'finance' },
  { gene_type: 'debt_fang', gene_count: 3, tier: 'common', name: 'Risk Taker', description: '+10% Risk Management', lore_text: 'It bites risk before risk bites back.', stat_key: 'Risk Management', value: 10, domain: 'finance' },
  { gene_type: 'debt_fang', gene_count: 7, tier: 'rare', name: 'Calculated Gambit', description: 'Risks yield outsized returns', lore_text: 'It sees opportunity where others see danger.', stat_key: 'Risk Management', value: 25, domain: 'finance' },
  { gene_type: 'debt_fang', gene_count: 15, tier: 'epic', name: 'Master of Risk', description: '+50% Risk Management, fangs glow golden', lore_text: 'Risk bows to it. Reward follows.', stat_key: 'Risk Management', value: 50, domain: 'finance' },
  { gene_type: 'compound_crystal', gene_count: 3, tier: 'common', name: 'Patient Growth', description: '+10% Patience', lore_text: 'Time is the greatest multiplier.', stat_key: 'Patience', value: 10, domain: 'finance' },
  { gene_type: 'compound_crystal', gene_count: 7, tier: 'rare', name: 'Diamond Patience', description: 'Long-term thinking becomes crystal clear', lore_text: 'Pressure and time create diamonds.', stat_key: 'Patience', value: 25, domain: 'finance' },
  { gene_type: 'trade_tendril', gene_count: 3, tier: 'common', name: 'Haggler', description: '+10% Negotiation', lore_text: 'Every deal tilts in its favor.', stat_key: 'Negotiation', value: 10, domain: 'finance' },
  { gene_type: 'trade_tendril', gene_count: 7, tier: 'rare', name: 'Master Dealer', description: 'Negotiations become one-sided victories', lore_text: 'Its tendrils find every advantage.', stat_key: 'Negotiation', value: 25, domain: 'finance' },

  // --- HOLLOW SINGER TRAITS ---
  { gene_type: 'mouth', gene_count: 3, tier: 'common', name: 'Many Voices', description: '+10% Communication', lore_text: 'Every mouth speaks truth.', stat_key: 'Communication', value: 10, domain: 'social' },
  { gene_type: 'mouth', gene_count: 7, tier: 'rare', name: 'Chorus', description: 'Mouths hum in harmony', lore_text: 'A symphony of connection.', stat_key: 'Communication', value: 25, domain: 'social' },
  { gene_type: 'face_mask', gene_count: 3, tier: 'common', name: 'Many Faces', description: '+10% Charisma', lore_text: 'It wears the faces of all it has met.', stat_key: 'Charisma', value: 10, domain: 'social' },
  { gene_type: 'vocal_cord', gene_count: 3, tier: 'common', name: 'Resonant Voice', description: '+10% Influence', lore_text: 'Its voice moves mountains.', stat_key: 'Influence', value: 10, domain: 'social' },
  { gene_type: 'echo_chamber', gene_count: 3, tier: 'common', name: 'Deep Listener', description: '+10% Empathy', lore_text: 'It hears what words cannot say.', stat_key: 'Empathy', value: 10, domain: 'social' },
  { gene_type: 'harmony_thread', gene_count: 3, tier: 'common', name: 'Team Player', description: '+10% Leadership', lore_text: 'Connected to all.', stat_key: 'Leadership', value: 10, domain: 'social' },
  { gene_type: 'memory_face', gene_count: 3, tier: 'common', name: 'Remembered', description: '+10% Bonds', lore_text: 'Every face a bond that cannot break.', stat_key: 'Bonds', value: 10, domain: 'social' },
  { gene_type: 'mirror_shard', gene_count: 3, tier: 'common', name: 'True Self', description: '+10% Authenticity', lore_text: 'It reflects truth, not appearances.', stat_key: 'Authenticity', value: 10, domain: 'social' },
  { gene_type: 'mirror_shard', gene_count: 7, tier: 'rare', name: 'Unmasked', description: 'Genuine connections form effortlessly', lore_text: 'Behind the mask there is no mask.', stat_key: 'Authenticity', value: 25, domain: 'social' },
  { gene_type: 'mirror_shard', gene_count: 15, tier: 'epic', name: 'Soul Mirror', description: '+50% Authenticity, mirror shards orbit body', lore_text: 'In its presence, all pretense dissolves.', stat_key: 'Authenticity', value: 50, domain: 'social' },
  { gene_type: 'pulse_drum', gene_count: 3, tier: 'common', name: 'Heartbeat', description: '+10% Motivation', lore_text: 'Its rhythm moves others to action.', stat_key: 'Motivation', value: 10, domain: 'social' },
  { gene_type: 'pulse_drum', gene_count: 7, tier: 'rare', name: 'War Drum', description: 'Inspires action in all who hear', lore_text: 'The drum beats. Hearts follow.', stat_key: 'Motivation', value: 25, domain: 'social' },
  { gene_type: 'bond_marrow', gene_count: 3, tier: 'common', name: 'Faithful', description: '+10% Loyalty', lore_text: 'Some bonds go deeper than blood.', stat_key: 'Loyalty', value: 10, domain: 'social' },
  { gene_type: 'bond_marrow', gene_count: 7, tier: 'rare', name: 'Sworn Protector', description: 'Loyalty becomes absolute devotion', lore_text: 'It would face oblivion for those it loves.', stat_key: 'Loyalty', value: 25, domain: 'social' },
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
