import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// All game routes require authentication
router.use(requireAuth);

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
