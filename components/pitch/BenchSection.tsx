'use client';

import { MatchType, Player } from '@/types';
import { PlayerCard } from '@/components/player/PlayerCard';
import { GlassCard } from '@/components/ui/GlassCard';

interface BenchSectionProps {
  matchType: MatchType;
  activePlayers: Map<string, Player>;
  onSlotClick: (slotId: string) => void;
}

const benchCounts: Record<MatchType, number> = {
  '5v5': 3,
  '6v6': 4,
  '7v7': 5,
};

function buildBenchSlots(team: 'A' | 'B', matchType: MatchType) {
  const count = benchCounts[matchType];
  return Array.from({ length: count }, (_, i) => `bench-${team}-${i + 1}`);
}

export function BenchSection({ matchType, activePlayers, onSlotClick }: BenchSectionProps) {
  const benchSlotsA = buildBenchSlots('A', matchType);
  const benchSlotsB = buildBenchSlots('B', matchType);

  return (
    <GlassCard className="mt-6 p-4 bg-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Yedekler</h3>
        <div className="text-xs text-white/70">Takım başına {benchCounts[matchType]} slot</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
            <span className="text-sm font-semibold text-blue-200">TAKIM A</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {benchSlotsA.map((slotId) => {
              const player = activePlayers.get(slotId);
              return (
                <button
                  key={slotId}
                  onClick={() => onSlotClick(slotId)}
                  className={`rounded-xl border border-dashed p-2 flex flex-col items-center justify-center text-center transition-all ${
                    player
                      ? 'border-blue-400/60 bg-blue-500/10 hover:bg-blue-500/20'
                      : 'border-blue-200/40 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {player ? (
                    <>
                      <PlayerCard player={player} size="sm" showLabel={false} />
                      <span className="mt-1 text-[10px] text-blue-100 truncate max-w-[72px]">{player.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-blue-200/80">Boş</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600" />
            <span className="text-sm font-semibold text-red-200">TAKIM B</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {benchSlotsB.map((slotId) => {
              const player = activePlayers.get(slotId);
              return (
                <button
                  key={slotId}
                  onClick={() => onSlotClick(slotId)}
                  className={`rounded-xl border border-dashed p-2 flex flex-col items-center justify-center text-center transition-all ${
                    player
                      ? 'border-red-400/60 bg-red-500/10 hover:bg-red-500/20'
                      : 'border-red-200/40 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {player ? (
                    <>
                      <PlayerCard player={player} size="sm" showLabel={false} />
                      <span className="mt-1 text-[10px] text-red-100 truncate max-w-[72px]">{player.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-red-200/80">Boş</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
