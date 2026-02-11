'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Player, MatchType, PitchState as LocalPitchState } from '@/types';
import { getAllPlayers as fetchAllPlayers } from '@/lib/api/players';
import { getPitchState as fetchPitchState, updatePitchState as syncPitchState, clearPitchState as clearPitchStateAPI, ActivePlayerSlot } from '@/lib/api/pitchState';
import { getPitchConfig } from '@/lib/utils/pitch-layout';

export function usePitchState(): LocalPitchState & { benchPlayers: Player[] } {
  const [matchType, setMatchType] = useState<MatchType>('5v5');
  const [activePlayers, setActivePlayers] = useState<Map<string, Player>>(new Map());
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [playerPositions, setPlayerPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [loading, setLoading] = useState(true);
  const lastSyncTime = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [players, pitchState] = await Promise.all([
        fetchAllPlayers(),
        fetchPitchState(),
      ]);

      setPlayerPool(players);
      lastSyncTime.current = pitchState.updatedAt;

      // Build active players map from server state
      const activeMap = new Map<string, Player>();
      const playerMap = new Map(players.map(p => [p.id, p]));

      for (const slot of pitchState.activePlayers) {
        const player = playerMap.get(slot.playerId);
        if (player) {
          activeMap.set(slot.slotId, player);
        }
      }

      setActivePlayers(activeMap);
      setMatchType(pitchState.matchType as MatchType);
      setScheduledAt(pitchState.scheduledAt || null);
      setIsActive(!!pitchState.isActive);
      setPlayerPositions(pitchState.playerPositions || {});
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromServer = useCallback(async () => {
    try {
      const pitchState = await fetchPitchState();

      // Only update if server has newer data
      if (pitchState.updatedAt > lastSyncTime.current) {
        lastSyncTime.current = pitchState.updatedAt;

        const playerMap = new Map(playerPool.map(p => [p.id, p]));
        const activeMap = new Map<string, Player>();

        for (const slot of pitchState.activePlayers) {
          const player = playerMap.get(slot.playerId);
          if (player) {
            activeMap.set(slot.slotId, player);
          }
        }

        setActivePlayers(activeMap);
        setMatchType(pitchState.matchType as MatchType);
        setScheduledAt(pitchState.scheduledAt || null);
        setIsActive(!!pitchState.isActive);
        setPlayerPositions(pitchState.playerPositions || {});
      }
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }, [playerPool]);

  // Load player pool and pitch state from API on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for changes from other devices every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await syncFromServer();
    }, 3000);

    return () => clearInterval(interval);
  }, [syncFromServer]);

  const syncToServer = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const activeSlots: ActivePlayerSlot[] = Array.from(activePlayers.entries()).map(
          ([slotId, player]) => ({ slotId, playerId: player.id })
        );

        const result = await syncPitchState({
          activePlayers: activeSlots,
          matchType,
          playerPositions,
        });

        lastSyncTime.current = result.updatedAt;
      } catch (error) {
        console.error('Failed to sync to server:', error);
      }
    }, 300); // Debounce sync by 300ms
  }, [activePlayers, matchType, playerPositions]);

  const loadPlayerPool = async () => {
    try {
      const players = await fetchAllPlayers();
      setPlayerPool(players);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const refreshPlayerPool = () => {
    loadPlayerPool();
  };

  const addPlayerToSlot = useCallback((slotId: string, player: Player) => {
    setActivePlayers((prev) => {
      const newMap = new Map(prev);
      newMap.set(slotId, player);
      return newMap;
    });
  }, []);

  const removePlayerFromSlot = useCallback((slotId: string) => {
    setActivePlayers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(slotId);
      return newMap;
    });
  }, []);

  const setPlayerPosition = useCallback((playerId: string, position: { x: number; y: number }) => {
    setPlayerPositions((prev) => ({
      ...prev,
      [playerId]: position,
    }));
  }, []);

  const clearPitch = useCallback(async () => {
    try {
      await clearPitchStateAPI();
      setActivePlayers(new Map());
      setPlayerPositions({});
      lastSyncTime.current = new Date().toISOString();
    } catch (error) {
      console.error('Failed to clear pitch:', error);
    }
  }, []);

  // Sync to server whenever active players or match type changes
  useEffect(() => {
    if (!loading) {
      syncToServer();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [activePlayers, matchType, playerPositions, loading, syncToServer]);

  // Calculate bench players (players on pitch beyond capacity)
  const config = getPitchConfig(matchType);
  const pitchPlayerIds = Array.from(activePlayers.entries())
    .slice(0, config.totalSlots)
    .map(([, player]) => player.id);

  const benchPlayers = Array.from(activePlayers.entries())
    .filter(([slotId]) => slotId.startsWith('bench-'))
    .map(([, player]) => player);

  return {
    matchType,
    setMatchType,
    activePlayers,
    playerPool,
    scheduledAt,
    isActive,
    playerPositions,
    addPlayerToSlot,
    removePlayerFromSlot,
    setPlayerPosition,
    refreshPlayerPool,
    clearPitch,
    benchPlayers,
  };
}
