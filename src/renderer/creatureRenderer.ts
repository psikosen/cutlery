import type {
  Creature, BodySlot, BodySlotEntry,
} from '../types';
import { DOMAIN_COLORS, EVOLUTION_CONFIGS } from '../types';
import {
  deserializeChromosome, extractPhenotype,
  type CreaturePhenotype,
} from '../services/evolution';

// ============================================================
// PROCEDURAL CREATURE RENDERER
// ============================================================

// Seeded random for deterministic rendering
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Body slot positions (normalized 0-1 space)
const SLOT_POSITIONS: Record<BodySlot, { x: number; y: number }> = {
  crown: { x: 0.5, y: 0.12 },
  left_horn: { x: 0.32, y: 0.08 },
  right_horn: { x: 0.68, y: 0.08 },
  left_shoulder: { x: 0.25, y: 0.28 },
  right_shoulder: { x: 0.75, y: 0.28 },
  chest: { x: 0.5, y: 0.35 },
  left_arm: { x: 0.15, y: 0.45 },
  right_arm: { x: 0.85, y: 0.45 },
  core: { x: 0.5, y: 0.52 },
  left_leg: { x: 0.35, y: 0.75 },
  right_leg: { x: 0.65, y: 0.75 },
  tail: { x: 0.5, y: 0.88 },
  left_wing: { x: 0.1, y: 0.3 },
  right_wing: { x: 0.9, y: 0.3 },
  aura: { x: 0.5, y: 0.5 },
};

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  time: number;
  creature: Creature;
  domainColor: string;
  rand: () => number;
  phenotype: CreaturePhenotype | null;
}

// ============================================================
// FALLBACK PATTERN: Glossy silver/black/gold randomized
// ============================================================

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function getGlossyColor(rand: () => number): string {
  const palette = [
    '#C0C0C0', '#D4D4D4', '#A8A8A8', // silver
    '#1a1a1a', '#2d2d2d', '#0d0d0d', // black
    '#FFD700', '#DAA520', '#B8860B', // gold
  ];
  return palette[Math.floor(rand() * palette.length)];
}

// ============================================================
// BASE BODY RENDERING
// ============================================================

