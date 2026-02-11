import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'football.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Lightweight migrations for new columns
try {
  db.exec(`ALTER TABLE pitch_state ADD COLUMN scheduled_at TEXT`);
} catch {}
try {
  db.exec(`ALTER TABLE pitch_state ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0`);
} catch {}
try {
  db.exec(`ALTER TABLE pitch_state ADD COLUMN player_positions TEXT NOT NULL DEFAULT '{}'`);
} catch {}
try {
  db.exec(`ALTER TABLE goals ADD COLUMN youtube_url TEXT`);
} catch {}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    position_preference TEXT NOT NULL,
    photo_url TEXT,
    password TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pitch_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    match_type TEXT NOT NULL DEFAULT '5v5',
    active_players TEXT NOT NULL DEFAULT '[]',
    team_a_formation TEXT,
    team_b_formation TEXT,
    scheduled_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 0,
    player_positions TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT '5v5',
    team_a_score INTEGER NOT NULL DEFAULT 0,
    team_b_score INTEGER NOT NULL DEFAULT 0,
    team_a_formation TEXT,
    team_b_formation TEXT,
    team_a_players TEXT NOT NULL DEFAULT '[]',
    team_b_players TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    minute INTEGER,
    team TEXT NOT NULL,
    is_confirmed INTEGER NOT NULL DEFAULT 0,
    youtube_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  -- Insert default max_players setting
  INSERT OR IGNORE INTO settings (key, value, description)
  VALUES ('max_players', '50', 'Maksimum oyuncu sayısı limiti');

  -- Insert default pitch state
  INSERT OR IGNORE INTO pitch_state (id, match_type, active_players, is_active)
  VALUES ('current', '5v5', '[]', 0);

  CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
  CREATE INDEX IF NOT EXISTS idx_players_position ON players(position_preference);
  CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
  CREATE INDEX IF NOT EXISTS idx_goals_match_id ON goals(match_id);
  CREATE INDEX IF NOT EXISTS idx_goals_player_id ON goals(player_id);
