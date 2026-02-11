const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'football.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Get all players
const players = db.prepare('SELECT * FROM players').all();

console.log('Found', players.length, 'players');

// Find Talip Akhan
const talipAkhan = players.find(p => p.name === 'Talip Akhan');

if (talipAkhan) {
  console.log('Found Talip Akhan:', talipAkhan.id);

  // Set Talip Akhan as admin with specific password
  const stmt = db.prepare('UPDATE players SET password = ?, is_admin = 1 WHERE id = ?');
  stmt.run('Takhan170682_', talipAkhan.id);
  console.log('✓ Talip Akhan is now admin with password: Takhan170682_');
} else {
  console.log('❌ Talip Akhan not found!');
}

// Set all other players' passwords to default
const defaultPassword = 'palmiye2026';
const updateStmt = db.prepare('UPDATE players SET password = ? WHERE id = ?');

let updatedCount = 0;
players.forEach(player => {
  if (player.name !== 'Talip Akhan') {
    updateStmt.run(defaultPassword, player.id);
    updatedCount++;
  }
});

console.log(`✓ Set default password (${defaultPassword}) for ${updatedCount} other players`);

// Verify updates
console.log('\n--- Updated Players ---');
const updatedPlayers = db.prepare('SELECT id, name, is_admin FROM players ORDER BY name').all();
updatedPlayers.forEach(p => {
  console.log(`- ${p.name} (Admin: ${p.is_admin ? 'Yes' : 'No'})`);
});

db.close();
console.log('\n✅ Database updated successfully!');
