import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All game routes require authentication
router.use(requireAuth);

// ============================================================
// VALIDATION HELPERS
// ============================================================

const VALID_HUNTER_RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'National', 'Monarch'] as const;
const VALID_DOMAINS = ['health', 'mind', 'discipline', 'career', 'finance', 'social'] as const;
const VALID_CREATURE_IDS = ['gore_maw', 'mind_weaver', 'chain_wraith', 'rot_engine', 'gilt_horror', 'hollow_singer'] as const;
const VALID_GENE_TIERS = ['base', 'dense', 'hyper', 'titan'] as const;
const VALID_TASK_TYPES = ['daily', 'weekly', 'boss', 'emergency'] as const;

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}
function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

function validatePlayerBody(body: Record<string, unknown>): string | null {
  if (!isString(body.name) || body.name.length === 0 || body.name.length > 50) return 'Invalid name';
  if (!VALID_HUNTER_RANKS.includes(body.hunter_rank as typeof VALID_HUNTER_RANKS[number])) return 'Invalid hunter_rank';
  if (!isNonNegInt(body.total_power)) return 'Invalid total_power';
  if (!isNonNegInt(body.gold)) return 'Invalid gold';
  if (!isNonNegInt(body.streak_current)) return 'Invalid streak_current';
  if (!isNonNegInt(body.streak_best)) return 'Invalid streak_best';
  if (!isNonNegInt(body.total_tasks_completed)) return 'Invalid total_tasks_completed';
  if (!isNonNegInt(body.total_genes_acquired)) return 'Invalid total_genes_acquired';
  if (!Array.isArray(body.achievements)) return 'Invalid achievements';
  return null;
}

function validateCreatureBody(body: Record<string, unknown>): string | null {
  if (!isNonNegInt(body.evolution_stage) || (body.evolution_stage as number) > 5) return 'Invalid evolution_stage';
  if (!isNonNegInt(body.total_genes)) return 'Invalid total_genes';
  if (!isNonNegInt(body.total_power)) return 'Invalid total_power';
  if (typeof body.genes !== 'object' || body.genes === null) return 'Invalid genes';
  if (!Array.isArray(body.traits)) return 'Invalid traits';
  if (typeof body.body_slots !== 'object' || body.body_slots === null) return 'Invalid body_slots';
  return null;
}

function validateGeneBody(body: Record<string, unknown>): string | null {
  if (!isString(body.id)) return 'Invalid id';
  if (!isString(body.type)) return 'Invalid type';
  if (!VALID_DOMAINS.includes(body.domain as typeof VALID_DOMAINS[number])) return 'Invalid domain';
  if (!VALID_GENE_TIERS.includes(body.tier as typeof VALID_GENE_TIERS[number])) return 'Invalid tier';
  if (!isString(body.stat_key)) return 'Invalid stat_key';
  if (typeof body.stat_value !== 'number' || body.stat_value < 0) return 'Invalid stat_value';
  if (typeof body.visual_params !== 'object' || body.visual_params === null) return 'Invalid visual_params';
  return null;
}

