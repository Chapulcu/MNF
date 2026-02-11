'use client';

import { Player } from '@/types';
import { PlayerCard } from '@/components/player/PlayerCard';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

interface PitchSlotProps {
  id: string;
  player: Player | null;
  team: 'A' | 'B';
  onClick: () => void;
  isEmpty: boolean;
  className?: string;
  isDraggable?: boolean;
  isDragOver?: boolean;
  zoomLevel?: number;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function PitchSlot({
  id,
  player,
  team,
  onClick,
  isEmpty,
  className,
  isDraggable = false,
  isDragOver = false,
  zoomLevel = 1,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PitchSlotProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Calculate scale based on zoom level (1-5)
  // 1 = 1x (original), 2 = 1.2x, 3 = 1.4x, 4 = 1.6x, 5 = 1.8x
  const getScale = (level: number) => {
    const scales = { 1: 1, 2: 1.2, 3: 1.4, 4: 1.6, 5: 1.8 };
    return scales[level as keyof typeof scales] || 1;
  };

  const scale = getScale(zoomLevel);

  const teamColor = team === 'A'
    ? 'bg-blue-500/20 border-blue-400/60 hover:bg-blue-500/30 hover:border-blue-400/80'
    : 'bg-red-500/20 border-red-400/60 hover:bg-red-500/30 hover:border-red-400/80';

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('slotId', id);
    if (player) {
      e.dataTransfer.setData('playerId', player.id);
      e.dataTransfer.setData('playerName', player.name);
    }
    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(e);
  };

  return (
    <button
      onClick={onClick}
      draggable={!isEmpty && isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center transition-all duration-300',
        'cursor-pointer hover:scale-110 active:scale-95',
        'min-w-[44px] min-h-[44px]', // Ensure minimum touch target size
        isDraggable && !isEmpty && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 scale-95',
        isDragOver && isEmpty && 'scale-125 ring-4 ring-emerald-400/50',
        className
      )}
    >
      {isEmpty ? (
        <div className={cn(
          'w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm',
          teamColor,
          isDragOver && 'bg-emerald-500/30 border-emerald-400 animate-pulse'
        )}>
          {isDragOver ? (
            <span className="text-2xl">⬇️</span>
          ) : (
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" strokeWidth={2.5} />
          )}
        </div>
      ) : (
        <div className="relative" style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-in-out' }}>
          {/* Drag indicator */}
          {isDraggable && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-white">
              <span className="text-xs text-white">⋮⋮</span>
            </div>
          )}

          {/* Team color glow effect */}
          <div className={cn(
            'absolute inset-0 rounded-2xl blur-md opacity-50',
            team === 'A' ? 'bg-blue-500' : 'bg-red-500'
          )} style={{ transform: 'scale(1.2)' }} />

          {/* Team color ring */}
          <div className={cn(
            'absolute inset-0 rounded-2xl opacity-60',
            team === 'A' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-red-400 to-red-600'
          )} style={{ transform: 'scale(1.15)', padding: '3px' }} />

          <PlayerCard player={player!} size="md" showLabel={false} className="sm:hidden" />
          <PlayerCard player={player!} size="lg" showLabel={false} className="hidden sm:block" />
        </div>
      )}
    </button>
  );
}
