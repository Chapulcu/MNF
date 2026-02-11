import { supabase } from '@/lib/supabase/client';
import { Player } from '@/types';
import { getMaxPlayers, getPlayerCount } from './settings';

export class MaxPlayersError extends Error {
  constructor(maxPlayers: number) {
    super(`Maksimum oyuncu sayısı (${maxPlayers})e ulaşıldı.`);
    this.name = 'MaxPlayersError';
  }
}

export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase()
    .from('players')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  })) as Player[];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase()
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } as Player;
}

export async function createPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
  // Check max players limit
  const [maxPlayers, currentCount] = await Promise.all([
    getMaxPlayers(),
    getPlayerCount()
  ]);

  if (currentCount >= maxPlayers) {
    throw new MaxPlayersError(maxPlayers);
  }

  const { data, error } = await supabase()
    .from('players')
    .insert({
      name: player.name,
      position_preference: player.positionPreference,
      photo_url: player.photoUrl,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } as Player;
}

export async function updatePlayer(id: string, player: Partial<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Player> {
  const updateData: any = {};
  if (player.name !== undefined) updateData.name = player.name;
  if (player.positionPreference !== undefined) updateData.position_preference = player.positionPreference;
  if (player.photoUrl !== undefined) updateData.photo_url = player.photoUrl;

  const { data, error } = await supabase()
    .from('players')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } as Player;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase()
    .from('players')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