// ============================================================
// GET /game/state — Load full game state
// ============================================================
router.get('/state', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;

    // Get player
    const { rows: players } = await pool.query(
      'SELECT * FROM players WHERE user_id = $1',
      [userId],
    );

    if (players.length === 0) {
      res.json({ initialized: false });
      return;
    }

    const player = players[0];

    // Get all related data in parallel
    const [creaturesRes, genesRes, tasksRes, achievementsRes] = await Promise.all([
      pool.query('SELECT * FROM creatures WHERE player_id = $1', [player.id]),
      pool.query('SELECT * FROM genes WHERE player_id = $1', [player.id]),
      pool.query('SELECT * FROM tasks WHERE player_id = $1', [player.id]),
      pool.query('SELECT * FROM achievements WHERE player_id = $1', [player.id]),
    ]);

    res.json({
      initialized: true,
      player: {
        id: player.id,
        name: player.name,
        hunter_rank: player.hunter_rank,
        total_power: player.total_power,
        gold: player.gold,
        streak_current: player.streak_current,
        streak_best: player.streak_best,
        streak_last_date: player.streak_last_date || '',
        total_tasks_completed: player.total_tasks_completed,
        total_genes_acquired: player.total_genes_acquired,
        achievements: player.achievements || [],
        created_at: player.created_at,
      },
      creatures: creaturesRes.rows.map(c => ({
        id: c.id,
        player_id: c.player_id,
        domain: c.domain,
        evolution_stage: c.evolution_stage,
        total_genes: c.total_genes,
        total_power: c.total_power,
        genes: c.genes || {},
        traits: c.traits || [],
        body_slots: c.body_slots || {},
        appearance_seed: c.appearance_seed,
        created_at: c.created_at,
      })),
      genes: genesRes.rows.map(g => ({
        id: g.id,
        type: g.type,
        domain: g.domain,
        tier: g.tier,
        stat_key: g.stat_key,
        stat_value: g.stat_value,
        visual_params: g.visual_params,
        acquired_from: g.acquired_from,
        acquired_at: g.acquired_at,
      })),
      tasks: tasksRes.rows.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
        domain: t.domain,
        category: t.category,
        difficulty: t.difficulty,
        type: t.type,
        rewards: t.rewards,
        repeatable: t.repeatable,
        completed_today: t.completed_today,
        completed_count: t.completed_count,
      })),
      achievements: achievementsRes.rows.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        hint: a.hint,
        icon: a.icon,
        rarity: a.rarity,
        condition: a.condition,
        reward: a.reward,
        lore_text: a.lore_text,
        unlocked: a.unlocked,
        unlocked_at: a.unlocked_at,
      })),
    });
  } catch (err) {
    console.error('Load game state error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// POST /game/initialize — Create new game for user
// ============================================================
router.post('/initialize', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, player, creatures, tasks, achievements } = req.body;

    if (!name || !player) {
      res.status(400).json({ error: 'Player name is required' });
      return;
    }

    // Check if already initialized
    const { rows: existing } = await pool.query(
      'SELECT id FROM players WHERE user_id = $1',
      [userId],
    );
    if (existing.length > 0) {
      res.status(409).json({ error: 'Game already initialized' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert player
      await client.query(
        `INSERT INTO players (id, user_id, name, hunter_rank, total_power, gold, streak_current, streak_best, streak_last_date, total_tasks_completed, total_genes_acquired, achievements, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [player.id, userId, player.name, player.hunter_rank, player.total_power, player.gold, player.streak_current, player.streak_best, player.streak_last_date || null, player.total_tasks_completed, player.total_genes_acquired, player.achievements || [], player.created_at],
      );

      // Insert creatures
      for (const c of creatures) {
        await client.query(
          `INSERT INTO creatures (id, player_id, domain, evolution_stage, total_genes, total_power, genes, traits, body_slots, appearance_seed, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [c.id, player.id, c.domain, c.evolution_stage, c.total_genes, c.total_power, JSON.stringify(c.genes), c.traits || [], JSON.stringify(c.body_slots), c.appearance_seed, c.created_at],
        );
      }

      // Insert tasks
      for (const t of tasks) {
        await client.query(
          `INSERT INTO tasks (id, player_id, name, description, icon, domain, category, difficulty, type, rewards, repeatable, completed_today, completed_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [t.id, player.id, t.name, t.description, t.icon, t.domain, t.category, t.difficulty, t.type, JSON.stringify(t.rewards), t.repeatable, t.completed_today, t.completed_count],
        );
      }

      // Insert achievements
      for (const a of achievements) {
        await client.query(
          `INSERT INTO achievements (id, player_id, name, description, hint, icon, rarity, condition, reward, lore_text, unlocked, unlocked_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [a.id, player.id, a.name, a.description, a.hint, a.icon, a.rarity, JSON.stringify(a.condition), JSON.stringify(a.reward), a.lore_text, a.unlocked, a.unlocked_at || null],
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, playerId: player.id });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Initialize game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// PUT /game/player — Save player state
// ============================================================
router.put('/player', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const player = req.body;

    const validationError = validatePlayerBody(player);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    await pool.query(
      `UPDATE players SET name = $1, hunter_rank = $2, total_power = $3, gold = $4, streak_current = $5, streak_best = $6, streak_last_date = $7, total_tasks_completed = $8, total_genes_acquired = $9, achievements = $10
       WHERE user_id = $11`,
      [player.name, player.hunter_rank, player.total_power, player.gold, player.streak_current, player.streak_best, player.streak_last_date || null, player.total_tasks_completed, player.total_genes_acquired, player.achievements || [], userId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Save player error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// PUT /game/creature/:id — Save creature state
// ============================================================
router.put('/creature/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const creatureId = req.params.id;
    const c = req.body;

    if (!VALID_CREATURE_IDS.includes(creatureId as typeof VALID_CREATURE_IDS[number])) {
      res.status(400).json({ error: 'Invalid creature ID' });
      return;
    }

    const creatureError = validateCreatureBody(c);
    if (creatureError) {
      res.status(400).json({ error: creatureError });
      return;
    }

    // Get player ID
    const { rows: players } = await pool.query('SELECT id FROM players WHERE user_id = $1', [userId]);
    if (players.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    await pool.query(
      `UPDATE creatures SET evolution_stage = $1, total_genes = $2, total_power = $3, genes = $4, traits = $5, body_slots = $6
       WHERE id = $7 AND player_id = $8`,
      [c.evolution_stage, c.total_genes, c.total_power, JSON.stringify(c.genes), c.traits || [], JSON.stringify(c.body_slots), creatureId, players[0].id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Save creature error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// POST /game/gene — Save a new gene
// ============================================================
router.post('/gene', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const g = req.body;

    const geneError = validateGeneBody(g);
    if (geneError) {
      res.status(400).json({ error: geneError });
      return;
    }

    const { rows: players } = await pool.query('SELECT id FROM players WHERE user_id = $1', [userId]);
    if (players.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    await pool.query(
      `INSERT INTO genes (id, player_id, type, domain, tier, stat_key, stat_value, visual_params, acquired_from, acquired_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [g.id, players[0].id, g.type, g.domain, g.tier, g.stat_key, g.stat_value, JSON.stringify(g.visual_params), g.acquired_from, g.acquired_at],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Save gene error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// PUT /game/tasks — Bulk save tasks
// ============================================================
router.put('/tasks', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const tasks = req.body.tasks;

    if (!Array.isArray(tasks)) {
      res.status(400).json({ error: 'tasks must be an array' });
      return;
    }
    for (const t of tasks) {
      if (!isString(t.id) || !isBoolean(t.completed_today) || !isNonNegInt(t.completed_count)) {
        res.status(400).json({ error: 'Invalid task entry' });
        return;
      }
    }

    const { rows: players } = await pool.query('SELECT id FROM players WHERE user_id = $1', [userId]);
    if (players.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const t of tasks) {
        await client.query(
          `UPDATE tasks SET completed_today = $1, completed_count = $2 WHERE id = $3 AND player_id = $4`,
          [t.completed_today, t.completed_count, t.id, players[0].id],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// PUT /game/achievements — Bulk save achievements
// ============================================================
router.put('/achievements', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const achievements = req.body.achievements;

    if (!Array.isArray(achievements)) {
      res.status(400).json({ error: 'achievements must be an array' });
      return;
    }
    for (const a of achievements) {
      if (!isString(a.id) || !isBoolean(a.unlocked)) {
        res.status(400).json({ error: 'Invalid achievement entry' });
        return;
      }
    }

    const { rows: players } = await pool.query('SELECT id FROM players WHERE user_id = $1', [userId]);
    if (players.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const a of achievements) {
        await client.query(
          `UPDATE achievements SET unlocked = $1, unlocked_at = $2 WHERE id = $3 AND player_id = $4`,
          [a.unlocked, a.unlocked_at || null, a.id, players[0].id],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save achievements error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// POST /game/daily-reset — Reset daily tasks
// ============================================================
router.post('/daily-reset', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;

    const { rows: players } = await pool.query('SELECT id FROM players WHERE user_id = $1', [userId]);
    if (players.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    await pool.query(
      `UPDATE tasks SET completed_today = FALSE WHERE player_id = $1 AND type = 'daily'`,
      [players[0].id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Daily reset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