function drawBaseBody(rc: RenderContext) {
  const { ctx, w, h, time, creature, domainColor, rand, phenotype } = rc;
  const config = EVOLUTION_CONFIGS[creature.evolution_stage];
  const cx = w / 2;
  const cy = h * 0.45;

  // Scale body based on evolution stage, modified by phenotype
  const radiusMult = phenotype ? phenotype.bodyRadiusMultiplier : 1;
  const baseRadius = w * (0.12 + creature.evolution_stage * 0.03) * radiusMult;
  const bodyPoints = phenotype ? phenotype.bodyPointCount : config.bodyPoints;

  // Draw ambient glow (enhanced by phenotype aura)
  if (config.ambientType !== 'none' || (phenotype && phenotype.auraRadius > 0.3)) {
    drawAmbient(rc, cx, cy, baseRadius);
  }

  // Draw main body mass — organic blob
  ctx.save();
  ctx.beginPath();

  const wobbleAmp = phenotype ? phenotype.bodyWobbleAmplitude : 0.08;
  const vStretch = phenotype ? phenotype.bodyVerticalStretch : 1.3;
  const asymmetry = phenotype ? phenotype.bodyWobbleAmplitude * 2 : 0;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < bodyPoints; i++) {
    const angle = (i / bodyPoints) * Math.PI * 2;
    const wobble = Math.sin(time * 2 + i * 0.7) * baseRadius * wobbleAmp;
    const verticalStretch = 1 + Math.sin(angle) * (vStretch - 1);
    const asymOffset = Math.sin(angle * 2 + i) * baseRadius * asymmetry;
    const r = (baseRadius + wobble + asymOffset) * (0.8 + rand() * 0.4) * verticalStretch;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.9,
    });
  }

  // Smooth curve through points
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const cpx = (curr.x + next.x) / 2;
    const cpy = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
  }
  ctx.closePath();

  // Glossy gradient fill — silver/black/gold
  const grad = ctx.createRadialGradient(
    cx - baseRadius * 0.3, cy - baseRadius * 0.3, baseRadius * 0.1,
    cx, cy, baseRadius * 1.5
  );
  const baseColor = getGlossyColor(rand);
  const [r, g, b] = hexToRgb(baseColor);
  grad.addColorStop(0, `rgba(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}, 0.95)`);
  grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.9)`);
  grad.addColorStop(1, `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.85)`);

  ctx.fillStyle = grad;
  ctx.fill();

  // Domain-colored edge glow
  ctx.strokeStyle = domainColor;
  ctx.lineWidth = 1.5 + creature.evolution_stage * 0.5;
  ctx.shadowColor = domainColor;
  ctx.shadowBlur = 8 + creature.evolution_stage * 4;
  ctx.stroke();
  ctx.restore();

  // Draw tentacles (use phenotype count if available)
  const tentacleCount = phenotype ? phenotype.tentacleCount : config.tentacles;
  drawTentacles(rc, cx, cy, baseRadius, tentacleCount);

  // Draw eyes (use phenotype count if available)
  const eyeCount = phenotype ? phenotype.eyeCount : config.eyes;
  drawEyes(rc, cx, cy, baseRadius, eyeCount);

  // Draw mouths
  if (config.mouths > 0) {
    drawMouths(rc, cx, cy, baseRadius, config.mouths);
  }
}

function drawAmbient(rc: RenderContext, cx: number, cy: number, radius: number) {
  const { ctx, time, creature, domainColor } = rc;
  const config = EVOLUTION_CONFIGS[creature.evolution_stage];

  ctx.save();
  switch (config.ambientType) {
    case 'faint_glow': {
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.5);
      grad.addColorStop(0, domainColor + '15');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rc.w, rc.h);
      break;
    }
    case 'particles': {
      for (let i = 0; i < 12; i++) {
        const angle = time * 0.5 + (i / 12) * Math.PI * 2;
        const dist = radius * 1.5 + Math.sin(time + i) * radius * 0.5;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = 1.5 + Math.sin(time * 2 + i) * 1;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = domainColor + '60';
        ctx.fill();
      }
      break;
    }
    case 'glow_drips': {
      // Glow
      const grad = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius * 3);
      grad.addColorStop(0, domainColor + '20');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rc.w, rc.h);
      // Drips
      for (let i = 0; i < 6; i++) {
        const dx = cx + (rc.rand() - 0.5) * radius * 2;
        const dripY = cy + radius + ((time * 30 + i * 40) % (radius * 2));
        ctx.beginPath();
        ctx.arc(dx, dripY, 2, 0, Math.PI * 2);
        ctx.fillStyle = domainColor + '40';
        ctx.fill();
      }
      break;
    }
    case 'aura_spines': {
      // Aura
      const grad2 = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 3.5);
      grad2.addColorStop(0, domainColor + '30');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, rc.w, rc.h);
      // Spines
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time * 0.2;
        const len = radius * (1.5 + Math.sin(time + i * 0.8) * 0.5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * radius * 0.8, cy + Math.sin(angle) * radius * 0.8);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.strokeStyle = domainColor + '50';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break;
    }
    case 'screen_bleed': {
      // Full edge glow
      const edgeSize = 20 + Math.sin(time) * 10;
      ctx.shadowColor = domainColor;
      ctx.shadowBlur = edgeSize;
      ctx.strokeStyle = domainColor + '30';
      ctx.lineWidth = edgeSize;
      ctx.strokeRect(-edgeSize / 2, -edgeSize / 2, rc.w + edgeSize, rc.h + edgeSize);
      ctx.shadowBlur = 0;
      // Inner aura
      const grad3 = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius * 4);
      grad3.addColorStop(0, domainColor + '35');
      grad3.addColorStop(1, 'transparent');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, rc.w, rc.h);
      break;
    }
  }
  ctx.restore();
}

function drawTentacles(rc: RenderContext, cx: number, cy: number, bodyRadius: number, count: number) {
  const { ctx, time, domainColor, rand } = rc;
  ctx.save();

  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2 + rand() * 0.5;
    const len = bodyRadius * (0.6 + rand() * 0.8);
    const segments = 6;

    ctx.beginPath();
    let px = cx + Math.cos(baseAngle) * bodyRadius * 0.7;
    let py = cy + Math.sin(baseAngle) * bodyRadius * 0.7;
    ctx.moveTo(px, py);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const wave = Math.sin(time * 3 + i * 2 + s * 0.8) * len * 0.15;
      px = cx + Math.cos(baseAngle) * (bodyRadius * 0.7 + len * t) + wave;
      py = cy + Math.sin(baseAngle) * (bodyRadius * 0.7 + len * t) + Math.cos(time * 2 + i) * len * 0.1;
      ctx.lineTo(px, py);
    }

    ctx.strokeStyle = domainColor + '70';
    ctx.lineWidth = 3 - (2 / segments) * count * 0.1;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyes(rc: RenderContext, cx: number, cy: number, bodyRadius: number, count: number) {
  const { ctx, time, domainColor, rand } = rc;

  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * Math.PI * 1.2 - Math.PI * 0.6;
    const dist = bodyRadius * (0.2 + rand() * 0.4);
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy - bodyRadius * 0.1 + Math.sin(angle) * dist * 0.4;
    const eyeSize = 3 + rand() * 3 + rc.creature.evolution_stage * 0.5;

    // Eye socket
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize + 1, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    // Iris
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2);
    const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeSize);
    irisGrad.addColorStop(0, domainColor);
    irisGrad.addColorStop(0.6, domainColor + '80');
    irisGrad.addColorStop(1, '#000');
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Pupil — tracks a wandering point
    const pupilAngle = time * 0.8 + i * 1.5;
    const pupilDrift = eyeSize * 0.25;
    const px = ex + Math.cos(pupilAngle) * pupilDrift;
    const py = ey + Math.sin(pupilAngle * 0.7) * pupilDrift;
    ctx.beginPath();
    ctx.arc(px, py, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(ex - eyeSize * 0.2, ey - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    // Glow
    ctx.shadowColor = domainColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'transparent';
    ctx.fill();
    ctx.restore();
  }
}

function drawMouths(rc: RenderContext, cx: number, cy: number, bodyRadius: number, count: number) {
  const { ctx, time, domainColor, rand } = rc;

  for (let i = 0; i < count; i++) {
    const mx = cx + (rand() - 0.5) * bodyRadius * 0.6;
    const my = cy + bodyRadius * (0.15 + i * 0.2);
    const mWidth = bodyRadius * (0.3 + rand() * 0.2);
    const openAmount = Math.abs(Math.sin(time * 1.5 + i * 2)) * 0.4 + 0.1;

    ctx.save();
    // Mouth opening
    ctx.beginPath();
    ctx.ellipse(mx, my, mWidth * 0.5, mWidth * openAmount * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0000';
    ctx.fill();

    // Teeth
    const teethCount = 4 + Math.floor(rand() * 4);
    for (let t = 0; t < teethCount; t++) {
      const tAngle = (t / teethCount) * Math.PI;
      const tx = mx + Math.cos(tAngle) * mWidth * 0.4;
      const ty = my - mWidth * openAmount * 0.2;
      const toothLen = mWidth * 0.08 + rand() * mWidth * 0.05;

      ctx.beginPath();
      ctx.moveTo(tx - 1, ty);
      ctx.lineTo(tx, ty + toothLen);
      ctx.lineTo(tx + 1, ty);
      ctx.fillStyle = '#d4d4d4';
      ctx.fill();
    }

    // Bottom teeth
    for (let t = 0; t < teethCount - 1; t++) {
      const tAngle = (t / (teethCount - 1)) * Math.PI;
      const tx = mx + Math.cos(tAngle) * mWidth * 0.35;
      const ty = my + mWidth * openAmount * 0.2;
      const toothLen = mWidth * 0.06 + rand() * mWidth * 0.04;

      ctx.beginPath();
      ctx.moveTo(tx - 1, ty);
      ctx.lineTo(tx, ty - toothLen);
      ctx.lineTo(tx + 1, ty);
      ctx.fillStyle = '#c0c0c0';
      ctx.fill();
    }

    // Glow inside mouth
    const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mWidth * 0.3);
    mGrad.addColorStop(0, domainColor + '30');
    mGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.ellipse(mx, my, mWidth * 0.3, mWidth * openAmount * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// GENE MUTATION RENDERERS
// ============================================================

function renderGeneMutation(rc: RenderContext, slot: BodySlot, entry: BodySlotEntry, index: number) {
  const { ctx, w, h, time, domainColor } = rc;
  const pos = SLOT_POSITIONS[slot];
  const x = pos.x * w;
  const y = pos.y * h;
  const tierScale = entry.tier === 'titan' ? 2.5 : entry.tier === 'hyper' ? 1.8 : entry.tier === 'dense' ? 1.3 : 1;
  const rand = seededRandom(entry.visual_seed);
  const offset = index * 4;

  switch (entry.gene_type) {
    case 'muscle_fiber': drawMuscleFiber(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'bone_plate': drawBonePlate(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'vein_network': drawVeinNetwork(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'tendon_whip': drawTendonWhip(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'organ_sac': drawOrganSac(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'tooth_row': drawToothRow(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'eye_cluster': drawEyeCluster(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'neural_tendril': drawNeuralTendril(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'skull_graft': drawSkullGraft(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'synapse_arc': drawSynapseArc(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'memory_sac': drawMemorySac(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'psychic_crown': drawPsychicCrown(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'chain_link': drawChainLink(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'iron_plate': drawIronPlate(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'lock_core': drawLockCore(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'ember_node': drawEmberNode(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'spectral_layer': drawSpectralLayer(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'wardens_eye': drawWardensEye(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'gear_assembly': drawGearAssembly(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'cable_nerve': drawCableNerve(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'piston_limb': drawPistonLimb(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'furnace_core': drawFurnaceCore(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'blueprint_glyph': drawBlueprintGlyph(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'exhaust_vent': drawExhaustVent(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'gold_scale': drawGoldScale(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'coin_disc': drawCoinDisc(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'vault_door': drawVaultDoor(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'investment_tendril': drawInvestmentTendril(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'ledger_glyph': drawLedgerGlyph(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'crown_jewel': drawCrownJewel(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'mouth': drawMouthMutation(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'face_mask': drawFaceMask(ctx, x + offset, y + offset, tierScale, time, rand); break;
    case 'vocal_cord': drawVocalCord(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'echo_chamber': drawEchoChamber(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'harmony_thread': drawHarmonyThread(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'memory_face': drawMemoryFace(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    // --- New Organs & Appendages ---
    case 'lung_bellows': drawLungBellows(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'heart_pump': drawHeartPump(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'claw_hook': drawClawHook(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'cerebral_lobe': drawCerebralLobe(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'psionic_node': drawPsionicNode(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'temporal_gland': drawTemporalGland(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'logic_matrix': drawLogicMatrix(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'astral_fiber': drawAstralFiber(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'insight_lens': drawInsightLens(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'iron_spine': drawIronSpine(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'will_node': drawWillNode(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'turbine_arm': drawTurbineArm(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'crane_claw': drawCraneClaw(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'gilded_claw': drawGildedClaw(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'treasure_organ': drawTreasureOrgan(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'empathy_lobe': drawEmpathyLobe(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
    case 'resonance_horn': drawResonanceHorn(ctx, x + offset, y + offset, tierScale, time, domainColor, rand); break;
  }
}

// --- Individual Gene Drawing Functions ---

function drawMuscleFiber(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 4) * scale;
  const pulse = 1 + Math.sin(time * 3 + rand() * 6) * 0.15;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size * pulse, size * 0.6 * pulse, rand() * Math.PI, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#cc3333');
  g.addColorStop(0.7, '#881111');
  g.addColorStop(1, '#440808');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawBonePlate(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (7 + rand() * 3) * scale;
  ctx.save();
  ctx.beginPath();
  const points = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = size * (0.8 + rand() * 0.4);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  g.addColorStop(0, '#e8e0d0');
  g.addColorStop(0.5, '#c8b8a0');
  g.addColorStop(1, '#a89878');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Crack lines
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size * (rand() - 0.5), y + size * (rand() - 0.5));
  ctx.strokeStyle = '#6a5a40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawVeinNetwork(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  ctx.save();
  const branches = 3 + Math.floor(rand() * 3);
  for (let b = 0; b < branches; b++) {
    const angle = rand() * Math.PI * 2;
    const len = (12 + rand() * 10) * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x, py = y;
    for (let s = 0; s < 4; s++) {
      px += Math.cos(angle + rand() * 0.5) * len * 0.25;
      py += Math.sin(angle + rand() * 0.5) * len * 0.25;
      ctx.lineTo(px, py);
    }
    const pulse = 0.6 + Math.sin(time * 4 + b * 2) * 0.4;
    ctx.strokeStyle = `rgba(200, 30, 30, ${pulse})`;
    ctx.lineWidth = (2 - b * 0.3) * scale;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawTendonWhip(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (15 + rand() * 10) * scale;
  const angle = rand() * Math.PI * 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let s = 1; s <= 6; s++) {
    const t = s / 6;
    const wave = Math.sin(time * 4 + s * 1.5) * len * 0.12;
    ctx.lineTo(
      x + Math.cos(angle) * len * t + wave,
      y + Math.sin(angle) * len * t
    );
  }
  ctx.strokeStyle = '#cc9966';
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawOrganSac(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const pulse = 1 + Math.sin(time * 2 + rand() * 5) * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 0, x, y, size);
  g.addColorStop(0, color + '80');
  g.addColorStop(0.7, color + '40');
  g.addColorStop(1, '#1a0a1a80');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawToothRow(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const count = 3 + Math.floor(rand() * 4);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const tx = x + (i - count / 2) * 4 * scale;
    const len = (4 + rand() * 4) * scale;
    ctx.beginPath();
    ctx.moveTo(tx - 1.5 * scale, y);
    ctx.lineTo(tx, y + len);
    ctx.lineTo(tx + 1.5 * scale, y);
    ctx.closePath();
    ctx.fillStyle = '#e8e0d0';
    ctx.fill();
    ctx.strokeStyle = '#c8b090';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyeCluster(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const count = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < count; i++) {
    const ex = x + (rand() - 0.5) * 8 * scale;
    const ey = y + (rand() - 0.5) * 6 * scale;
    const size = (2 + rand() * 2) * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, size, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    const pa = time + i;
    ctx.beginPath();
    ctx.arc(ex + Math.cos(pa) * size * 0.2, ey + Math.sin(pa) * size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - size * 0.2, ey - size * 0.2, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    ctx.restore();
  }
}

function drawNeuralTendril(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (10 + rand() * 8) * scale;
  const angle = rand() * Math.PI * 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let s = 1; s <= 5; s++) {
    const t = s / 5;
    ctx.lineTo(
      x + Math.cos(angle + Math.sin(time * 3 + s) * 0.3) * len * t,
      y + Math.sin(angle + Math.cos(time * 2 + s) * 0.3) * len * t
    );
  }
  const glow = 0.4 + Math.sin(time * 5 + rand() * 6) * 0.3;
  ctx.strokeStyle = color + Math.floor(glow * 255).toString(16).padStart(2, '0');
  ctx.lineWidth = 1.5 * scale;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.stroke();
  ctx.restore();
}

function drawSkullGraft(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Skull shape
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = '#d0c8b8';
  ctx.fill();
  // Jaw
  ctx.beginPath();
  ctx.arc(x, y + size * 0.5, size * 0.7, 0, Math.PI);
  ctx.fillStyle = '#c0b8a0';
  ctx.fill();
  // Eye sockets
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.restore();
}

function drawSynapseArc(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  ctx.save();
  const len = (8 + rand() * 6) * scale;
  const angle = rand() * Math.PI * 2;
  const ex = x + Math.cos(angle) * len;
  const ey = y + Math.sin(angle) * len;
  const flicker = Math.random() > 0.3;
  if (flicker) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const midX = (x + ex) / 2 + (rand() - 0.5) * 10;
    const midY = (y + ey) / 2 + (rand() - 0.5) * 10;
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 * scale;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMemorySac(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawOrganSac(ctx, x, y, scale, time, color, rand);
}

function drawPsychicCrown(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 4) * scale;
  const float = Math.sin(time * 2) * 3;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r = size * (i % 2 === 0 ? 1 : 0.6);
    const px = x + Math.cos(angle) * r;
    const py = y + float + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color + '40';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawChainLink(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (4 + rand() * 2) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 1.5, rand() * Math.PI, 0, Math.PI * 2);
  ctx.strokeStyle = '#8899aa';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  // Inner glow
  ctx.strokeStyle = color + '30';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawIronPlate(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (6 + rand() * 4) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size / 2, y - size / 2, size, size * 0.8);
  const g = ctx.createLinearGradient(x - size / 2, y, x + size / 2, y);
  g.addColorStop(0, '#667788');
  g.addColorStop(0.5, '#8899aa');
  g.addColorStop(1, '#556677');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Bolts
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.25, 1.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.25, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#334455';
  ctx.fill();
  ctx.restore();
}

function drawLockCore(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Lock body
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = '#556677';
  ctx.fill();
  // Keyhole
  ctx.beginPath();
  ctx.arc(x, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = color + '80';
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x - size * 0.08, y - size * 0.1, size * 0.16, size * 0.35);
  ctx.fillStyle = color + '80';
  ctx.fill();
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEmberNode(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (3 + rand() * 2) * scale;
  const pulse = 0.5 + Math.sin(time * 4 + rand() * 6) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#ffaa33');
  g.addColorStop(0.5, '#ff6600');
  g.addColorStop(1, `rgba(255, 50, 0, ${pulse})`);
  ctx.fillStyle = g;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 8 * pulse;
  ctx.fill();
  ctx.restore();
}

function drawSpectralLayer(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (10 + rand() * 5) * scale;
  const alpha = 0.1 + Math.sin(time * 1.5 + rand() * 5) * 0.05;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
  ctx.fill();
  ctx.restore();
}

function drawWardensEye(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawEyeCluster(ctx, x, y, scale * 0.8, time, color, rand);
}

function drawGearAssembly(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const teeth = 6 + Math.floor(rand() * 4);
  const rotation = time * 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? size : size * 0.7;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#778899';
  ctx.fill();
  ctx.strokeStyle = '#556677';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Center hole
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  ctx.restore();
}

function drawCableNerve(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawNeuralTendril(ctx, x, y, scale, time, '#44dd44', rand);
}

function drawPistonLimb(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (8 + rand() * 4) * scale;
  const extension = Math.sin(time * 3 + rand() * 5) * size * 0.2;
  ctx.save();
  // Cylinder
  ctx.beginPath();
  ctx.rect(x - 3 * scale, y, 6 * scale, size * 0.6 + extension);
  ctx.fillStyle = '#889999';
  ctx.fill();
  ctx.strokeStyle = '#667777';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Piston head
  ctx.beginPath();
  ctx.rect(x - 4 * scale, y + size * 0.6 + extension, 8 * scale, 4 * scale);
  ctx.fillStyle = '#aabbbb';
  ctx.fill();
  ctx.restore();
}

function drawFurnaceCore(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  const pulse = 0.5 + Math.sin(time * 3) * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#ffdd44');
  g.addColorStop(0.5, '#ff6600');
  g.addColorStop(1, '#441100');
  ctx.fillStyle = g;
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 12 * pulse;
  ctx.fill();
  ctx.restore();
}

function drawBlueprintGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  ctx.save();
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 0.8 * scale;
  // Draw tech lines
  ctx.beginPath();
  ctx.rect(x - size / 2, y - size / 2, size, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.stroke();
  // Small circle nodes
  ctx.beginPath();
  ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawExhaustVent(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Vent grills
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.rect(x - size / 2, y + i * 3 * scale, size, 1.5 * scale);
    ctx.fillStyle = '#556666';
    ctx.fill();
  }
  // Steam
  if (Math.sin(time * 2 + rand() * 5) > 0) {
    for (let p = 0; p < 3; p++) {
      const py = y - (time * 15 + p * 8) % 20;
      const px = x + Math.sin(time + p) * 3;
      ctx.beginPath();
      ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,200,200,0.2)';
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGoldScale(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.6, rand() * 0.5, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(x - size, y, x + size, y);
  g.addColorStop(0, '#DAA520');
  g.addColorStop(0.3, '#FFD700');
  g.addColorStop(0.5, '#FFF8DC');
  g.addColorStop(0.7, '#FFD700');
  g.addColorStop(1, '#B8860B');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawCoinDisc(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (4 + rand() * 2) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
  g.addColorStop(0, '#FFD700');
  g.addColorStop(1, '#B8860B');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Coin detail
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = '#DAA52060';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawVaultDoor(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  drawIronPlate(ctx, x, y, scale * 1.2, time, rand);
}

function drawInvestmentTendril(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawTendonWhip(ctx, x, y, scale, time, '#FFD700', rand);
}

function drawLedgerGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawBlueprintGlyph(ctx, x, y, scale, time, '#FFD700', rand);
}

function drawCrownJewel(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (4 + rand() * 3) * scale;
  const pulse = 0.8 + Math.sin(time * 2) * 0.2;
  ctx.save();
  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y);
  ctx.lineTo(x, y + size * 0.4);
  ctx.lineTo(x - size * 0.6, y);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  g.addColorStop(0, '#FF69B4');
  g.addColorStop(0.5, '#FF1493');
  g.addColorStop(1, '#C71585');
  ctx.fillStyle = g;
  ctx.shadowColor = '#FF69B4';
  ctx.shadowBlur = 8 * pulse;
  ctx.fill();
  ctx.restore();
}

function drawMouthMutation(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const open = Math.abs(Math.sin(time * 1.5 + rand() * 5)) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * open * 0.4 + 1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a0000';
  ctx.fill();
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawFaceMask(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.7, size, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d0c8b8' + '80';
  ctx.fill();
  // Eyes
  ctx.beginPath();
  ctx.ellipse(x - size * 0.25, y - size * 0.15, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.25, y - size * 0.15, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  // Mouth
  ctx.beginPath();
  ctx.arc(x, y + size * 0.2, size * 0.2, 0, Math.PI);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawVocalCord(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (10 + rand() * 8) * scale;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const vibrate = Math.sin(time * 8 + i * 2) * 3 * scale;
    ctx.lineTo(x + vibrate, y + len * t);
  }
  ctx.strokeStyle = color + '60';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.restore();
}

function drawEchoChamber(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  for (let r = 0; r < 3; r++) {
    const radius = size * (0.5 + r * 0.4);
    const alpha = 0.3 - r * 0.08;
    ctx.beginPath();
    ctx.arc(x, y, radius + Math.sin(time * 2 + r) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHarmonyThread(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawNeuralTendril(ctx, x, y, scale, time, color, rand);
}

function drawMemoryFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  drawFaceMask(ctx, x, y, scale * 0.8, time, rand);
}

// ============================================================
// NEW ORGAN & APPENDAGE DRAWING FUNCTIONS
// ============================================================

// --- Health Organs & Appendages ---

function drawLungBellows(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  const inflate = 1 + Math.sin(time * 1.8 + rand() * 5) * 0.25;
  ctx.save();
  // Left lobe
  ctx.beginPath();
  ctx.ellipse(x - size * 0.3, y, size * 0.5 * inflate, size * 0.7 * inflate, -0.15, 0, Math.PI * 2);
  const lg = ctx.createRadialGradient(x - size * 0.3, y, 0, x - size * 0.3, y, size * 0.6);
  lg.addColorStop(0, '#cc6688');
  lg.addColorStop(0.6, '#994466');
  lg.addColorStop(1, '#662244');
  ctx.fillStyle = lg;
  ctx.fill();
  // Right lobe
  ctx.beginPath();
  ctx.ellipse(x + size * 0.3, y, size * 0.5 * inflate, size * 0.7 * inflate, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = lg;
  ctx.fill();
  // Bronchial tube
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.5);
  ctx.lineTo(x, y + size * 0.3);
  ctx.strokeStyle = '#aa5577';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.strokeStyle = color + '30';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(x - size * 0.3, y, size * 0.5 * inflate, size * 0.7 * inflate, -0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + size * 0.3, y, size * 0.5 * inflate, size * 0.7 * inflate, 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHeartPump(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const beat = 1 + Math.abs(Math.sin(time * 3.5 + rand() * 4)) * 0.2;
  ctx.save();
  // Heart shape via two arcs
  const s = size * beat;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.6);
  ctx.bezierCurveTo(x - s * 0.8, y - s * 0.1, x - s * 0.5, y - s * 0.7, x, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.7, x + s * 0.8, y - s * 0.1, x, y + s * 0.6);
  ctx.closePath();
  const g = ctx.createRadialGradient(x, y - s * 0.1, 0, x, y, s);
  g.addColorStop(0, '#dd2244');
  g.addColorStop(0.5, '#aa1133');
  g.addColorStop(1, '#660011');
  ctx.fillStyle = g;
  ctx.shadowColor = '#dd2244';
  ctx.shadowBlur = 6 * beat;
  ctx.fill();
  // Arteries
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.3);
  ctx.lineTo(x - s * 0.2, y - s * 0.7);
  ctx.moveTo(x, y - s * 0.3);
  ctx.lineTo(x + s * 0.15, y - s * 0.65);
  ctx.strokeStyle = '#cc3355';
  ctx.lineWidth = 1.2 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawClawHook(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (7 + rand() * 4) * scale;
  const grip = Math.sin(time * 2 + rand() * 5) * 0.15;
  ctx.save();
  // Three curved claws
  for (let i = -1; i <= 1; i++) {
    const angle = (i * 0.35) + grip;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const cx1 = x + Math.cos(angle - 0.3) * size * 0.4;
    const cy1 = y + Math.sin(angle - 0.3) * size * 0.4;
    const ex = x + Math.cos(angle) * size;
    const ey = y + Math.sin(angle) * size;
    ctx.quadraticCurveTo(cx1, cy1, ex, ey);
    const g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, '#e0d0c0');
    g.addColorStop(0.6, '#c0a888');
    g.addColorStop(1, '#8a6a48');
    ctx.strokeStyle = g;
    ctx.lineWidth = (2.5 - Math.abs(i) * 0.5) * scale;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // Joint knuckle
  ctx.beginPath();
  ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#b09878';
  ctx.fill();
  ctx.restore();
}

// --- Mind Brain Power Genes ---

function drawCerebralLobe(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (7 + rand() * 4) * scale;
  const pulse = 1 + Math.sin(time * 1.5 + rand() * 4) * 0.08;
  ctx.save();
  // Brain-like lobed shape
  ctx.beginPath();
  // Left hemisphere
  ctx.arc(x - size * 0.25, y, size * 0.55 * pulse, Math.PI * 0.5, Math.PI * 1.5);
  // Right hemisphere
  ctx.arc(x + size * 0.25, y, size * 0.55 * pulse, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  const g = ctx.createRadialGradient(x, y, 0, x, y, size * 0.6);
  g.addColorStop(0, color + 'cc');
  g.addColorStop(0.5, '#cc88dd');
  g.addColorStop(1, '#664477');
  ctx.fillStyle = g;
  ctx.fill();
  // Sulci (folds)
  ctx.strokeStyle = '#553366' + '80';
  ctx.lineWidth = 0.6 * scale;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const sy = y - size * 0.3 + i * size * 0.2;
    ctx.moveTo(x - size * 0.35, sy);
    ctx.quadraticCurveTo(x, sy + (rand() - 0.5) * size * 0.2, x + size * 0.35, sy);
    ctx.stroke();
  }
  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = color + '40';
  ctx.fill();
  ctx.restore();
}

function drawPsionicNode(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const pulse = 0.6 + Math.sin(time * 4 + rand() * 6) * 0.4;
  ctx.save();
  // Core crystal
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.4, y);
  ctx.lineTo(x, y + size * 0.5);
  ctx.lineTo(x - size * 0.4, y);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y - size, x, y + size * 0.5);
  g.addColorStop(0, '#dd99ff');
  g.addColorStop(0.5, color);
  g.addColorStop(1, '#6622aa');
  ctx.fillStyle = g;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 * pulse;
  ctx.fill();
  // Psionic waves
  for (let r = 0; r < 3; r++) {
    const waveR = size * (1.2 + r * 0.5) + Math.sin(time * 3 + r * 2) * 3;
    ctx.beginPath();
    ctx.arc(x, y, waveR, 0, Math.PI * 2);
    ctx.strokeStyle = color + Math.floor((0.15 - r * 0.04) * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawTemporalGland(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  ctx.save();
  // Hourglass-shaped gland
  ctx.beginPath();
  ctx.moveTo(x - size * 0.4, y - size * 0.6);
  ctx.quadraticCurveTo(x, y, x + size * 0.4, y - size * 0.6);
  ctx.moveTo(x + size * 0.4, y + size * 0.6);
  ctx.quadraticCurveTo(x, y, x - size * 0.4, y + size * 0.6);
  ctx.strokeStyle = color + '80';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  // Temporal particles flowing
  const flow = (time * 40) % (size * 1.2);
  for (let p = 0; p < 4; p++) {
    const py = y - size * 0.6 + ((flow + p * size * 0.3) % (size * 1.2));
    const squeeze = 1 - Math.abs((py - y) / (size * 0.6));
    const px = x + (rand() - 0.5) * size * 0.3 * squeeze;
    ctx.beginPath();
    ctx.arc(px, py, 1.2 * scale, 0, Math.PI * 2);
    ctx.fillStyle = color + '90';
    ctx.fill();
  }
  // Gland body
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.15, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fillStyle = color + '60';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}

function drawLogicMatrix(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  ctx.save();
  ctx.strokeStyle = color + '70';
  ctx.lineWidth = 0.8 * scale;
  // Grid of logic nodes
  const cols = 3;
  const rows = 3;
  const spacing = size * 0.5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = x + (c - 1) * spacing;
      const ny = y + (r - 1) * spacing;
      // Node
      ctx.beginPath();
      ctx.arc(nx, ny, 1.5 * scale, 0, Math.PI * 2);
      const active = Math.sin(time * 3 + r * 2.3 + c * 1.7) > 0;
      ctx.fillStyle = active ? color : color + '30';
      ctx.fill();
      // Connections (right and down)
      if (c < cols - 1) {
        const signal = Math.sin(time * 5 + r + c * 1.5) > 0.2;
        ctx.beginPath();
        ctx.moveTo(nx + 1.5 * scale, ny);
        ctx.lineTo(nx + spacing - 1.5 * scale, ny);
        ctx.strokeStyle = signal ? color + 'aa' : color + '20';
        ctx.stroke();
      }
      if (r < rows - 1) {
        const signal = Math.sin(time * 5 + r * 1.5 + c) > 0.2;
        ctx.beginPath();
        ctx.moveTo(nx, ny + 1.5 * scale);
        ctx.lineTo(nx, ny + spacing - 1.5 * scale);
        ctx.strokeStyle = signal ? color + 'aa' : color + '20';
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawAstralFiber(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (12 + rand() * 8) * scale;
  ctx.save();
  // Multiple ghostly fibers radiating outward
  for (let f = 0; f < 4; f++) {
    const angle = rand() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x, py = y;
    for (let s = 1; s <= 6; s++) {
      const t = s / 6;
      const wave = Math.sin(time * 2 + f * 1.7 + s * 0.8) * len * 0.08;
      px = x + Math.cos(angle + wave * 0.05) * len * t + wave;
      py = y + Math.sin(angle + wave * 0.05) * len * t;
      ctx.lineTo(px, py);
    }
    const alpha = 0.2 + Math.sin(time * 1.5 + f * 2) * 0.15;
    ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = (1.5 - f * 0.2) * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.stroke();
  }
  // Center star
  ctx.beginPath();
  ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color + '50';
  ctx.fill();
  ctx.restore();
}

function drawInsightLens(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const focus = 0.8 + Math.sin(time * 2 + rand() * 4) * 0.2;
  ctx.save();
  // Outer lens ring
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.strokeStyle = color + '80';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  // Inner lens
  ctx.beginPath();
  ctx.arc(x, y, size * 0.65 * focus, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size * 0.65);
  g.addColorStop(0, '#ffffff40');
  g.addColorStop(0.4, color + '60');
  g.addColorStop(1, color + '10');
  ctx.fillStyle = g;
  ctx.fill();
  // Crosshair
  ctx.beginPath();
  ctx.moveTo(x - size * 0.8, y);
  ctx.lineTo(x - size * 0.3, y);
  ctx.moveTo(x + size * 0.3, y);
  ctx.lineTo(x + size * 0.8, y);
  ctx.moveTo(x, y - size * 0.8);
  ctx.lineTo(x, y - size * 0.3);
  ctx.moveTo(x, y + size * 0.3);
  ctx.lineTo(x, y + size * 0.8);
  ctx.strokeStyle = color + '50';
  ctx.lineWidth = 0.5 * scale;
  ctx.stroke();
  // Focus dot
  ctx.beginPath();
  ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}

// --- Discipline Organs & Appendages ---

function drawIronSpine(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const len = (10 + rand() * 5) * scale;
  const segments = 5 + Math.floor(rand() * 3);
  ctx.save();
  // Vertebral column
  for (let i = 0; i < segments; i++) {
    const sy = y - len * 0.5 + (i / (segments - 1)) * len;
    const wobble = Math.sin(time * 1.2 + i * 0.8) * 1.5;
    const segSize = (3 + rand() * 2) * scale;
    // Vertebra
    ctx.beginPath();
    ctx.ellipse(x + wobble, sy, segSize, segSize * 0.6, 0, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(x - segSize, sy, x + segSize, sy);
    g.addColorStop(0, '#778899');
    g.addColorStop(0.5, '#aabbcc');
    g.addColorStop(1, '#667788');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Connecting rod
    if (i < segments - 1) {
      const ny = y - len * 0.5 + ((i + 1) / (segments - 1)) * len;
      ctx.beginPath();
      ctx.moveTo(x + wobble, sy + segSize * 0.5);
      ctx.lineTo(x + Math.sin(time * 1.2 + (i + 1) * 0.8) * 1.5, ny - segSize * 0.5);
      ctx.strokeStyle = '#8899aa';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawWillNode(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (5 + rand() * 3) * scale;
  const intensity = 0.5 + Math.sin(time * 2.5 + rand() * 5) * 0.3;
  ctx.save();
  // Core sphere
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, '#ffffff' + Math.floor(intensity * 200).toString(16).padStart(2, '0'));
  g.addColorStop(0.4, color + 'aa');
  g.addColorStop(1, color + '20');
  ctx.fillStyle = g;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 * intensity;
  ctx.fill();
  // Inner rune
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.5);
  ctx.lineTo(x + size * 0.4, y + size * 0.3);
  ctx.lineTo(x - size * 0.4, y + size * 0.3);
  ctx.closePath();
  ctx.strokeStyle = '#ffffff60';
  ctx.lineWidth = 0.8 * scale;
  ctx.stroke();
  ctx.restore();
}

// --- Career Mechanical Appendages ---

function drawTurbineArm(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (7 + rand() * 4) * scale;
  const spin = time * 3;
  ctx.save();
  // Arm shaft
  const armLen = size * 1.2;
  const angle = rand() * Math.PI * 2;
  const ex = x + Math.cos(angle) * armLen;
  const ey = y + Math.sin(angle) * armLen;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = '#8899aa';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Joint
  ctx.beginPath();
  ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#667788';
  ctx.fill();
  // Turbine blades at end
  ctx.translate(ex, ey);
  ctx.rotate(spin);
  const blades = 4;
  for (let i = 0; i < blades; i++) {
    const bAngle = (i / blades) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(bAngle) * size * 0.5, Math.sin(bAngle) * size * 0.5);
    ctx.strokeStyle = color + '80';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
  }
  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#aabbcc';
  ctx.fill();
  ctx.restore();
}

function drawCraneClaw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  const clamp = Math.sin(time * 2 + rand() * 5) * 0.2;
  ctx.save();
  // Arm
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.8);
  ctx.lineTo(x, y);
  ctx.strokeStyle = '#889999';
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Two opposing jaws
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const jawAngle = side * (0.4 + clamp);
    ctx.quadraticCurveTo(
      x + side * size * 0.3, y + size * 0.3,
      x + Math.sin(jawAngle) * size * 0.5, y + size * 0.7
    );
    ctx.strokeStyle = '#aabbbb';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    // Claw tip
    ctx.beginPath();
    ctx.arc(x + Math.sin(jawAngle) * size * 0.5, y + size * 0.7, 1.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = color + '80';
    ctx.fill();
  }
  // Pivot joint
  ctx.beginPath();
  ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#778888';
  ctx.fill();
  ctx.restore();
}

// --- Finance Organs & Appendages ---

function drawGildedClaw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (7 + rand() * 4) * scale;
  const grip = Math.sin(time * 1.8 + rand() * 5) * 0.12;
  ctx.save();
  // Three golden talons
  for (let i = -1; i <= 1; i++) {
    const angle = (i * 0.3) + grip + Math.PI * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const cx1 = x + Math.cos(angle - 0.2) * size * 0.4;
    const cy1 = y + Math.sin(angle - 0.2) * size * 0.4;
    const ex = x + Math.cos(angle) * size;
    const ey = y + Math.sin(angle) * size;
    ctx.quadraticCurveTo(cx1, cy1, ex, ey);
    const g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, '#FFD700');
    g.addColorStop(0.5, '#DAA520');
    g.addColorStop(1, '#B8860B');
    ctx.strokeStyle = g;
    ctx.lineWidth = (2.5 - Math.abs(i) * 0.5) * scale;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // Knuckle jewel
  ctx.beginPath();
  ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 4;
  ctx.fill();
  ctx.restore();
}

function drawTreasureOrgan(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  const pulse = 1 + Math.sin(time * 1.5 + rand() * 4) * 0.15;
  ctx.save();
  // Ornate sac
  ctx.beginPath();
  ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 0, x, y, size);
  g.addColorStop(0, '#FFF8DC');
  g.addColorStop(0.3, '#FFD700');
  g.addColorStop(0.7, '#DAA520');
  g.addColorStop(1, '#8B6914');
  ctx.fillStyle = g;
  ctx.fill();
  // Decorative ring
  ctx.beginPath();
  ctx.arc(x, y, size * pulse * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = '#B8860B80';
  ctx.lineWidth = 0.8 * scale;
  ctx.stroke();
  // Inner sparkle
  const sparkAngle = time * 2;
  ctx.beginPath();
  ctx.arc(x + Math.cos(sparkAngle) * size * 0.2, y + Math.sin(sparkAngle) * size * 0.2, 1.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff80';
  ctx.fill();
  ctx.restore();
}

// --- Social Organs & Appendages ---

function drawEmpathyLobe(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (6 + rand() * 3) * scale;
  const pulse = 1 + Math.sin(time * 1.2 + rand() * 4) * 0.1;
  ctx.save();
  // Soft organic lobe
  ctx.beginPath();
  // Two connected lobes
  ctx.arc(x - size * 0.2, y, size * 0.45 * pulse, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5);
  g.addColorStop(0, color + 'cc');
  g.addColorStop(0.5, color + '80');
  g.addColorStop(1, color + '20');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + size * 0.2, y, size * 0.45 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  // Empathic waves
  for (let w = 0; w < 2; w++) {
    const waveR = size * (0.8 + w * 0.4) + Math.sin(time * 2 + w * 1.5) * 2;
    ctx.beginPath();
    ctx.arc(x, y, waveR, 0, Math.PI * 2);
    ctx.strokeStyle = color + Math.floor((0.2 - w * 0.06) * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

function drawResonanceHorn(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, color: string, rand: () => number) {
  const size = (8 + rand() * 4) * scale;
  const angle = -Math.PI * 0.5 + (rand() - 0.5) * 0.4;
  ctx.save();
  // Curved horn shape
  ctx.beginPath();
  const baseWidth = 3 * scale;
  const tipWidth = 0.5 * scale;
  const segments = 8;
  const curve = 0.3 + rand() * 0.3;
  // Right edge
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w = baseWidth * (1 - t) + tipWidth * t;
    const cx = x + Math.cos(angle + curve * t) * size * t;
    const cy = y + Math.sin(angle + curve * t) * size * t;
    const perpAngle = angle + curve * t + Math.PI * 0.5;
    const px = cx + Math.cos(perpAngle) * w;
    const py = cy + Math.sin(perpAngle) * w;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  // Left edge (reverse)
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const w = baseWidth * (1 - t) + tipWidth * t;
    const cx = x + Math.cos(angle + curve * t) * size * t;
    const cy = y + Math.sin(angle + curve * t) * size * t;
    const perpAngle = angle + curve * t - Math.PI * 0.5;
    const px = cx + Math.cos(perpAngle) * w;
    const py = cy + Math.sin(perpAngle) * w;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y, x + Math.cos(angle) * size, y + Math.sin(angle) * size);
  g.addColorStop(0, color + 'cc');
  g.addColorStop(0.6, color + '80');
  g.addColorStop(1, color + '40');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = color + '40';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Sound waves from tip
  const tipX = x + Math.cos(angle + curve) * size;
  const tipY = y + Math.sin(angle + curve) * size;
  for (let w = 0; w < 3; w++) {
    const waveR = (3 + w * 3) * scale + Math.sin(time * 4 + w) * 2;
    ctx.beginPath();
    ctx.arc(tipX, tipY, waveR, angle - 0.5, angle + 0.5);
    ctx.strokeStyle = color + Math.floor((0.3 - w * 0.08) * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

export function renderCreature(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  width: number,
  height: number,
  time: number,
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
  ctx.clearRect(0, 0, width, height);

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

// ============================================================
// PHENOTYPE-DRIVEN RENDERING
// ============================================================

function drawDistortionField(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, time } = rc;
  const strength = pheno.distortion;
  const radius = rc.w * 0.3;

  ctx.save();
  for (let i = 0; i < 3; i++) {
    const r = radius * (1.2 + i * 0.3);
    const wobble = Math.sin(time * 0.8 + i * 2.1) * strength * 15;
    ctx.beginPath();
    ctx.arc(cx + wobble, cy + wobble * 0.5, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.02 * strength})`;
    ctx.lineWidth = 2 + i;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhenotypeSpines(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, time, domainColor, creature } = rc;
  const baseRadius = rc.w * (0.12 + creature.evolution_stage * 0.03);
  const spineCount = pheno.spines;
  const spineScale = pheno.spineScale;
  const rand = seededRandom(creature.appearance_seed + 7777);

  ctx.save();
  for (let i = 0; i < spineCount; i++) {
    const angle = (i / spineCount) * Math.PI * 2 + rand() * 0.3;
    const len = baseRadius * (0.3 + spineScale * 0.7) + Math.sin(time * 1.5 + i) * 3;
    const startR = baseRadius * 0.85;

    const sx = cx + Math.cos(angle) * startR;
    const sy = cy + Math.sin(angle) * startR;
    const ex = cx + Math.cos(angle) * (startR + len);
    const ey = cy + Math.sin(angle) * (startR + len);

    ctx.beginPath();
    ctx.moveTo(sx - Math.sin(angle) * 2, sy + Math.cos(angle) * 2);
    ctx.lineTo(ex, ey);
    ctx.lineTo(sx + Math.sin(angle) * 2, sy - Math.cos(angle) * 2);
    ctx.closePath();

    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, domainColor + '60');
    grad.addColorStop(1, domainColor + '10');
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

