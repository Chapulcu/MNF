import { supabase } from '@/lib/supabase/client';

export interface AppSettings {
  maxPlayers: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  maxPlayers: 50,
};

/**
 * Get all application settings
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase()
      .from('settings')
      .select('key, value');

    if (error) throw error;

    const settings: AppSettings = { ...DEFAULT_SETTINGS };

    if (data) {
      data.forEach((item) => {
        if (item.key === 'max_players') {
          settings.maxPlayers = Number(item.value) || DEFAULT_SETTINGS.maxPlayers;
        }
      });
    }

    return settings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get max players limit
 */
export async function getMaxPlayers(): Promise<number> {
  const settings = await getSettings();
  return settings.maxPlayers;
}

/**
 * Update max players limit
 */
export async function updateMaxPlayers(maxPlayers: number): Promise<void> {
  try {
    const { error } = await supabase()
      .from('settings')
      .update({
        value: maxPlayers,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'max_players');

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update max players:', error);
    throw error;
  }
}

/**
 * Get current player count
 */
export async function getPlayerCount(): Promise<number> {
  try {
    const { count, error } = await supabase()
      .from('players')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get player count:', error);
    return 0;
  }
}

/**
 * Check if max players limit has been reached
 */
export async function isMaxPlayersReached(): Promise<boolean> {
  const [maxPlayers, currentCount] = await Promise.all([
    getMaxPlayers(),
    getPlayerCount()
  ]);

  return currentCount >= maxPlayers;
}
