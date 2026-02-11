'use client';

import { Player } from '@/types';
import { cn } from '@/lib/utils/cn';
import { User } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPosition?: boolean;
  labelTone?: 'light' | 'dark';
  onClick?: () => void;
  className?: string;
}

// Helper function to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function PlayerCard({
  player,
  size = 'md',
  showLabel = true,
  showPosition = false,
  labelTone = 'light',
  onClick,
  className,
}: PlayerCardProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const labelSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const initials = getInitials(player.name);
  const labelClasses =
    labelTone === 'dark'
      ? 'text-slate-900 dark:text-slate-100'
      : 'text-white drop-shadow-md';
  const positionClasses =
    labelTone === 'dark'
      ? 'text-slate-600 dark:text-slate-300'
      : 'text-white/80';

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5',
        onClick ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : '',
        className
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white/40 dark:border-white/20 overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:shadow-emerald-500/20 dark:hover:shadow-cyan-500/20',
          sizeClasses[size]
        )}
      >
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          // Futuristic initials design with gradient
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-purple-500 dark:from-emerald-400 dark:via-cyan-400 dark:to-purple-400 flex items-center justify-center text-white">
            <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Labels */}
      {showLabel && (
        <div className="flex flex-col items-center">
          <span className={cn(
            'font-semibold text-center',
            labelClasses,
            labelSizeClasses[size]
          )}>
            {player.name.split(' ')[0]}
          </span>
          {showPosition && (
            <span className={cn('text-xs font-medium', positionClasses, labelSizeClasses[size])}>
              {player.positionPreference}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
