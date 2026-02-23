// ============================================================
// PROCEDURAL CREATURE RENDERER — Main orchestrator
// ============================================================
// Split into sub-modules for maintainability:
//   renderUtils.ts  — shared types, seededRandom, slot positions
//   baseBody.ts     — base body, ambient effects, tentacles, eyes, mouths
//   mutations.ts    — 50+ individual gene mutation drawing functions
//   phenotype.ts    — phenotype-driven distortion, spines, plates, particles

import type { Creature, BodySlot } from '../types';
import { DOMAIN_COLORS } from '../types';
import {
  deserializeChromosome, extractPhenotype,
  type CreaturePhenotype,
} from '../services/evolution';
import { seededRandom, type RenderContext } from './renderUtils';
import { drawBaseBody } from './baseBody';
import { renderGeneMutation } from './mutations';
import {
  drawDistortionField,
  drawPhenotypeSpines,
  drawPhenotypePlates,
  drawPhenotypeParticles,
} from './phenotype';

export function renderCreature(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  width: number,
  height: number,
  time: number,
  options?: { skipClear?: boolean },
) {
  const domainColor = DOMAIN_COLORS[creature.domain];
  const rand = seededRandom(creature.appearance_seed);

  // Extract phenotype from chromosome if available
  let phenotype: CreaturePhenotype | null = null;
  if (creature.chromosome && creature.chromosome.length > 0) {
    const chr = deserializeChromosome(creature.chromosome);
    phenotype = extractPhenotype(chr, creature.evolution_stage);
  }

  // Clear
  if (!options?.skipClear) {
    ctx.clearRect(0, 0, width, height);
  }

  const rc: RenderContext = { ctx, w: width, h: height, time, creature, domainColor, rand, phenotype };

  // 0. Draw phenotype-driven distortion field
  if (phenotype && phenotype.distortion > 0.05) {
    drawDistortionField(rc, width / 2, height * 0.45, phenotype);
  }

  // 1. Draw base body (enhanced with phenotype)
  drawBaseBody(rc);

  // 2. Draw phenotype-driven spines
  if (phenotype && phenotype.spines > 0) {
    drawPhenotypeSpines(rc, width / 2, height * 0.45, phenotype);
  }

  // 3. Draw phenotype-driven armor plates
  if (phenotype && phenotype.plates > 0) {
    drawPhenotypePlates(rc, width / 2, height * 0.45, phenotype);
  }

  // 4. Draw gene mutations
  for (const [slotName, entries] of Object.entries(creature.body_slots)) {
    if (!entries || entries.length === 0) continue;
    for (let i = 0; i < entries.length; i++) {
      renderGeneMutation(rc, slotName as BodySlot, entries[i], i);
    }
  }

  // 5. Draw phenotype-driven ambient particles
  if (phenotype && phenotype.ambientParticles > 0) {
    drawPhenotypeParticles(rc, width / 2, height * 0.45, phenotype);
  }
}