`);

export interface Player {
  id: string;
  name: string;
  positionPreference: string;
  photoUrl: string | null;
  password: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  maxPlayers: number;
}

export interface PitchState {
  matchType: string;
  activePlayers: Array<{ slotId: string; playerId: string }>;
  teamAFormation: string | null;
  teamBFormation: string | null;
  scheduledAt: Date | null;
  isActive: boolean;
  playerPositions: Record<string, { x: number; y: number }>;
  updatedAt: Date;
}

export interface Match {
  id: string;
  date: Date;
  matchType: string;
  teamAScore: number;
  teamBScore: number;
  teamAFormation: string | null;
  teamBFormation: string | null;
  teamAPlayers: string[];
  teamBPlayers: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  minute: number | null;
  team: 'A' | 'B';
  isConfirmed: boolean;
  youtubeUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  position: string;
  photoUrl: string | null;
  totalGoals: number;
  totalMatches: number;
  goalsPerMatch: number;
  lastMatchDate: Date | null;
}

// Helper to convert row to Player
function rowToPlayer(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    positionPreference: row.position_preference,
    photoUrl: row.photo_url,
    password: row.password,
    isAdmin: Boolean(row.is_admin),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Player CRUD operations
export function getAllPlayers(): Player[] {
  const stmt = db.prepare('SELECT * FROM players ORDER BY name');
  const rows = stmt.all();
  return rows.map(rowToPlayer);
}

export function getPlayerById(id: string): Player | null {
  const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToPlayer(row) : null;
}

export function getPlayerCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM players');
  const result = stmt.get() as { count: number };
  return result.count;
}

export function createPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Player {
  const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO players (id, name, position_preference, photo_url, password, is_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    player.name,
    player.positionPreference,
    player.photoUrl,
    player.password || null,
    player.isAdmin ? 1 : 0,
    now,
    now
  );

  return getPlayerById(id)!;
}

export function updatePlayer(id: string, updates: Partial<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>): Player {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.positionPreference !== undefined) {
    fields.push('position_preference = ?');
    values.push(updates.positionPreference);
  }
  if (updates.photoUrl !== undefined) {
    fields.push('photo_url = ?');
    values.push(updates.photoUrl);
  }
  if (updates.password !== undefined) {
    fields.push('password = ?');
    values.push(updates.password);
  }
  if (updates.isAdmin !== undefined) {
    fields.push('is_admin = ?');
    values.push(updates.isAdmin ? 1 : 0);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE players SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getPlayerById(id)!;
}

export function deletePlayer(id: string): void {
  const stmt = db.prepare('DELETE FROM players WHERE id = ?');
  stmt.run(id);
}

// Settings operations
export function getSettings(): Settings {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as Array<{ key: string; value: string }>;

  const settings: Settings = {
    maxPlayers: 50, // default
  };

  for (const row of rows) {
    if (row.key === 'max_players') {
      settings.maxPlayers = parseInt(row.value, 10) || 50;
    }
  }

  return settings;
}

export function updateMaxPlayers(maxPlayers: number): void {
  const stmt = db.prepare(`
    UPDATE settings
    SET value = ?, updated_at = ?
    WHERE key = 'max_players'
  `);
  stmt.run(maxPlayers.toString(), new Date().toISOString());
}

export function isMaxPlayersReached(): boolean {
  const settings = getSettings();
  const count = getPlayerCount();
  return count >= settings.maxPlayers;
}

// Pitch State operations
export function getPitchState(): PitchState {
  const stmt = db.prepare('SELECT * FROM pitch_state WHERE id = ?');
  const row = stmt.get('current') as any;

  if (!row) {
    return {
      matchType: '5v5',
      activePlayers: [],
      teamAFormation: null,
      teamBFormation: null,
      playerPositions: {},
      updatedAt: new Date(),
    };
  }

  return {
    matchType: row.match_type || '5v5',
    activePlayers: JSON.parse(row.active_players || '[]'),
    teamAFormation: row.team_a_formation || null,
    teamBFormation: row.team_b_formation || null,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : null,
    isActive: Boolean(row.is_active),
    playerPositions: row.player_positions ? JSON.parse(row.player_positions) : {},
    updatedAt: new Date(row.updated_at),
  };
}

export function updatePitchState(state: Omit<Partial<PitchState>, 'updatedAt'>): void {
  const current = getPitchState();
  const updates: string[] = [];
  const values: any[] = [];

  if (state.matchType !== undefined) {
    updates.push('match_type = ?');
    values.push(state.matchType);
  }
  if (state.activePlayers !== undefined) {
    updates.push('active_players = ?');
    values.push(JSON.stringify(state.activePlayers));
  }
  if (state.teamAFormation !== undefined) {
    updates.push('team_a_formation = ?');
    values.push(state.teamAFormation);
  }
  if (state.teamBFormation !== undefined) {
    updates.push('team_b_formation = ?');
    values.push(state.teamBFormation);
  }
  if (state.scheduledAt !== undefined) {
    updates.push('scheduled_at = ?');
    values.push(state.scheduledAt ? state.scheduledAt.toISOString() : null);
  }
  if (state.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(state.isActive ? 1 : 0);
  }
  if (state.playerPositions !== undefined) {
    updates.push('player_positions = ?');
    values.push(JSON.stringify(state.playerPositions));
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push('current');

  const stmt = db.prepare(`UPDATE pitch_state SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function clearPitchState(): void {
  const stmt = db.prepare(`
    UPDATE pitch_state
    SET active_players = '[]',
        team_a_formation = NULL,
        team_b_formation = NULL,
        player_positions = '{}',
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(new Date().toISOString(), 'current');
}

// Authentication functions
export interface Session {
  id: string;
  playerId: string;
  expiresAt: Date;
}

export function loginPlayer(playerId: string, password: string): { success: boolean; player?: Player; sessionId?: string; error?: string } {
  const player = getPlayerById(playerId);

  if (!player) {
    return { success: false, error: 'Oyuncu bulunamadı' };
  }

  // Check password if set (admin users might have empty passwords initially)
  if (player.password && player.password !== password) {
    return { success: false, error: 'Hatalı şifre' };
  }

  // Create session
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const stmt = db.prepare(`
    INSERT INTO sessions (id, player_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(sessionId, playerId, expiresAt.toISOString(), new Date().toISOString());

  return { success: true, player, sessionId };
}

export function logoutPlayer(sessionId: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  stmt.run(sessionId);
}

export function getSession(sessionId: string): { session: Session; player: Player } | null {
  const stmt = db.prepare(`
    SELECT s.*, p.* FROM sessions s
    JOIN players p ON s.player_id = p.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `);

  const row = stmt.get(sessionId) as any;

  if (!row) {
    return null;
  }

  return {
    session: {
      id: row.id,
      playerId: row.player_id,
      expiresAt: new Date(row.expires_at),
    },
    player: rowToPlayer(row),
  };
}

export function verifyPassword(playerId: string, password: string): boolean {
  const player = getPlayerById(playerId);

  if (!player) {
    return false;
  }

  return player.password === password;
}

export function setPlayerPassword(playerId: string, password: string): void {
  const stmt = db.prepare('UPDATE players SET password = ? WHERE id = ?');
  stmt.run(password, playerId);
}

export function hashPassword(password: string): string {
  // Simple hash for demo purposes - in production, use bcrypt
  return password; // TODO: Use proper password hashing
}

// Match CRUD operations
export function getAllMatches(): Match[] {
  const stmt = db.prepare('SELECT * FROM matches ORDER BY date DESC');
  const rows = stmt.all() as Array<{
    id: string;
    date: string;
    match_type: string;
    team_a_score: number;
    team_b_score: number;
    team_a_formation: string | null;
    team_b_formation: string | null;
    team_a_players: string;
    team_b_players: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map(row => ({
    id: row.id,
    date: new Date(row.date),
    matchType: row.match_type,
    teamAScore: row.team_a_score,
    teamBScore: row.team_b_score,
    teamAFormation: row.team_a_formation,
    teamBFormation: row.team_b_formation,
    teamAPlayers: JSON.parse(row.team_a_players || '[]'),
    teamBPlayers: JSON.parse(row.team_b_players || '[]'),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export function getMatchById(id: string): Match | null {
  const stmt = db.prepare('SELECT * FROM matches WHERE id = ?');
  const row = stmt.get(id) as {
    id: string;
    date: string;
    match_type: string;
    team_a_score: number;
    team_b_score: number;
    team_a_formation: string | null;
    team_b_formation: string | null;
    team_a_players: string;
    team_b_players: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  } | undefined;
  if (!row) return null;

  return {
    id: row.id,
    date: new Date(row.date),
    matchType: row.match_type,
    teamAScore: row.team_a_score,
    teamBScore: row.team_b_score,
    teamAFormation: row.team_a_formation,
    teamBFormation: row.team_b_formation,
    teamAPlayers: JSON.parse(row.team_a_players || '[]'),
    teamBPlayers: JSON.parse(row.team_b_players || '[]'),
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Match {
  const id = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO matches (id, date, match_type, team_a_score, team_b_score, team_a_formation, team_b_formation, team_a_players, team_b_players, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    match.date.toISOString(),
    match.matchType,
    match.teamAScore,
    match.teamBScore,
    match.teamAFormation || null,
    match.teamBFormation || null,
    JSON.stringify(match.teamAPlayers),
    JSON.stringify(match.teamBPlayers),
    match.notes || null,
    now,
    now
  );

  return getMatchById(id)!;
}

export function updateMatch(id: string, updates: Partial<Omit<Match, 'id' | 'createdAt' | 'updatedAt'>>): Match {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date.toISOString());
  }
  if (updates.matchType !== undefined) {
    fields.push('match_type = ?');
    values.push(updates.matchType);
  }
  if (updates.teamAScore !== undefined) {
    fields.push('team_a_score = ?');
    values.push(updates.teamAScore);
  }
  if (updates.teamBScore !== undefined) {
    fields.push('team_b_score = ?');
    values.push(updates.teamBScore);
  }
  if (updates.teamAFormation !== undefined) {
    fields.push('team_a_formation = ?');
    values.push(updates.teamAFormation);
  }
  if (updates.teamBFormation !== undefined) {
    fields.push('team_b_formation = ?');
    values.push(updates.teamBFormation);
  }
  if (updates.teamAPlayers !== undefined) {
    fields.push('team_a_players = ?');
    values.push(JSON.stringify(updates.teamAPlayers));
  }
  if (updates.teamBPlayers !== undefined) {
    fields.push('team_b_players = ?');
    values.push(JSON.stringify(updates.teamBPlayers));
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE matches SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getMatchById(id)!;
}

export function deleteMatch(id: string): void {
  // Goals will be deleted automatically due to CASCADE
  const stmt = db.prepare('DELETE FROM matches WHERE id = ?');
  stmt.run(id);
}

// Goal operations
export function getGoalsByMatch(matchId: string): Goal[] {
  const stmt = db.prepare('SELECT * FROM goals WHERE match_id = ? ORDER BY minute ASC');
  const rows = stmt.all(matchId) as Array<{
    id: string;
    match_id: string;
    player_id: string;
    minute: number | null;
    team: string;
    is_confirmed: number;
    youtube_url: string | null;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map(row => ({
    id: row.id,
    matchId: row.match_id,
    playerId: row.player_id,
    minute: row.minute,
    team: row.team as 'A' | 'B',
    isConfirmed: Boolean(row.is_confirmed),
    youtubeUrl: row.youtube_url || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export function createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
  const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO goals (id, match_id, player_id, minute, team, is_confirmed, youtube_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    goal.matchId,
    goal.playerId,
    goal.minute || null,
    goal.team,
    goal.isConfirmed ? 1 : 0,
    goal.youtubeUrl || null,
    now,
    now
  );

  const getStmt = db.prepare('SELECT * FROM goals WHERE id = ?');
  const row = getStmt.get(id) as {
    id: string;
    match_id: string;
    player_id: string;
    minute: number | null;
    team: string;
    is_confirmed: number;
    youtube_url: string | null;
    created_at: string;
    updated_at: string;
  };

  return {
    id: row.id,
    matchId: row.match_id,
    playerId: row.player_id,
    minute: row.minute,
    team: row.team as 'A' | 'B',
    isConfirmed: Boolean(row.is_confirmed),
    youtubeUrl: row.youtube_url || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>): Goal {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.minute !== undefined) {
    fields.push('minute = ?');
    values.push(updates.minute);
  }
  if (updates.isConfirmed !== undefined) {
    fields.push('is_confirmed = ?');
    values.push(updates.isConfirmed ? 1 : 0);
  }
  if (updates.youtubeUrl !== undefined) {
    fields.push('youtube_url = ?');
    values.push(updates.youtubeUrl);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM goals WHERE id = ?');
  const row = getStmt.get(id) as {
    id: string;
    match_id: string;
    player_id: string;
    minute: number | null;
    team: string;
    is_confirmed: number;
    youtube_url: string | null;
    created_at: string;
    updated_at: string;
  };

  return {
    id: row.id,
    matchId: row.match_id,
    playerId: row.player_id,
    minute: row.minute,
    team: row.team as 'A' | 'B',
    isConfirmed: Boolean(row.is_confirmed),
    youtubeUrl: row.youtube_url || null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function deleteGoal(id: string): void {
  const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
  stmt.run(id);
}

// Statistics functions
export function getPlayerStats(): PlayerStats[] {
  // Get all players
  const players = getAllPlayers();

  // Get all matches with their goals
  const matches = getAllMatches();

  // Build player stats map
  const statsMap = new Map<string, {
    playerId: string;
    playerName: string;
    position: string;
    photoUrl: string | null;
    totalGoals: number;
    totalMatches: number;
    lastMatchDate: Date | null;
  }>();

  // Initialize with all players
  for (const player of players) {
    statsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      position: player.positionPreference,
      photoUrl: player.photoUrl,
      totalGoals: 0,
      totalMatches: 0,
      lastMatchDate: null,
    });
  }

  // Process each match
  for (const match of matches) {
    // Combine both team players
    const allPlayerIds = [...match.teamAPlayers, ...match.teamBPlayers];

    // Get goals for this match
    const goals = getGoalsByMatch(match.id);

    // Update stats for players who participated
    for (const playerId of allPlayerIds) {
      const stats = statsMap.get(playerId);
      if (stats) {
        stats.totalMatches++;
        // Count goals for this player in this match
        const playerGoals = goals.filter(g => g.playerId === playerId && g.isConfirmed).length;
        stats.totalGoals += playerGoals;
        // Update last match date if more recent
        if (!stats.lastMatchDate || match.date > stats.lastMatchDate) {
          stats.lastMatchDate = match.date;
        }
      }
    }
  }

  // Convert to array and sort by goals, then matches
  return Array.from(statsMap.values())
    .map(stats => ({
      ...stats,
      goalsPerMatch: stats.totalMatches > 0 ? stats.totalGoals / stats.totalMatches : 0,
    }))
    .sort((a, b) => {
      if (b.totalGoals !== a.totalGoals) {
        return b.totalGoals - a.totalGoals;
      }
      return b.totalMatches - a.totalMatches;
    });
}

export function getMatchStats(): {
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
} {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as totalMatches,
      SUM(team_a_score + team_b_score) as totalGoals
    FROM matches
  `);
  const stats = stmt.get() as any;

  const winStmt = db.prepare(`
    SELECT
      COUNT(CASE WHEN team_a_score > team_b_score THEN 1 END) as teamAWins,
      COUNT(CASE WHEN team_b_score > team_a_score THEN 1 END) as teamBWins,
      COUNT(CASE WHEN team_a_score = team_b_score THEN 1 END) as draws
    FROM matches
  `);
  const winStats = winStmt.get() as any;

  return {
    totalMatches: stats.totalMatches || 0,
    totalGoals: stats.totalGoals || 0,
    avgGoalsPerMatch: stats.totalMatches > 0 ? (stats.totalGoals / stats.totalMatches) : 0,
    teamAWins: winStats.teamAWins || 0,
    teamBWins: winStats.teamBWins || 0,
    draws: winStats.draws || 0,
  };
}

export default db;
