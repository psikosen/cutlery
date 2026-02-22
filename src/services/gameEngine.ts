import { v4 as uuidv4 } from 'uuid';
import type {
  Player, Creature, Gene, Task, Achievement, Notification,
  Domain, CreatureId, GeneType, GeneTier, EvolutionStage, HunterRank,
  BodySlot, BodySlotEntry,
} from '../types';
import {
  DOMAIN_TO_CREATURE, GENE_STAT_VALUES, GENE_SLOT_AFFINITIES,
  HUNTER_RANK_THRESHOLDS, GENE_STAT_KEYS,
  BILATERAL_PAIRS, BODY_SLOTS,
} from '../types';
import { getAllTraits } from '../data/traits';

// ============================================================
// PLAYER
// ============================================================

export function createDefaultPlayer(name: string): Player {
  return {
    id: uuidv4(),
    name,
    hunter_rank: 'E',
    total_power: 0,
    gold: 0,
    streak_current: 0,
    streak_best: 0,
    streak_last_date: '',
    total_tasks_completed: 0,
    total_genes_acquired: 0,
    achievements: [],
    created_at: new Date().toISOString(),
  };
}

export function calculateHunterRank(totalPower: number): HunterRank {
  for (const [threshold, rank] of HUNTER_RANK_THRESHOLDS) {
    if (totalPower >= threshold) return rank;
  }
  return 'E';
}

// ============================================================
// CREATURES
// ============================================================

const CREATURE_DOMAINS: Record<CreatureId, Domain> = {
  gore_maw: 'health',
  mind_weaver: 'mind',
  chain_wraith: 'discipline',
  rot_engine: 'career',
  gilt_horror: 'finance',
  hollow_singer: 'social',
};

export function createAllCreatures(playerId: string): Creature[] {
  return (Object.keys(CREATURE_DOMAINS) as CreatureId[]).map(id => ({
    id,
    player_id: playerId,
    domain: CREATURE_DOMAINS[id],
    evolution_stage: 0 as EvolutionStage,
    total_genes: 0,
    total_power: 0,
    genes: {},
    traits: [],
    body_slots: {},
    appearance_seed: Math.floor(Math.random() * 999999),
    created_at: new Date().toISOString(),
  }));
}

export function calculateEvolutionStage(totalGenes: number): EvolutionStage {
  if (totalGenes >= 300) return 5;
  if (totalGenes >= 150) return 4;
  if (totalGenes >= 75) return 3;
  if (totalGenes >= 30) return 2;
  if (totalGenes >= 10) return 1;
  return 0;
}

export function getNextEvolutionThreshold(stage: EvolutionStage): number {
  if (stage >= 5) return Infinity;
  return EVOLUTION_THRESHOLDS[(stage + 1) as EvolutionStage];
}

// ============================================================
// GENE GENERATION
// ============================================================

function pickBodySlot(geneType: GeneType, creature: Creature): BodySlot {
  const affinities = GENE_SLOT_AFFINITIES[geneType] || BODY_SLOTS;
  const slotCounts: Record<string, number> = {};
  for (const slot of affinities) {
    slotCounts[slot] = (creature.body_slots[slot] || []).length;
  }

  // Check bilateral balance
  for (const [left, right] of BILATERAL_PAIRS) {
    if (affinities.includes(left) && affinities.includes(right)) {
      const lc = slotCounts[left] || 0;
      const rc = slotCounts[right] || 0;
      if (lc > rc) return right;
      if (rc > lc) return left;
    }
  }

  // Pick the slot with fewest genes
  let minSlot = affinities[0];
  let minCount = Infinity;
  for (const slot of affinities) {
    const c = slotCounts[slot] || 0;
    if (c < minCount) {
      minCount = c;
      minSlot = slot;
    }
  }
  return minSlot;
}

