const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'football.db');
const db = new Database(dbPath);

console.log('Migrating database...');

try {
  // Add password column if it doesn't exist
  try {
    db.prepare('ALTER TABLE players ADD COLUMN password TEXT').run();
    console.log('✓ Added password column to players table');
  } catch (e) {
    console.log('- password column already exists');
  }

  // Add is_admin column if it doesn't exist
  try {
    db.prepare('ALTER TABLE players ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0').run();
    console.log('✓ Added is_admin column to players table');
  } catch (e) {
    console.log('- is_admin column already exists');
  }

  // Create sessions table if it doesn't exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Sessions table exists or was created');
  } catch (e) {
    console.log('- sessions table already exists');
  }

  // Create indexes
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)');
    console.log('✓ Indexes created or already exist');
  } catch (e) {
    console.log('- indexes already exist');
  }

  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
} finally {
  db.close();
}