function drawPhenotypePlates(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, creature, domainColor } = rc;
  const baseRadius = rc.w * (0.12 + creature.evolution_stage * 0.03);
  const plateCount = pheno.plates;
  const metallic = pheno.metallic;
  const rand = seededRandom(creature.appearance_seed + 9999);

  ctx.save();
  for (let i = 0; i < plateCount; i++) {
    const angle = (i / plateCount) * Math.PI * 2 + rand() * 0.4;
    const dist = baseRadius * (0.5 + rand() * 0.4);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = (4 + rand() * 6) * (1 + creature.evolution_stage * 0.2);

    ctx.beginPath();
    const pts = 5 + Math.floor(rand() * 3);
    for (let p = 0; p < pts; p++) {
      const a = (p / pts) * Math.PI * 2;
      const r = size * (0.7 + rand() * 0.3);
      const x = px + Math.cos(a) * r;
      const y = py + Math.sin(a) * r;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Metallic gradient
    const g = ctx.createLinearGradient(px - size, py - size, px + size, py + size);
    const base = metallic > 0.5 ? '#c0c0c0' : '#888888';
    g.addColorStop(0, base + 'cc');
    g.addColorStop(0.5, '#ffffff40');
    g.addColorStop(1, base + '88');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = domainColor + '30';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhenotypeParticles(rc: RenderContext, cx: number, cy: number, pheno: CreaturePhenotype) {
  const { ctx, time, domainColor, creature } = rc;
  const baseRadius = rc.w * (0.12 + creature.evolution_stage * 0.03);
  const count = pheno.ambientParticles;
  const auraRadius = baseRadius * (1.5 + pheno.auraRadius);

  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = time * 0.3 + (i / count) * Math.PI * 2;
    const dist = auraRadius * (0.6 + Math.sin(time * 0.7 + i * 1.3) * 0.4);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = 1 + Math.sin(time * 2 + i * 0.7) * 1;
    const alpha = 0.2 + Math.sin(time + i) * 0.15;

    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fillStyle = domainColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
  }
  ctx.restore();
}
