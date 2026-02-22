// ============================================================
// GENETIC EVOLUTION ENGINE
// ============================================================
// Implements a real genetic algorithm for procedural creature
// generation. Each creature's visual appearance is driven by
// a chromosome (array of float genes) that undergoes mutation
// when new game genes are acquired, and crossover during fusion.
//
// Key concepts:
// - Chromosome: A fixed-length float array encoding visual traits
// - Loci: Named positions in the chromosome (body shape, limb count, etc.)
// - Mutation: Small random perturbations when genes are added
// - Crossover: Blending chromosomes during gene fusion
// - Phenotype: The visual output derived from the chromosome
// - Fitness: Based on gene count, diversity, and tier quality

import type { Creature, GeneTier, EvolutionStage } from '../types';

// ============================================================
// CHROMOSOME STRUCTURE
// ============================================================

// Each locus encodes a specific visual trait as a float [0, 1]
export interface CreatureChromosome {
  // Body morphology (0-1 floats)
  bodyElongation: number;     // 0 = round, 1 = tall/narrow
  bodyAsymmetry: number;      // 0 = symmetric, 1 = very asymmetric
  bodySegments: number;       // mapped to 1-5 segments
  bodyTextureDensity: number; // surface detail density

  // Limb configuration
  tentacleLength: number;     // 0 = stubby, 1 = very long
  tentacleCurl: number;       // 0 = straight, 1 = spiraling
  tentacleThickness: number;  // 0 = thin/wispy, 1 = thick/muscular
  tentacleBranching: number;  // 0 = none, 1 = heavily branched

  // Sensory organs
  eyeSpread: number;          // 0 = clustered, 1 = spread across body
  eyeSize: number;            // 0 = small/beady, 1 = large/bulging
  eyeGlowIntensity: number;  // 0 = dim, 1 = intense
  pupilShape: number;         // 0 = round, 0.5 = slit, 1 = cross

  // Mouth configuration
  mouthWidth: number;         // 0 = small, 1 = gaping
  mouthTeeth: number;         // 0 = none, 1 = many sharp
  jawProtrusion: number;      // 0 = flat, 1 = protruding

  // Surface features
  spineCount: number;         // 0 = none, 1 = heavily spined
  spineLength: number;        // 0 = short, 1 = very long
  plateCount: number;         // 0 = none, 1 = heavily armored
  scarring: number;           // 0 = smooth, 1 = battle-scarred

  // Color genetics
  hueShift: number;           // color rotation from base domain color
  saturation: number;         // 0 = desaturated, 1 = vivid
  luminanceContrast: number;  // 0 = flat, 1 = high contrast
  metallicSheen: number;      // 0 = matte, 1 = metallic
  bioluminescence: number;    // 0 = none, 1 = intense glow

  // Aura / ambient
  auraIntensity: number;      // 0 = none, 1 = strong aura
  auraComplexity: number;     // 0 = simple, 1 = complex patterns
  particleDensity: number;    // ambient particle density
  distortionField: number;    // 0 = none, 1 = strong visual distortion
}

const CHROMOSOME_KEYS: (keyof CreatureChromosome)[] = [
  'bodyElongation', 'bodyAsymmetry', 'bodySegments', 'bodyTextureDensity',
  'tentacleLength', 'tentacleCurl', 'tentacleThickness', 'tentacleBranching',
  'eyeSpread', 'eyeSize', 'eyeGlowIntensity', 'pupilShape',
  'mouthWidth', 'mouthTeeth', 'jawProtrusion',
  'spineCount', 'spineLength', 'plateCount', 'scarring',
  'hueShift', 'saturation', 'luminanceContrast', 'metallicSheen', 'bioluminescence',
  'auraIntensity', 'auraComplexity', 'particleDensity', 'distortionField',
];

// ============================================================
// SEEDED PRNG
// ============================================================

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// GENERATE INITIAL CHROMOSOME
// ============================================================

/**
 * Generate a starter chromosome from a creature's appearance seed.
 * Each domain biases certain traits differently.
 */
