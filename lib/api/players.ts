import { Player } from '@/types';

const API_BASE = '/api';

export async function getAllPlayers(): Promise<Player[]> {
  const response = await fetch(`${API_BASE}/players`);
  if (!response.ok) {
    throw new Error('Failed to fetch players');
  }
  return response.json();
}

export async function getPlayerById(id: string): Promise<Player> {
  const response = await fetch(`${API_BASE}/players/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch player');
  }
  return response.json();
}

export async function createPlayer(
  player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Player> {
  const response = await fetch(`${API_BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create player');
  }

  return response.json();
}

export async function updatePlayer(
  id: string,
  player: Partial<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Player> {
  const response = await fetch(`${API_BASE}/players/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  });

  if (!response.ok) {
    throw new Error('Failed to update player');
  }

  return response.json();
}

export async function deletePlayer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/players/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete player');
  }
}
