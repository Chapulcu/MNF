const API_BASE = '/api';

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

export interface GoalWithPlayer extends Goal {
  playerName: string;
}

export interface MatchWithGoals extends Match {
  goals: GoalWithPlayer[];
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

export interface MatchStats {
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
}

export interface StatsResponse {
  players: PlayerStats[];
  matches: MatchStats;
}

// Match operations
export async function getAllMatches(): Promise<MatchWithGoals[]> {
  const response = await fetch(`${API_BASE}/matches`);
  if (!response.ok) {
    throw new Error('Failed to fetch matches');
  }
  return response.json();
}

export async function getMatch(id: string): Promise<MatchWithGoals> {
  const response = await fetch(`${API_BASE}/matches/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch match');
  }
  return response.json();
}

export async function createMatch(match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
  const response = await fetch(`${API_BASE}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(match),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create match');
  }

  return response.json();
}

export async function updateMatch(id: string, updates: Partial<Omit<Match, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Match> {
  const response = await fetch(`${API_BASE}/matches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update match');
  }

  return response.json();
}

export async function deleteMatch(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/matches/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete match');
  }
}

// Goal operations
export async function addGoal(matchId: string, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
  const response = await fetch(`${API_BASE}/matches/${matchId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add goal');
  }

  return response.json();
}

export async function updateGoal(goalId: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Goal> {
  const response = await fetch(`${API_BASE}/goals/${goalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update goal');
  }

  return response.json();
}

export async function deleteGoal(goalId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/goals/${goalId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete goal');
  }
}

// Stats operations
export async function getStats(playerId?: string): Promise<StatsResponse | PlayerStats> {
  const url = playerId ? `${API_BASE}/stats?playerId=${playerId}` : `${API_BASE}/stats`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}