export function generateInitialChromosome(seed: number, domain: string): CreatureChromosome {
  const rand = mulberry32(seed);
  const chr: CreatureChromosome = {} as CreatureChromosome;

  // Start with random base values
  for (const key of CHROMOSOME_KEYS) {
    chr[key] = rand() * 0.3; // Start low — creatures grow over time
  }

  // Domain biases — each domain emphasizes different traits
  switch (domain) {
    case 'health':
      chr.bodyElongation = 0.2 + rand() * 0.2;
      chr.tentacleThickness = 0.3 + rand() * 0.2;
      chr.mouthTeeth = 0.2 + rand() * 0.3;
      chr.scarring = 0.1 + rand() * 0.2;
      break;
    case 'mind':
      chr.eyeSpread = 0.2 + rand() * 0.3;
      chr.eyeSize = 0.3 + rand() * 0.2;
      chr.eyeGlowIntensity = 0.2 + rand() * 0.3;
      chr.bioluminescence = 0.2 + rand() * 0.2;
      break;
    case 'discipline':
      chr.plateCount = 0.2 + rand() * 0.3;
      chr.spineCount = 0.1 + rand() * 0.2;
      chr.metallicSheen = 0.3 + rand() * 0.2;
      chr.auraIntensity = 0.1 + rand() * 0.2;
      break;
    case 'career':
      chr.bodySegments = 0.3 + rand() * 0.2;
      chr.tentacleBranching = 0.2 + rand() * 0.2;
      chr.bodyTextureDensity = 0.2 + rand() * 0.3;
      chr.metallicSheen = 0.2 + rand() * 0.3;
      break;
    case 'finance':
      chr.metallicSheen = 0.4 + rand() * 0.2;
      chr.luminanceContrast = 0.3 + rand() * 0.2;
      chr.plateCount = 0.3 + rand() * 0.2;
      chr.saturation = 0.3 + rand() * 0.3;
      break;
    case 'social':
      chr.mouthWidth = 0.2 + rand() * 0.3;
      chr.auraComplexity = 0.2 + rand() * 0.3;
      chr.particleDensity = 0.2 + rand() * 0.2;
      chr.eyeGlowIntensity = 0.1 + rand() * 0.3;
      break;
  }

  return chr;
}

// ============================================================
// MUTATION
// ============================================================

/**
 * Mutate a chromosome when a new gene is added.
 * The mutation strength depends on the gene tier.
 * Different gene types affect different chromosome loci.
 */
export function mutateChromosome(
  chr: CreatureChromosome,
  geneType: string,
  tier: GeneTier,
  seed: number,
): CreatureChromosome {
  const rand = mulberry32(seed);
  const mutated = { ...chr };

  // Mutation rate scales with tier
  const mutationStrength: Record<GeneTier, number> = {
    base: 0.02,
    dense: 0.04,
    hyper: 0.08,
    titan: 0.15,
  };
  const strength = mutationStrength[tier];

  // Gene-type-specific targeted mutations
  const targetLoci = getGeneLoci(geneType);
  for (const locus of targetLoci) {
    const delta = (rand() - 0.4) * strength * 2; // Slight positive bias
    mutated[locus] = clamp(mutated[locus] + delta, 0, 1);
  }

  // Small random drift on all loci (genetic drift)
  for (const key of CHROMOSOME_KEYS) {
    const drift = (rand() - 0.5) * strength * 0.3;
    mutated[key] = clamp(mutated[key] + drift, 0, 1);
  }

  return mutated;
}

/**
 * Map gene types to the chromosome loci they influence.
 */