export function generateGene(
  geneType: GeneType,
  domain: Domain,
  taskId: string,
  creature: Creature,
  tier: GeneTier = 'base',
): Gene {
  const bodySlot = pickBodySlot(geneType, creature);
  const statKey = GENE_STAT_KEYS[geneType] || 'Power';
  return {
    id: uuidv4(),
    type: geneType,
    domain,
    tier,
    stat_key: statKey,
    stat_value: GENE_STAT_VALUES[tier],
    visual_params: {
      size: 0.5 + Math.random() * 0.5,
      color_shift: Math.random(),
      animation_speed: 0.8 + Math.random() * 0.4,
      body_slot: bodySlot,
      procedural_seed: Math.floor(Math.random() * 999999),
    },
    acquired_from: taskId,
    acquired_at: new Date().toISOString(),
  };
}

// ============================================================
// APPLY GENE TO CREATURE
// ============================================================

export function applyGeneToCreature(creature: Creature, gene: Gene): {
  creature: Creature;
  evolved: boolean;
  oldStage: EvolutionStage;
  newStage: EvolutionStage;
  newTraits: string[];
} {
  const updated = { ...creature };
  const slot = gene.visual_params.body_slot;

  // Update gene inventory
  if (!updated.genes[gene.type]) {
    updated.genes[gene.type] = {
      count: 0,
      tier_breakdown: { base: 0, dense: 0, hyper: 0, titan: 0 },
      total_stat_value: 0,
    };
  }
  updated.genes[gene.type] = {
    ...updated.genes[gene.type],
    count: updated.genes[gene.type].count + 1,
    tier_breakdown: {
      ...updated.genes[gene.type].tier_breakdown,
      [gene.tier]: updated.genes[gene.type].tier_breakdown[gene.tier] + 1,
    },
    total_stat_value: updated.genes[gene.type].total_stat_value + gene.stat_value,
  };

  // Update body slots
  if (!updated.body_slots[slot]) {
    updated.body_slots[slot] = [];
  }
  updated.body_slots[slot] = [
    ...updated.body_slots[slot],
    {
      gene_type: gene.type,
      tier: gene.tier,
      visual_seed: gene.visual_params.procedural_seed,
      gene_id: gene.id,
    },
  ];

  // Update totals
  updated.total_genes = updated.total_genes + 1;
  updated.total_power = Object.values(updated.genes).reduce(
    (sum, g) => sum + g.total_stat_value,
    0
  );

  // Check evolution
  const oldStage = updated.evolution_stage;
  const newStage = calculateEvolutionStage(updated.total_genes);
  const evolved = newStage > oldStage;
  updated.evolution_stage = newStage;

  // Check traits
  const newTraits = checkTraitUnlocks(updated);

  return { creature: updated, evolved, oldStage, newStage, newTraits };
}

// ============================================================
// TRAIT CHECKING
// ============================================================

function checkTraitUnlocks(creature: Creature): string[] {
  const allTraits = getAllTraits();
  const newlyUnlocked: string[] = [];

  for (const trait of allTraits) {
    if (creature.traits.includes(trait.id)) continue;

    const geneType = trait.condition.gene_type;
    if (geneType === 'any' || geneType === 'mixed') continue;

    const geneEntry = creature.genes[geneType];
    if (geneEntry && geneEntry.count >= trait.condition.gene_count) {
      creature.traits = [...creature.traits, trait.id];
      newlyUnlocked.push(trait.id);
    }
  }

  // Check chimera/hybrid traits
  const uniqueTypes = Object.keys(creature.genes).length;
  for (const trait of allTraits) {
    if (creature.traits.includes(trait.id)) continue;
    if (trait.condition.unique_types && uniqueTypes >= trait.condition.unique_types) {
      creature.traits = [...creature.traits, trait.id];
      newlyUnlocked.push(trait.id);
    }
  }

  return newlyUnlocked;
}

// ============================================================
// GENE FUSION
// ============================================================

