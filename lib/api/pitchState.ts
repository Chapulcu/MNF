export interface ActivePlayerSlot {
  slotId: string;
  playerId: string;
}

export interface PitchState {
  matchType: string;
  activePlayers: ActivePlayerSlot[];
  teamAFormation: string | null;
  teamBFormation: string | null;
  scheduledAt: string | null;
  isActive: boolean;
  updatedAt: string;
}

const API_BASE = '/api';

export async function getPitchState(): Promise<PitchState> {
  const response = await fetch(`${API_BASE}/pitch-state`);
  if (!response.ok) {
    throw new Error('Failed to fetch pitch state');
  }
  return response.json();
}

export async function updatePitchState(state: {
  matchType?: string;
  activePlayers?: ActivePlayerSlot[];
  teamAFormation?: string | null;
  teamBFormation?: string | null;
  scheduledAt?: string | null;
  isActive?: boolean;
}): Promise<PitchState> {
  const response = await fetch(`${API_BASE}/pitch-state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    throw new Error('Failed to update pitch state');
  }

  return response.json();
}

export async function clearPitchState(): Promise<PitchState> {
  const response = await fetch(`${API_BASE}/pitch-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear' }),
  });

  if (!response.ok) {
    throw new Error('Failed to clear pitch state');
  }

  return response.json();
}