function getGeneLoci(geneType: string): (keyof CreatureChromosome)[] {
  const mapping: Record<string, (keyof CreatureChromosome)[]> = {
    // Health genes → body/physical traits
    muscle_fiber: ['bodyElongation', 'tentacleThickness', 'bodySegments'],
    bone_plate: ['plateCount', 'bodyTextureDensity', 'scarring'],
    vein_network: ['bioluminescence', 'saturation', 'bodyTextureDensity'],
    tendon_whip: ['tentacleLength', 'tentacleCurl', 'tentacleBranching'],
    organ_sac: ['bodySegments', 'bodyAsymmetry', 'bodyElongation'],
    tooth_row: ['mouthTeeth', 'mouthWidth', 'jawProtrusion'],

    blood_shard: ['bioluminescence', 'saturation', 'bodyTextureDensity'],
    nerve_bundle: ['tentacleCurl', 'tentacleLength', 'eyeGlowIntensity'],
    marrow_core: ['bodyElongation', 'bodySegments', 'plateCount'],

    // Mind genes → sensory traits
    eye_cluster: ['eyeSpread', 'eyeSize', 'eyeGlowIntensity'],
    neural_tendril: ['tentacleCurl', 'bioluminescence', 'auraComplexity'],
    skull_graft: ['plateCount', 'bodyAsymmetry', 'scarring'],
    synapse_arc: ['eyeGlowIntensity', 'bioluminescence', 'distortionField'],
    memory_sac: ['bodySegments', 'bodyAsymmetry', 'auraComplexity'],
    psychic_crown: ['auraIntensity', 'distortionField', 'particleDensity'],

    cortex_fold: ['auraComplexity', 'bodyAsymmetry', 'distortionField'],
    dream_gland: ['auraIntensity', 'particleDensity', 'hueShift'],
    third_eye: ['eyeSize', 'eyeGlowIntensity', 'distortionField'],

    // Discipline genes → armor/structure
    chain_link: ['metallicSheen', 'bodyTextureDensity', 'plateCount'],
    iron_plate: ['plateCount', 'metallicSheen', 'luminanceContrast'],
    lock_core: ['bodySegments', 'metallicSheen', 'bodyTextureDensity'],
    ember_node: ['bioluminescence', 'saturation', 'auraIntensity'],
    spectral_layer: ['auraIntensity', 'distortionField', 'particleDensity'],
    wardens_eye: ['eyeSize', 'eyeGlowIntensity', 'pupilShape'],

    anchor_bone: ['plateCount', 'bodyElongation', 'spineLength'],
    scar_tissue: ['scarring', 'plateCount', 'bodyTextureDensity'],
    ritual_glyph: ['auraComplexity', 'bioluminescence', 'metallicSheen'],

    // Career genes → mechanical traits
    gear_assembly: ['bodySegments', 'metallicSheen', 'bodyTextureDensity'],
    cable_nerve: ['tentacleLength', 'tentacleBranching', 'metallicSheen'],
    piston_limb: ['tentacleThickness', 'bodyElongation', 'metallicSheen'],
    furnace_core: ['bioluminescence', 'saturation', 'luminanceContrast'],
    blueprint_glyph: ['bodyTextureDensity', 'auraComplexity', 'metallicSheen'],
    exhaust_vent: ['particleDensity', 'bodyAsymmetry', 'distortionField'],

    spark_plug: ['bioluminescence', 'eyeGlowIntensity', 'particleDensity'],
    conduit_wire: ['tentacleBranching', 'metallicSheen', 'bodyTextureDensity'],
    output_valve: ['particleDensity', 'distortionField', 'auraIntensity'],

    // Finance genes → ornamental traits
    gold_scale: ['metallicSheen', 'saturation', 'plateCount'],
    coin_disc: ['plateCount', 'metallicSheen', 'luminanceContrast'],
    vault_door: ['plateCount', 'bodyTextureDensity', 'metallicSheen'],
    investment_tendril: ['tentacleLength', 'tentacleBranching', 'saturation'],
    ledger_glyph: ['bodyTextureDensity', 'auraComplexity', 'luminanceContrast'],
    crown_jewel: ['bioluminescence', 'saturation', 'metallicSheen'],

    debt_fang: ['mouthTeeth', 'jawProtrusion', 'spineCount'],
    compound_crystal: ['metallicSheen', 'bioluminescence', 'luminanceContrast'],
    trade_tendril: ['tentacleLength', 'tentacleBranching', 'tentacleCurl'],

    // Social genes → expressive traits
    mouth: ['mouthWidth', 'mouthTeeth', 'jawProtrusion'],
    face_mask: ['bodyAsymmetry', 'eyeSpread', 'pupilShape'],
    vocal_cord: ['tentacleCurl', 'particleDensity', 'auraComplexity'],
    echo_chamber: ['auraIntensity', 'auraComplexity', 'distortionField'],
    harmony_thread: ['tentacleCurl', 'bioluminescence', 'auraComplexity'],
    memory_face: ['bodyAsymmetry', 'eyeSize', 'scarring'],
    mirror_shard: ['luminanceContrast', 'eyeGlowIntensity', 'hueShift'],
    pulse_drum: ['auraIntensity', 'particleDensity', 'bioluminescence'],
    bond_marrow: ['bodySegments', 'bodyTextureDensity', 'auraComplexity'],
  };

  return mapping[geneType] || ['bodyTextureDensity', 'bodyAsymmetry'];
}

