export interface Player {
  id: string;
  name: string;
  positionPreference: Position;
  photoUrl: string | null;
  password: string | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Position = 'Forvet' | 'Orta Saha' | 'Defans' | 'Kaleci' | 'Farketmez';

export type MatchType = '5v5' | '6v6' | '7v7';

export interface PitchSlot {
  id: string;
  position: { x: number; y: number };
  player: Player | null;
}

export interface PitchState {
  matchType: MatchType;
  activePlayers: Map<string, Player>;
  playerPool: Player[];
  scheduledAt: string | null;
  isActive: boolean;
  setMatchType: (type: MatchType) => void;
  addPlayerToSlot: (slotId: string, player: Player) => void;
  removePlayerFromSlot: (slotId: string) => void;
  refreshPlayerPool: () => void;
  clearPitch: () => void;
}

export type Team = 'A' | 'B';