export function canFuseGenes(creature: Creature, geneType: GeneType, tier: GeneTier): boolean {
  const entry = creature.genes[geneType];
  if (!entry) return false;
  return entry.tier_breakdown[tier] >= 3;
}

export function getNextTier(tier: GeneTier): GeneTier | null {
  const order: GeneTier[] = ['base', 'dense', 'hyper', 'titan'];
  const idx = order.indexOf(tier);
  if (idx >= order.length - 1) return null;
  return order[idx + 1];
}

export function fuseGenes(
  creature: Creature,
  geneType: GeneType,
  tier: GeneTier,
  genes: Gene[],
): { creature: Creature; newGene: Gene; removedGeneIds: string[] } | null {
  const nextTier = getNextTier(tier);
  if (!nextTier) return null;
  if (!canFuseGenes(creature, geneType, tier)) return null;

  // Find 3 genes of this type and tier
  const matching = genes.filter(g => g.type === geneType && g.tier === tier);
  if (matching.length < 3) return null;

  const toRemove = matching.slice(0, 3);
  const removedIds = toRemove.map(g => g.id);

  // Remove from creature
  const updated = { ...creature };
  updated.genes[geneType] = {
    ...updated.genes[geneType],
    count: updated.genes[geneType].count - 3 + 1,
    tier_breakdown: {
      ...updated.genes[geneType].tier_breakdown,
      [tier]: updated.genes[geneType].tier_breakdown[tier] - 3,
      [nextTier]: updated.genes[geneType].tier_breakdown[nextTier] + 1,
    },
    total_stat_value: updated.genes[geneType].total_stat_value
      - (GENE_STAT_VALUES[tier] * 3)
      + GENE_STAT_VALUES[nextTier],
  };

  // Remove body slot entries
  for (const id of removedIds) {
    for (const slot of Object.keys(updated.body_slots)) {
      updated.body_slots[slot] = updated.body_slots[slot].filter(
        (e: BodySlotEntry) => e.gene_id !== id
      );
    }
  }

  // Also update total gene count and total power
  updated.total_genes = updated.total_genes - 2; // removed 3, added 1
  updated.total_power = Object.values(updated.genes).reduce(
    (sum, g) => sum + g.total_stat_value,
    0
  );

  // Create the new fused gene
  const bodySlot = pickBodySlot(geneType, updated);
  const newGene: Gene = {
    id: uuidv4(),
    type: geneType,
    domain: creature.domain,
    tier: nextTier,
    stat_key: GENE_STAT_KEYS[geneType],
    stat_value: GENE_STAT_VALUES[nextTier],
    visual_params: {
      size: 0.7 + Math.random() * 0.5,
      color_shift: Math.random(),
      animation_speed: 0.7 + Math.random() * 0.3,
      body_slot: bodySlot,
      procedural_seed: Math.floor(Math.random() * 999999),
    },
    acquired_from: 'fusion',
    acquired_at: new Date().toISOString(),
  };

  // Add new gene to body slots
  if (!updated.body_slots[bodySlot]) {
    updated.body_slots[bodySlot] = [];
  }
  updated.body_slots[bodySlot] = [
    ...updated.body_slots[bodySlot],
    {
      gene_type: geneType,
      tier: nextTier,
      visual_seed: newGene.visual_params.procedural_seed,
      gene_id: newGene.id,
    },
  ];

  return { creature: updated, newGene, removedGeneIds: removedIds };
}

// ============================================================
// STREAK PROCESSING
// ============================================================

