import { performance } from 'node:perf_hooks';
import { generateDefaultTasks } from '../src/data/defaultTasks.ts';
import {
  applyGeneToCreature,
  createAllCreatures,
  generateGene,
} from '../src/services/gameEngine.ts';
import {
  calculateUniqueness,
  deserializeChromosome,
  extractPhenotype,
} from '../src/services/evolution.ts';
import type { Creature, Domain, GeneTier, Task } from '../src/types/index.ts';
import { createSeededRng, deriveSeed, randomInt } from '../src/utils/prng.ts';

interface BenchmarkOptions {
  samples: number;
  genesPerCreature: number;
  determinismSamples: number;
}

interface BenchmarkTotals {
  totalGenesGenerated: number;
  validGenes: number;
  validChromosomes: number;
  noveltySum: number;
  noveltyCount: number;
  controllabilityHits: number;
  controllabilityTotal: number;
}

const DEFAULTS: BenchmarkOptions = {
  samples: 240,
  genesPerCreature: 28,
  determinismSamples: 24,
};

function parseOptions(argv: string[]): BenchmarkOptions {
  const entries = new Map<string, string>();
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, rawVal] = arg.split('=');
    if (rawVal !== undefined) {
      entries.set(key, rawVal);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      entries.set(key, next);
      i += 1;
    }
  }

  const readInt = (flag: string, fallback: number) => {
    const val = entries.get(flag);
    if (!val) return fallback;
    const parsed = Number.parseInt(val, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  return {
    samples: readInt('--samples', DEFAULTS.samples),
    genesPerCreature: readInt('--genes', DEFAULTS.genesPerCreature),
    determinismSamples: readInt('--determinism-samples', DEFAULTS.determinismSamples),
  };
}

function pickTier(rand: () => number): GeneTier {
  const roll = rand();
  if (roll < 0.68) return 'base';
  if (roll < 0.88) return 'dense';
  if (roll < 0.97) return 'hyper';
  return 'titan';
}

function isGeneVisualValid(creature: Creature, gene: ReturnType<typeof generateGene>): boolean {
  return (
    Number.isFinite(gene.visual_params.size)
    && gene.visual_params.size >= 0.5
    && gene.visual_params.size <= 1.2
    && Number.isFinite(gene.visual_params.color_shift)
    && gene.visual_params.color_shift >= 0
    && gene.visual_params.color_shift <= 1
    && Number.isFinite(gene.visual_params.animation_speed)
    && gene.visual_params.animation_speed >= 0.7
    && gene.visual_params.animation_speed <= 1.2
    && Number.isInteger(gene.visual_params.procedural_seed)
    && gene.visual_params.procedural_seed >= 1
    && creature.domain === gene.domain
  );
}

function isChromosomeValid(creature: Creature): boolean {
  if (!creature.chromosome || creature.chromosome.length === 0) return false;
  for (const value of creature.chromosome) {
    if (!Number.isFinite(value) || value < 0 || value > 1) return false;
  }
  return true;
}

function expectedDomainFromPhenotype(creature: Creature): Domain {
  const chromosome = deserializeChromosome(creature.chromosome ?? []);
  const phenotype = extractPhenotype(chromosome, creature.evolution_stage);
  const scores: Record<Domain, number> = {
    health: phenotype.toothCount + phenotype.spines + phenotype.segmentCount * 0.35,
    mind: phenotype.eyeCount + phenotype.eyeGlow * 0.16 + phenotype.auraLayers * 0.35,
    discipline: phenotype.plates + phenotype.spines * 0.65 + phenotype.metallic * 2.3,
    career: phenotype.segmentCount + phenotype.tentacleBranches * 2 + phenotype.bodyPointCount * 0.08,
    finance: phenotype.metallic * 8 + phenotype.contrastMult * 3 + phenotype.saturationMult * 0.9,
    social: phenotype.mouthCount * 2.8 + phenotype.ambientParticles * 0.12 + phenotype.auraLayers * 0.4,
  };
  let winner: Domain = 'health';
  let best = Number.NEGATIVE_INFINITY;
  for (const [domain, score] of Object.entries(scores) as Array<[Domain, number]>) {
    if (score > best) {
      best = score;
      winner = domain;
    }
  }
  return winner;
}

function signatureForCreatures(creatures: Creature[]): string {
  return creatures
    .map((creature) => {
      const chromosome = creature.chromosome ?? [];
      const head = chromosome
        .slice(0, 8)
        .map((value) => value.toFixed(5))
        .join(',');
      return `${creature.id}:${creature.appearance_seed}:${creature.total_genes}:${head}`;
    })
    .join('|');
}

function simulatePlayerRun(
  sampleIndex: number,
  genesPerCreature: number,
  tasksByDomain: Map<Domain, Task[]>,
): Creature[] {
  const playerId = `pcg-bench-player-${sampleIndex}`;
  const initialCreatures = createAllCreatures(playerId);
  const creaturesById = new Map(initialCreatures.map((creature) => [creature.id, creature]));

  for (const starter of initialCreatures) {
    let creature = creaturesById.get(starter.id) ?? starter;
    const tasks = tasksByDomain.get(creature.domain);
    if (!tasks || tasks.length === 0) continue;

    const rand = createSeededRng(deriveSeed(playerId, starter.id, 'gene-loop'));
    for (let i = 0; i < genesPerCreature; i += 1) {
      const task = tasks[randomInt(rand, 0, tasks.length - 1)];
      const tier = pickTier(rand);
      const gene = generateGene(task.rewards.gene_type, task.domain, task.id, creature, tier);
      const result = applyGeneToCreature(creature, gene);
      creature = result.creature;
    }
    creaturesById.set(creature.id, creature);
  }

  return initialCreatures.map((base) => creaturesById.get(base.id) ?? base);
}

function runBenchmark(options: BenchmarkOptions) {
  const allTasks = generateDefaultTasks();
  const tasksByDomain = new Map<Domain, Task[]>();
  for (const task of allTasks) {
    const entries = tasksByDomain.get(task.domain) ?? [];
    entries.push(task);
    tasksByDomain.set(task.domain, entries);
  }

  const totals: BenchmarkTotals = {
    totalGenesGenerated: 0,
    validGenes: 0,
    validChromosomes: 0,
    noveltySum: 0,
    noveltyCount: 0,
    controllabilityHits: 0,
    controllabilityTotal: 0,
  };

  const startedAt = performance.now();

  for (let sample = 0; sample < options.samples; sample += 1) {
    const playerId = `pcg-bench-player-${sample}`;
    const initialCreatures = createAllCreatures(playerId);
    const creaturesById = new Map(initialCreatures.map((creature) => [creature.id, creature]));

    for (const starter of initialCreatures) {
      let creature = creaturesById.get(starter.id) ?? starter;
      const tasks = tasksByDomain.get(creature.domain);
      if (!tasks || tasks.length === 0) continue;

      const rand = createSeededRng(deriveSeed(playerId, starter.id, 'gene-loop'));
      for (let i = 0; i < options.genesPerCreature; i += 1) {
        const task = tasks[randomInt(rand, 0, tasks.length - 1)];
        const tier = pickTier(rand);
        const gene = generateGene(task.rewards.gene_type, task.domain, task.id, creature, tier);
        totals.totalGenesGenerated += 1;
        if (isGeneVisualValid(creature, gene)) totals.validGenes += 1;
        const result = applyGeneToCreature(creature, gene);
        creature = result.creature;
      }
      creaturesById.set(creature.id, creature);
    }

    const finalCreatures = initialCreatures.map((base) => creaturesById.get(base.id) ?? base);
    const populationChromosomes = finalCreatures.map((creature) => deserializeChromosome(creature.chromosome ?? []));

    for (let i = 0; i < finalCreatures.length; i += 1) {
      const creature = finalCreatures[i];
      if (isChromosomeValid(creature)) totals.validChromosomes += 1;

      const expectedDomain = expectedDomainFromPhenotype(creature);
      totals.controllabilityTotal += 1;
      if (expectedDomain === creature.domain) totals.controllabilityHits += 1;

      const others = populationChromosomes.filter((_, idx) => idx !== i);
      totals.noveltySum += calculateUniqueness(populationChromosomes[i], others);
      totals.noveltyCount += 1;
    }
  }

  let deterministicMatches = 0;
  for (let i = 0; i < options.determinismSamples; i += 1) {
    const first = simulatePlayerRun(i, options.genesPerCreature, tasksByDomain);
    const second = simulatePlayerRun(i, options.genesPerCreature, tasksByDomain);
    if (signatureForCreatures(first) === signatureForCreatures(second)) {
      deterministicMatches += 1;
    }
  }

  const endedAt = performance.now();
  const elapsedMs = endedAt - startedAt;

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      runtimeMs: Math.round(elapsedMs * 100) / 100,
      samples: options.samples,
      genesPerCreature: options.genesPerCreature,
      determinismSamples: options.determinismSamples,
      totalCreatureRuns: options.samples * 6,
      totalGenesGenerated: totals.totalGenesGenerated,
    },
    metrics: {
      validity: {
        geneVisualRate: totals.totalGenesGenerated === 0
          ? 0
          : totals.validGenes / totals.totalGenesGenerated,
        chromosomeRangeRate: (options.samples * 6) === 0
          ? 0
          : totals.validChromosomes / (options.samples * 6),
      },
      diversity: {
        noveltyMean: totals.noveltyCount === 0 ? 0 : totals.noveltySum / totals.noveltyCount,
      },
      controllability: {
        domainSignalAccuracy: totals.controllabilityTotal === 0
          ? 0
          : totals.controllabilityHits / totals.controllabilityTotal,
      },
      reproducibility: {
        deterministicRunRate: options.determinismSamples === 0
          ? 1
          : deterministicMatches / options.determinismSamples,
      },
      throughput: {
        genesPerSecond: elapsedMs <= 0 ? 0 : (totals.totalGenesGenerated / elapsedMs) * 1000,
      },
    },
  };
}

const options = parseOptions(process.argv);
const report = runBenchmark(options);
console.log(JSON.stringify(report, null, 2));
