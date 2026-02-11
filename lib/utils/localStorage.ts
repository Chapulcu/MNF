import { Player } from '@/types';

const PLAYERS_STORAGE_KEY = 'mnf_players';

// Get all players from localStorage
export function getAllPlayersFromStorage(): Player[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!data) return [];

    const players = JSON.parse(data);
    // Convert date strings back to Date objects
    return players.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load players from localStorage:', error);
    return [];
  }
}

// Save all players to localStorage
export function savePlayersToStorage(players: Player[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch (error) {
    console.error('Failed to save players to localStorage:', error);
  }
}

// Add a new player
export function addPlayerToStorage(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Player {
  const players = getAllPlayersFromStorage();

  const newPlayer: Player = {
    ...player,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  players.push(newPlayer);
  savePlayersToStorage(players);

  return newPlayer;
}

// Update an existing player
export function updatePlayerInStorage(id: string, updates: Partial<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>): Player {
  const players = getAllPlayersFromStorage();
  const index = players.findIndex(p => p.id === id);

  if (index === -1) {
    throw new Error('Player not found');
  }

  const updatedPlayer: Player = {
    ...players[index],
    ...updates,
    updatedAt: new Date(),
  };

  players[index] = updatedPlayer;
  savePlayersToStorage(players);

  return updatedPlayer;
}

// Delete a player
export function deletePlayerFromStorage(id: string): void {
  const players = getAllPlayersFromStorage();
  const filteredPlayers = players.filter(p => p.id !== id);
  savePlayersToStorage(filteredPlayers);
}

// Get player by ID
export function getPlayerByIdFromStorage(id: string): Player | null {
  const players = getAllPlayersFromStorage();
  return players.find(p => p.id === id) || null;
}