// ============================================================
// CROSSOVER (for gene fusion)
// ============================================================

/**
 * Perform uniform crossover between two chromosomes.
 * Used during gene fusion to blend traits.
 */
export function crossover(
  parent1: CreatureChromosome,
  parent2: CreatureChromosome,
  seed: number,
): CreatureChromosome {
  const rand = mulberry32(seed);
  const child: CreatureChromosome = {} as CreatureChromosome;

  for (const key of CHROMOSOME_KEYS) {
    if (rand() < 0.5) {
      // Inherit from parent 1
      child[key] = parent1[key];
    } else {
      // Inherit from parent 2
      child[key] = parent2[key];
    }

    // Small blending (intermediate inheritance)
    const blend = rand() * 0.3;
    child[key] = child[key] * (1 - blend) + ((parent1[key] + parent2[key]) / 2) * blend;
  }

  return child;
}

// ============================================================
// FITNESS CALCULATION
// ============================================================

/**
 * Calculate a fitness score for a creature based on its stats.
 * Higher fitness = more visually impressive/complex rendering.
 */
export function calculateFitness(creature: Creature): number {
  const geneCount = creature.total_genes;
  const uniqueTypes = Object.keys(creature.genes).length;
  const power = creature.total_power;
  const traitCount = creature.traits.length;

  // Weighted fitness components
  const geneFitness = Math.min(geneCount / 300, 1); // Max at 300 genes
  const diversityFitness = Math.min(uniqueTypes / 6, 1); // Max at 6 types
  const powerFitness = Math.min(power / 5000, 1);
  const traitFitness = Math.min(traitCount / 10, 1);

  return (
    geneFitness * 0.3 +
    diversityFitness * 0.25 +
    powerFitness * 0.25 +
    traitFitness * 0.2
  );
}

// ============================================================
// PHENOTYPE EXTRACTION
// ============================================================

/**
 * Convert a chromosome + evolution stage into concrete render parameters.
 * This is the genotype → phenotype mapping.
 */
export interface CreaturePhenotype {
  // Body
  bodyPointCount: number;
  bodyRadiusMultiplier: number;
  bodyVerticalStretch: number;
  bodyWobbleAmplitude: number;
  segmentCount: number;

  // Tentacles
  tentacleCount: number;
  tentacleBaseLength: number;
  tentacleCurvature: number;
  tentacleWidth: number;
  tentacleBranches: number;

  // Eyes
  eyeCount: number;
  eyeBaseSize: number;
  eyeSpreadAngle: number;
  eyeGlow: number;
  pupilType: 'round' | 'slit' | 'cross' | 'star';

  // Mouth
  mouthCount: number;
  mouthScale: number;
  toothCount: number;
  jawExtension: number;

  // Surface
  spines: number;
  spineScale: number;
  plates: number;
  scars: number;

  // Color
  hueRotation: number;
  saturationMult: number;
  contrastMult: number;
  metallic: number;
  glowStrength: number;

  // Aura
  auraRadius: number;
  auraLayers: number;
  ambientParticles: number;
  distortion: number;
}

