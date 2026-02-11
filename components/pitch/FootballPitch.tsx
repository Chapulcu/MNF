'use client';

import { MatchType, Player } from '@/types';
import { PitchSlot } from './PitchSlot';
import { getSlotPositions, getPitchConfig } from '@/lib/utils/pitch-layout';
import { cn } from '@/lib/utils/cn';
import type { Formation } from './FormationDiagram';
import { useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Search } from 'lucide-react';

interface FootballPitchProps {
  matchType: MatchType;
  activePlayers: Map<string, Player>;
  onSlotClick: (slotId: string) => void;
  onPlayerMove?: (fromSlotId: string, toSlotId: string) => void;
  teamAFormation?: Formation | null;
  teamBFormation?: Formation | null;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function FootballPitch({
  matchType,
  activePlayers,
  onSlotClick,
  onPlayerMove,
  teamAFormation = null,
  teamBFormation = null,
  orientation = 'horizontal',
  className,
}: FootballPitchProps) {
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [playerZoom, setPlayerZoom] = useState(1);

  // Load zoom preference from localStorage
  useEffect(() => {
    const savedZoom = localStorage.getItem('playerZoom');
    if (savedZoom) {
      setPlayerZoom(parseInt(savedZoom, 10));
    }
  }, []);

  // Save zoom preference to localStorage
  useEffect(() => {
    localStorage.setItem('playerZoom', playerZoom.toString());
  }, [playerZoom]);

  const positions = getSlotPositions(matchType);
  const config = getPitchConfig(matchType);

  // Determine aspect ratio based on orientation
  const aspectRatio = orientation === 'horizontal' ? '3/2' : '2/3';

  // Mirror X position for Team B (they play from right to left)
  const getMirroredX = (x: number) => 100 - x;

  // Determine slot positions based on formations
  const getSlotPositionsFromFormations = () => {
    if (!teamAFormation || !teamBFormation) {
      return positions;
    }

    const teamAPositions = teamAFormation.positions;
    const teamBPositions = teamBFormation.positions;

    // Calculate how many players per team based on match type
    const playersPerTeam = config.totalSlots / 2;

    // Combine both team positions
    const formationSlots: Array<{ x: number; y: number; team: 'A' | 'B' }> = [];

    // Add Team A positions (left side, attacking right)
    teamAPositions.slice(0, playersPerTeam).forEach((pos) => {
      formationSlots.push({ x: pos.x, y: pos.y, team: 'A' });
    });

    // Add Team B positions (right side, mirrored, attacking left)
    teamBPositions.slice(0, playersPerTeam).forEach((pos) => {
      formationSlots.push({ x: getMirroredX(pos.x), y: pos.y, team: 'B' });
    });

    return formationSlots;
  };

  const currentPositions = getSlotPositionsFromFormations();
  const hasFormation = teamAFormation && teamBFormation;

  // Drag and drop handlers
  const handleDragStart = useCallback((slotId: string) => {
    setDraggedSlotId(slotId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSlotId(null);
    setDragOverSlotId(null);
  }, []);

  const handleDragOver = useCallback((slotId: string) => {
    if (draggedSlotId && draggedSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  }, [draggedSlotId]);

  const handleDragLeave = useCallback(() => {
    setDragOverSlotId(null);
  }, []);

  const handleDrop = useCallback((slotId: string) => {
    if (draggedSlotId && draggedSlotId !== slotId && onPlayerMove) {
      onPlayerMove(draggedSlotId, slotId);
    }
    setDraggedSlotId(null);
    setDragOverSlotId(null);
  }, [draggedSlotId, onPlayerMove]);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Pitch Container */}
      <div
        className={cn(
          'relative rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden w-full',
          'border-2 sm:border-4 border-emerald-400/80'
        )}
        style={{
          aspectRatio: aspectRatio,
          background: 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)',
        }}
      >
        {/* Grass texture effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.03) 40px,
              rgba(255,255,255,0.03) 80px
            )`
          }}
        />

        {/* Outer boundary lines */}
        <div className="absolute inset-2 sm:inset-4 border-2 border-white/70 rounded-lg pointer-events-none" />

        {/* Center Line - vertical for horizontal pitch, horizontal for vertical pitch */}
        {orientation === 'horizontal' ? (
          <div className="absolute left-1/2 top-2 sm:top-4 bottom-2 sm:bottom-4 w-0.5 bg-white/70 transform -translate-x-1/2 pointer-events-none" />
        ) : (
          <div className="absolute left-2 sm:left-4 right-2 sm:right-4 top-1/2 h-0.5 bg-white/70 transform -translate-y-1/2 pointer-events-none" />
        )}

        {/* Center Circle */}
        <div className="absolute left-1/2 top-1/2 w-12 h-12 sm:w-20 sm:h-20 border-2 border-white/70 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/80 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Center spot */}
        <div className="absolute left-1/2 top-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg pointer-events-none" />

        {/* Penalty Areas and Goals - positioning based on orientation */}
        {orientation === 'horizontal' ? (
          <>
            {/* Horizontal: Left/Right penalty areas */}
            {/* Left Penalty Area (Team A defends) */}
            <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-10 h-24 sm:w-16 sm:h-36 border-2 border-l-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute left-10 sm:left-16 top-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full transform -translate-y-1/2 shadow-md pointer-events-none" />
            <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-6 h-10 sm:w-8 sm:h-16 border-2 border-l-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-10 sm:h-14 w-1 sm:w-1.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-r-md border border-white/50 border-l-0 shadow-lg pointer-events-none" />

            {/* Right Penalty Area (Team B defends) */}
            <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-10 h-24 sm:w-16 sm:h-36 border-2 border-r-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute right-10 sm:right-16 top-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full transform -translate-y-1/2 shadow-md pointer-events-none" />
            <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-6 h-10 sm:w-8 sm:h-16 border-2 border-r-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 sm:h-14 w-1 sm:w-1.5 bg-gradient-to-l from-gray-300 to-gray-400 rounded-l-md border border-white/50 border-r-0 shadow-lg pointer-events-none" />
          </>
        ) : (
          <>
            {/* Vertical: Top/Bottom penalty areas */}
            {/* Top Penalty Area (Team A defends) */}
            <div className="absolute left-1/2 top-2 sm:top-4 transform -translate-x-1/2 h-10 w-24 sm:h-16 sm:w-36 border-2 border-t-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute left-1/2 top-10 sm:top-16 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full transform -translate-x-1/2 shadow-md pointer-events-none" />
            <div className="absolute left-1/2 top-2 sm:top-4 transform -translate-x-1/2 h-6 w-10 sm:h-8 sm:w-16 border-2 border-t-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-10 sm:w-14 h-1 sm:h-1.5 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-md border border-white/50 border-t-0 shadow-lg pointer-events-none" />

            {/* Bottom Penalty Area (Team B defends) */}
            <div className="absolute left-1/2 bottom-2 sm:bottom-4 transform -translate-x-1/2 h-10 w-24 sm:h-16 sm:w-36 border-2 border-b-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute left-1/2 bottom-10 sm:bottom-16 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white rounded-full transform -translate-x-1/2 shadow-md pointer-events-none" />
            <div className="absolute left-1/2 bottom-2 sm:bottom-4 transform -translate-x-1/2 h-6 w-10 sm:h-8 sm:w-16 border-2 border-b-0 border-white/60 pointer-events-none rounded-sm" />
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 w-10 sm:w-14 h-1 sm:h-1.5 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-md border border-white/50 border-b-0 shadow-lg pointer-events-none" />
          </>
        )}

        {/* Corner Arcs - Quarter circles drawn INSIDE the pitch */}
        <svg className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none" viewBox="0 0 64 64">
          <path d="M 16 0 A 16 16 0 0 0 0 16" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" />
        </svg>
        <svg className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none" viewBox="0 0 64 64">
          <path d="M 48 0 A 16 16 0 0 1 64 16" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none" viewBox="0 0 64 64">
          <path d="M 16 64 A 16 16 0 0 1 0 48" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none" viewBox="0 0 64 64">
          <path d="M 48 64 A 16 16 0 0 0 64 48" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" />
        </svg>

        {/* Team Labels - Modern glassmorphic badges */}
        {orientation === 'horizontal' ? (
          <>
            <div className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2">
              <div className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm border border-blue-400/50 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold shadow-lg">
                TAKIM A
              </div>
            </div>
            <div className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2">
              <div className="bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm border border-red-400/50 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold shadow-lg">
                TAKIM B
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute left-3 sm:left-6 top-6 sm:top-12 transform">
              <div className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm border border-blue-400/50 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold shadow-lg">
                TAKIM A
              </div>
            </div>
            <div className="absolute left-3 sm:left-6 bottom-6 sm:bottom-12 transform">
              <div className="bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm border border-red-400/50 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold shadow-lg">
                TAKIM B
              </div>
            </div>
          </>
        )}

        {/* Match Type Badge - Modern pill design */}
        <div className="absolute top-2 sm:top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-2 border-emerald-500/30 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
            {matchType}
          </div>
        </div>

        {/* Formation Applied Badge */}
        {hasFormation && (
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/50 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
              <span className="hidden sm:inline">{teamAFormation?.name.split(' ')[0]} vs {teamBFormation?.name.split(' ')[0]}</span>
              <span className="sm:hidden">{teamAFormation?.name.split(' ')[0]} vs {teamBFormation?.name.split(' ')[0]}</span>
            </div>
          </div>
        )}

        {/* Player Zoom Controls */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1.5 sm:gap-2 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-300 dark:border-white/20 rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setPlayerZoom(Math.max(1, playerZoom - 1))}
          disabled={playerZoom <= 1}
          className="p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
          title="Küçült"
        >
          <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-200" />
        </button>
        <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 rounded-lg">
          <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          <span className="text-sm sm:text-base font-bold text-white">{playerZoom}</span>
        </div>
        <button
          onClick={() => setPlayerZoom(Math.min(5, playerZoom + 1))}
          disabled={playerZoom >= 5}
          className="p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
          title="Büyült"
        >
          <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-200" />
        </button>
          </div>
        </div>

        {/* Player Slots */}
        {currentPositions.slice(0, config.totalSlots).map((pos, index) => {
          const slotId = `slot-${index}`;
          const player = activePlayers.get(slotId) || null;
          // Use team from formation positions if available, otherwise from default positions
          const team = hasFormation && 'team' in pos ? pos.team : (positions[index]?.team || 'A');

          // Swap coordinates for vertical orientation
          const slotX = orientation === 'vertical' ? pos.y : pos.x;
          const slotY = orientation === 'vertical' ? pos.x : pos.y;

          const isDragOver = dragOverSlotId === slotId;
          const isDragging = draggedSlotId === slotId;

          return (
            <div
              key={slotId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${slotX}%`,
                top: `${slotY}%`,
              }}
            >
              <PitchSlot
                id={slotId}
                player={player}
                team={team}
                onClick={() => onSlotClick(slotId)}
                isEmpty={!player}
                isDraggable={!!player && !!onPlayerMove}
                isDragOver={isDragOver}
                zoomLevel={playerZoom}
                onDragStart={() => handleDragStart(slotId)}
                onDragEnd={handleDragEnd}
                onDragOver={() => handleDragOver(slotId)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(slotId)}
              />
            </div>
          );
        })}

        {/* Responsive overlay for very small screens to ensure touch targets */}
        <div className="absolute inset-0 pointer-events-none sm:hidden" style={{ background: 'transparent' }} />
      </div>
    </div>
  );
}
