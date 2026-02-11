import { MatchType } from '@/types';

export interface PitchConfig {
  playersPerTeam: number;
  totalSlots: number;
}

export const getPitchConfig = (matchType: MatchType): PitchConfig => {
  const configs: Record<MatchType, PitchConfig> = {
    '5v5': { playersPerTeam: 5, totalSlots: 10 },
    '6v6': { playersPerTeam: 6, totalSlots: 12 },
    '7v7': { playersPerTeam: 7, totalSlots: 14 },
  };
  return configs[matchType];
};

export interface SlotPosition {
  x: number;
  y: number;
  team: 'A' | 'B';
}

export const getSlotPositions = (matchType: MatchType): SlotPosition[] => {
  const positions: SlotPosition[] = [];

  if (matchType === '5v5') {
    // Team A (left) - 1-2-1 formation
    positions.push(
      { x: 12, y: 50, team: 'A' },  // Goalkeeper
      { x: 22, y: 35, team: 'A' },  // Defender 1
      { x: 22, y: 65, team: 'A' },  // Defender 2
      { x: 38, y: 35, team: 'A' },  // Midfielder 1
      { x: 38, y: 65, team: 'A' }   // Midfielder 2
    );
    // Team B (right) - 1-2-1 formation (mirrored)
    positions.push(
      { x: 88, y: 50, team: 'B' },  // Goalkeeper
      { x: 78, y: 35, team: 'B' },  // Defender 1
      { x: 78, y: 65, team: 'B' },  // Defender 2
      { x: 62, y: 35, team: 'B' },  // Midfielder 1
      { x: 62, y: 65, team: 'B' }   // Midfielder 2
    );
  } else if (matchType === '6v6') {
    // Team A (left) - 1-2-2 formation
    positions.push(
      { x: 12, y: 50, team: 'A' },  // Goalkeeper
      { x: 22, y: 30, team: 'A' },  // Defender 1
      { x: 22, y: 70, team: 'A' },  // Defender 2
      { x: 38, y: 30, team: 'A' },  // Midfielder 1
      { x: 38, y: 70, team: 'A' },  // Midfielder 2
      { x: 28, y: 50, team: 'A' }   // Forward
    );
    // Team B (right) - 1-2-2 formation (mirrored)
    positions.push(
      { x: 88, y: 50, team: 'B' },  // Goalkeeper
      { x: 78, y: 30, team: 'B' },  // Defender 1
      { x: 78, y: 70, team: 'B' },  // Defender 2
      { x: 62, y: 30, team: 'B' },  // Midfielder 1
      { x: 62, y: 70, team: 'B' },  // Midfielder 2
      { x: 72, y: 50, team: 'B' }   // Forward
    );
  } else if (matchType === '7v7') {
    // Team A (left) - 1-2-3-1 formation
    positions.push(
      { x: 12, y: 50, team: 'A' },  // Goalkeeper
      { x: 22, y: 25, team: 'A' },  // Defender 1
      { x: 22, y: 75, team: 'A' },  // Defender 2
      { x: 38, y: 30, team: 'A' },  // Midfielder 1
      { x: 38, y: 50, team: 'A' },  // Midfielder 2 (center)
      { x: 38, y: 70, team: 'A' },  // Midfielder 3
      { x: 48, y: 50, team: 'A' }   // Forward
    );
    // Team B (right) - 1-2-3-1 formation (mirrored)
    positions.push(
      { x: 88, y: 50, team: 'B' },  // Goalkeeper
      { x: 78, y: 25, team: 'B' },  // Defender 1
      { x: 78, y: 75, team: 'B' },  // Defender 2
      { x: 62, y: 30, team: 'B' },  // Midfielder 1
      { x: 62, y: 50, team: 'B' },  // Midfielder 2 (center)
      { x: 62, y: 70, team: 'B' },  // Midfielder 3
      { x: 52, y: 50, team: 'B' }   // Forward
    );
  }

  return positions;
};