export function extractPhenotype(chr: CreatureChromosome, stage: EvolutionStage): CreaturePhenotype {
  const stageMultiplier = 1 + stage * 0.4;

  return {
    // Body
    bodyPointCount: Math.floor(8 + chr.bodySegments * 40 * (stage / 5)),
    bodyRadiusMultiplier: 0.8 + chr.bodyElongation * 0.6,
    bodyVerticalStretch: 1 + chr.bodyElongation * 0.5,
    bodyWobbleAmplitude: 0.03 + chr.bodyAsymmetry * 0.12,
    segmentCount: Math.floor(1 + chr.bodySegments * 4),

    // Tentacles
    tentacleCount: Math.floor(2 + chr.tentacleLength * 18 * (stage / 5)),
    tentacleBaseLength: 0.4 + chr.tentacleLength * 1.0,
    tentacleCurvature: chr.tentacleCurl * 2.0,
    tentacleWidth: 1 + chr.tentacleThickness * 4,
    tentacleBranches: Math.floor(chr.tentacleBranching * 3),

    // Eyes
    eyeCount: Math.floor(1 + chr.eyeSize * 14 * (stage / 5)),
    eyeBaseSize: 2 + chr.eyeSize * 6,
    eyeSpreadAngle: 0.6 + chr.eyeSpread * 1.8,
    eyeGlow: chr.eyeGlowIntensity * 12 * stageMultiplier,
    pupilType: chr.pupilShape < 0.25 ? 'round' : chr.pupilShape < 0.5 ? 'slit' : chr.pupilShape < 0.75 ? 'cross' : 'star',

    // Mouth
    mouthCount: Math.floor(chr.mouthWidth * 3 * (stage / 5)),
    mouthScale: 0.2 + chr.mouthWidth * 0.5,
    toothCount: Math.floor(4 + chr.mouthTeeth * 12),
    jawExtension: chr.jawProtrusion * 0.4,

    // Surface
    spines: Math.floor(chr.spineCount * 12 * stageMultiplier),
    spineScale: 0.5 + chr.spineLength * 1.5,
    plates: Math.floor(chr.plateCount * 8 * stageMultiplier),
    scars: Math.floor(chr.scarring * 6),

    // Color
    hueRotation: chr.hueShift * 60 - 30, // ±30 degrees from domain color
    saturationMult: 0.6 + chr.saturation * 0.8,
    contrastMult: 0.7 + chr.luminanceContrast * 0.6,
    metallic: chr.metallicSheen,
    glowStrength: chr.bioluminescence * stageMultiplier,

    // Aura
    auraRadius: chr.auraIntensity * 3 * stageMultiplier,
    auraLayers: Math.floor(1 + chr.auraComplexity * 4),
    ambientParticles: Math.floor(chr.particleDensity * 20 * stageMultiplier),
    distortion: chr.distortionField * 0.3 * stageMultiplier,
  };
}

// ============================================================
// UNIQUENESS SCORING
// ============================================================

/**
 * Calculate how genetically unique a creature is compared to a population.
 * Uses Hamming-like distance across chromosomes.
 */
export function calculateUniqueness(
  chr: CreatureChromosome,
  population: CreatureChromosome[],
): number {
  if (population.length === 0) return 1;

  let totalDistance = 0;
  for (const other of population) {
    let distance = 0;
    for (const key of CHROMOSOME_KEYS) {
      distance += Math.abs(chr[key] - other[key]);
    }
    totalDistance += distance / CHROMOSOME_KEYS.length;
  }

  return totalDistance / population.length;
}

// ============================================================
// UTILITIES
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Serialize chromosome for storage.
 */
export function serializeChromosome(chr: CreatureChromosome): number[] {
  return CHROMOSOME_KEYS.map(key => chr[key]);
}

/**
 * Deserialize chromosome from storage.
 */
export function deserializeChromosome(data: number[]): CreatureChromosome {
  const chr: CreatureChromosome = {} as CreatureChromosome;
  for (let i = 0; i < CHROMOSOME_KEYS.length && i < data.length; i++) {
    chr[CHROMOSOME_KEYS[i]] = data[i];
  }
  // Fill any missing keys with 0.5
  for (const key of CHROMOSOME_KEYS) {
    if (chr[key] === undefined) chr[key] = 0.5;
  }
  return chr;
}