export function processStreak(player: Player): {
  player: Player;
  streakGenes: { type: GeneType; count: number }[];
} {
  const today = new Date().toISOString().split('T')[0];
  const updated = { ...player };
  const streakGenes: { type: GeneType; count: number }[] = [];

  if (updated.streak_last_date === today) {
    return { player: updated, streakGenes };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (updated.streak_last_date === yesterdayStr) {
    updated.streak_current += 1;
  } else if (updated.streak_last_date === '') {
    updated.streak_current = 1;
  } else {
    updated.streak_current = 1;
  }

  updated.streak_last_date = today;
  if (updated.streak_current > updated.streak_best) {
    updated.streak_best = updated.streak_current;
  }

  // Streak gene rewards
  const streak = updated.streak_current;
  if (streak >= 66) {
    streakGenes.push({ type: 'chain_link', count: 5 });
    streakGenes.push({ type: 'lock_core', count: 2 });
    streakGenes.push({ type: 'ember_node', count: 2 });
  } else if (streak >= 30 && streak % 30 === 0) {
    streakGenes.push({ type: 'chain_link', count: 3 });
    streakGenes.push({ type: 'ember_node', count: 1 });
    streakGenes.push({ type: 'lock_core', count: 1 });
  } else if (streak >= 14 && streak % 14 === 0) {
    streakGenes.push({ type: 'chain_link', count: 2 });
    streakGenes.push({ type: 'lock_core', count: 1 });
  } else if (streak >= 7 && streak % 7 === 0) {
    streakGenes.push({ type: 'chain_link', count: 1 });
    streakGenes.push({ type: 'iron_plate', count: 1 });
  } else if (streak >= 3 && streak % 3 === 0) {
    streakGenes.push({ type: 'chain_link', count: 1 });
  }

  return { player: updated, streakGenes };
}

// ============================================================
// ACHIEVEMENT CHECKING
// ============================================================

export function checkAchievements(
  player: Player,
  creatures: Creature[],
  achievements: Achievement[],
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const updated = [...achievements];
  const newlyUnlocked: Achievement[] = [];

  for (let i = 0; i < updated.length; i++) {
    const a = updated[i];
    if (a.unlocked) continue;

    let met = false;
    switch (a.condition.type) {
      case 'total_genes':
        met = player.total_genes_acquired >= a.condition.value;
        break;
      case 'total_tasks':
        met = player.total_tasks_completed >= a.condition.value;
        break;
      case 'streak':
        met = player.streak_current >= a.condition.value;
        break;
      case 'rank':
        met = player.total_power >= a.condition.value;
        break;
      case 'evolution':
        met = creatures.some(c => c.evolution_stage >= a.condition.value);
        break;
      case 'total_traits': {
        const totalTraits = creatures.reduce((sum, c) => sum + c.traits.length, 0);
        met = totalTraits >= a.condition.value;
        break;
      }
      case 'all_domains': {
        const domainsWithGenes = new Set(creatures.filter(c => c.total_genes > 0).map(c => c.domain));
        met = domainsWithGenes.size >= 6;
        break;
      }
    }

    if (met) {
      updated[i] = { ...a, unlocked: true, unlocked_at: new Date().toISOString() };
      newlyUnlocked.push(updated[i]);
    }
  }

  return { achievements: updated, newlyUnlocked };
}

// ============================================================
// TASK COMPLETION (FULL PIPELINE)
// ============================================================

export interface TaskCompletionResult {
  gene: Gene;
  creature: Creature;
  player: Player;
  evolved: boolean;
  oldStage: EvolutionStage;
  newStage: EvolutionStage;
  newTraits: string[];
  notifications: Notification[];
  streakGenes: Gene[];
  newAchievements: Achievement[];
}

export function completeTask(
  task: Task,
  player: Player,
  creatures: Creature[],
  achievements: Achievement[],
): TaskCompletionResult {
  const creatureId = DOMAIN_TO_CREATURE[task.domain];
  const creature = creatures.find(c => c.id === creatureId)!;
  const notifications: Notification[] = [];

  // Generate primary gene
  const gene = generateGene(task.rewards.gene_type, task.domain, task.id, creature);

  // Apply gene to creature
  const result = applyGeneToCreature(creature, gene);

  // Update player
  let updatedPlayer = {
    ...player,
    total_tasks_completed: player.total_tasks_completed + 1,
    total_genes_acquired: player.total_genes_acquired + 1,
    gold: player.gold + task.rewards.gold,
  };

  // Gene notification
  notifications.push({
    id: uuidv4(),
    title: 'Gene Acquired',
    message: `${gene.type.replace(/_/g, ' ')} +${gene.stat_value} ${gene.stat_key}`,
    type: 'gene',
    domain: task.domain,
    created_at: Date.now(),
  });

  // Process streak
  const streakResult = processStreak(updatedPlayer);
  updatedPlayer = streakResult.player;

  // Generate streak genes
  const streakGenes: Gene[] = [];
  let chainWraith = creatures.find(c => c.id === 'chain_wraith')!;
  if (result.creature.id === 'chain_wraith') {
    chainWraith = result.creature;
  }
  for (const sg of streakResult.streakGenes) {
    for (let i = 0; i < sg.count; i++) {
      const sGene = generateGene(sg.type, 'discipline', 'streak', chainWraith);
      const sResult = applyGeneToCreature(chainWraith, sGene);
      chainWraith = sResult.creature;
      streakGenes.push(sGene);
      updatedPlayer.total_genes_acquired += 1;
    }
  }

  if (streakResult.streakGenes.length > 0) {
    notifications.push({
      id: uuidv4(),
      title: `${updatedPlayer.streak_current}-Day Streak!`,
      message: `Chain Wraith feeds on your consistency`,
      type: 'streak',
      domain: 'discipline',
      created_at: Date.now(),
    });
  }

  // Evolution notification
  if (result.evolved) {
    notifications.push({
      id: uuidv4(),
      title: 'EVOLUTION',
      message: `${creatureId.replace(/_/g, ' ')} evolved to stage ${result.newStage}!`,
      type: 'evolution',
      domain: task.domain,
      created_at: Date.now(),
    });
  }

  // Trait notifications
  for (const traitId of result.newTraits) {
    const trait = getAllTraits().find(t => t.id === traitId);
    if (trait) {
      notifications.push({
        id: uuidv4(),
        title: 'Trait Unlocked',
        message: `${trait.name}: ${trait.description}`,
        type: 'trait',
        domain: task.domain,
        created_at: Date.now(),
      });
    }
  }

  // Update all creatures with new power
  const updatedCreatures = creatures.map(c => {
    if (c.id === result.creature.id) return result.creature;
    if (c.id === 'chain_wraith' && result.creature.id !== 'chain_wraith') return chainWraith;
    return c;
  });

  // Recalculate total power
  updatedPlayer.total_power = updatedCreatures.reduce((sum, c) => sum + c.total_power, 0);
  const newRank = calculateHunterRank(updatedPlayer.total_power);
  if (newRank !== updatedPlayer.hunter_rank) {
    notifications.push({
      id: uuidv4(),
      title: 'RANK UP',
      message: `Hunter Rank: ${updatedPlayer.hunter_rank} → ${newRank}`,
      type: 'rank',
      created_at: Date.now(),
    });
    updatedPlayer.hunter_rank = newRank;
  }

  // Check achievements
  const achResult = checkAchievements(updatedPlayer, updatedCreatures, achievements);
  for (const a of achResult.newlyUnlocked) {
    notifications.push({
      id: uuidv4(),
      title: 'Achievement Unlocked',
      message: `${a.name}: ${a.description}`,
      type: 'achievement',
      created_at: Date.now(),
    });
    updatedPlayer.gold += a.reward.gold;
  }

  updatedPlayer.achievements = achResult.achievements
    .filter(a => a.unlocked)
    .map(a => a.id);

  return {
    gene,
    creature: result.creature,
    player: updatedPlayer,
    evolved: result.evolved,
    oldStage: result.oldStage,
    newStage: result.newStage,
    newTraits: result.newTraits,
    notifications,
    streakGenes,
    newAchievements: achResult.newlyUnlocked,
  };
}
