import pool from './pool.js';

const MIGRATIONS = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
      -- Users & Auth
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret_encrypted TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        mfa_verified BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        purpose TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

      CREATE TABLE IF NOT EXISTS backup_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        used BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_backup_user ON backup_codes(user_id);

      -- Game Entities
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY,
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        hunter_rank TEXT DEFAULT 'E',
        total_power INTEGER DEFAULT 0,
        gold INTEGER DEFAULT 0,
        streak_current INTEGER DEFAULT 0,
        streak_best INTEGER DEFAULT 0,
        streak_last_date DATE,
        total_tasks_completed INTEGER DEFAULT 0,
        total_genes_acquired INTEGER DEFAULT 0,
        achievements TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_players_user ON players(user_id);

      CREATE TABLE IF NOT EXISTS creatures (
        id TEXT NOT NULL,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        domain TEXT NOT NULL,
        evolution_stage INTEGER DEFAULT 0,
        total_genes INTEGER DEFAULT 0,
        total_power INTEGER DEFAULT 0,
        genes JSONB DEFAULT '{}',
        traits TEXT[] DEFAULT '{}',
        body_slots JSONB DEFAULT '{}',
        appearance_seed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (id, player_id)
      );
      CREATE INDEX IF NOT EXISTS idx_creatures_player ON creatures(player_id);

      CREATE TABLE IF NOT EXISTS genes (
        id UUID PRIMARY KEY,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        domain TEXT NOT NULL,
        tier TEXT DEFAULT 'base',
        stat_key TEXT NOT NULL,
        stat_value INTEGER NOT NULL,
        visual_params JSONB NOT NULL,
        acquired_from TEXT NOT NULL,
        acquired_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_genes_player ON genes(player_id);
      CREATE INDEX IF NOT EXISTS idx_genes_domain ON genes(domain);

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        domain TEXT NOT NULL,
        category TEXT,
        difficulty INTEGER DEFAULT 1,
        type TEXT DEFAULT 'daily',
        rewards JSONB NOT NULL,
        repeatable BOOLEAN DEFAULT TRUE,
        completed_today BOOLEAN DEFAULT FALSE,
        completed_count INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_player ON tasks(player_id);

      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT NOT NULL,
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        hint TEXT,
        icon TEXT,
        rarity TEXT DEFAULT 'common',
        condition JSONB NOT NULL,
        reward JSONB NOT NULL,
        lore_text TEXT,
        unlocked BOOLEAN DEFAULT FALSE,
        unlocked_at TIMESTAMPTZ,
        PRIMARY KEY (id, player_id)
      );
      CREATE INDEX IF NOT EXISTS idx_achievements_player ON achievements(player_id);

      -- Migrations tracker
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
];

async function migrate() {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows } = await client.query('SELECT version FROM schema_migrations ORDER BY version');
    const applied = new Set(rows.map((r: { version: number }) => r.version));

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.version)) {
        console.log(`  [skip] Migration ${migration.version}: ${migration.name} (already applied)`);
        continue;
      }

      console.log(`  [run]  Migration ${migration.version}: ${migration.name}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [migration.version, migration.name],
        );
        await client.query('COMMIT');
        console.log(`  [done] Migration ${migration.version} applied`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('All migrations applied.');
  } finally {
    client.release();
  }
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
