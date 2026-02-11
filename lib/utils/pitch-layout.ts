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
    '8v8': { playersPerTeam: 8, totalSlots: 16 },
    '9v9': { playersPerTeam: 9, totalSlots: 18 },
    '10v10': { playersPerTeam: 10, totalSlots: 20 },
    '11v11': { playersPerTeam: 11, totalSlots: 22 },
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
  } else if (matchType === '8v8') {
    // Team A (left) - 1-3-3-1 formation
    positions.push(
      { x: 10, y: 50, team: 'A' },  // Goalkeeper
      { x: 20, y: 25, team: 'A' },  // Defender 1
      { x: 20, y: 50, team: 'A' },  // Defender 2
      { x: 20, y: 75, team: 'A' },  // Defender 3
      { x: 40, y: 25, team: 'A' },  // Midfielder 1
      { x: 40, y: 50, team: 'A' },  // Midfielder 2
      { x: 40, y: 75, team: 'A' },  // Midfielder 3
      { x: 60, y: 50, team: 'A' }   // Forward
    );
    // Team B (right) - 1-3-3-1 formation (mirrored)
    positions.push(
      { x: 90, y: 50, team: 'B' },  // Goalkeeper
      { x: 80, y: 25, team: 'B' },  // Defender 1
      { x: 80, y: 50, team: 'B' },  // Defender 2
      { x: 80, y: 75, team: 'B' },  // Defender 3
      { x: 60, y: 25, team: 'B' },  // Midfielder 1
      { x: 60, y: 50, team: 'B' },  // Midfielder 2
      { x: 60, y: 75, team: 'B' },  // Midfielder 3
      { x: 40, y: 50, team: 'B' }   // Forward
    );
  } else if (matchType === '9v9') {
    // Team A (left) - 1-3-3-2 formation
    positions.push(
      { x: 9, y: 50, team: 'A' },   // Goalkeeper
      { x: 18, y: 25, team: 'A' },  // Defender 1
      { x: 18, y: 50, team: 'A' },  // Defender 2
      { x: 18, y: 75, team: 'A' },  // Defender 3
      { x: 38, y: 25, team: 'A' },  // Midfielder 1
      { x: 38, y: 50, team: 'A' },  // Midfielder 2
      { x: 38, y: 75, team: 'A' },  // Midfielder 3
      { x: 60, y: 35, team: 'A' },  // Forward 1
      { x: 60, y: 65, team: 'A' }   // Forward 2
    );
    // Team B (right) - 1-3-3-2 formation (mirrored)
    positions.push(
      { x: 91, y: 50, team: 'B' },  // Goalkeeper
      { x: 82, y: 25, team: 'B' },  // Defender 1
      { x: 82, y: 50, team: 'B' },  // Defender 2
      { x: 82, y: 75, team: 'B' },  // Defender 3
      { x: 62, y: 25, team: 'B' },  // Midfielder 1
      { x: 62, y: 50, team: 'B' },  // Midfielder 2
      { x: 62, y: 75, team: 'B' },  // Midfielder 3
      { x: 40, y: 35, team: 'B' },  // Forward 1
      { x: 40, y: 65, team: 'B' }   // Forward 2
    );
  } else if (matchType === '10v10') {
    // Team A (left) - 1-4-3-2 formation
    positions.push(
      { x: 8, y: 50, team: 'A' },   // Goalkeeper
      { x: 18, y: 20, team: 'A' },  // Defender 1
      { x: 18, y: 40, team: 'A' },  // Defender 2
      { x: 18, y: 60, team: 'A' },  // Defender 3
      { x: 18, y: 80, team: 'A' },  // Defender 4
      { x: 38, y: 25, team: 'A' },  // Midfielder 1
      { x: 38, y: 50, team: 'A' },  // Midfielder 2
      { x: 38, y: 75, team: 'A' },  // Midfielder 3
      { x: 62, y: 35, team: 'A' },  // Forward 1
      { x: 62, y: 65, team: 'A' }   // Forward 2
    );
    // Team B (right) - 1-4-3-2 formation (mirrored)
    positions.push(
      { x: 92, y: 50, team: 'B' },  // Goalkeeper
      { x: 82, y: 20, team: 'B' },  // Defender 1
      { x: 82, y: 40, team: 'B' },  // Defender 2
      { x: 82, y: 60, team: 'B' },  // Defender 3
      { x: 82, y: 80, team: 'B' },  // Defender 4
      { x: 62, y: 25, team: 'B' },  // Midfielder 1
      { x: 62, y: 50, team: 'B' },  // Midfielder 2
      { x: 62, y: 75, team: 'B' },  // Midfielder 3
      { x: 38, y: 35, team: 'B' },  // Forward 1
      { x: 38, y: 65, team: 'B' }   // Forward 2
    );
  } else if (matchType === '11v11') {
    // Team A (left) - 1-4-3-3 formation
    positions.push(
      { x: 7, y: 50, team: 'A' },   // Goalkeeper
      { x: 17, y: 20, team: 'A' },  // Defender 1
      { x: 17, y: 40, team: 'A' },  // Defender 2
      { x: 17, y: 60, team: 'A' },  // Defender 3
      { x: 17, y: 80, team: 'A' },  // Defender 4
      { x: 35, y: 25, team: 'A' },  // Midfielder 1
      { x: 35, y: 50, team: 'A' },  // Midfielder 2
      { x: 35, y: 75, team: 'A' },  // Midfielder 3
      { x: 60, y: 25, team: 'A' },  // Forward 1
      { x: 60, y: 50, team: 'A' },  // Forward 2
      { x: 60, y: 75, team: 'A' }   // Forward 3
    );
    // Team B (right) - 1-4-3-3 formation (mirrored)
    positions.push(
      { x: 93, y: 50, team: 'B' },  // Goalkeeper
      { x: 83, y: 20, team: 'B' },  // Defender 1
      { x: 83, y: 40, team: 'B' },  // Defender 2
      { x: 83, y: 60, team: 'B' },  // Defender 3
      { x: 83, y: 80, team: 'B' },  // Defender 4
      { x: 65, y: 25, team: 'B' },  // Midfielder 1
      { x: 65, y: 50, team: 'B' },  // Midfielder 2
      { x: 65, y: 75, team: 'B' },  // Midfielder 3
      { x: 40, y: 25, team: 'B' },  // Forward 1
      { x: 40, y: 50, team: 'B' },  // Forward 2
      { x: 40, y: 75, team: 'B' }   // Forward 3
    );
  }

  return positions;
};
