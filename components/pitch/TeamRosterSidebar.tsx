'use client';

import { useState, useMemo } from 'react';
import { Player } from '@/types';
import { PlayerCard } from '@/components/player/PlayerCard';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TeamRosterSidebarProps {
  activePlayers: Map<string, Player>;
  totalSlots: number;
  className?: string;
  isModal?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function TeamRosterSidebar({ activePlayers, totalSlots, className, isModal = false, isOpen: controlledIsOpen, onToggle }: TeamRosterSidebarProps) {
  // Use controlled state if provided, otherwise use local state
  const [localIsOpen, setLocalIsOpen] = useState(!isModal);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
  const setIsOpen = onToggle || setLocalIsOpen;

  // Separate players by team (first half = Team A, second half = Team B)
  const slotsArray = Array.from(activePlayers.entries());
  const teamASlots = slotsArray
    .filter(([slotId]) => slotId.startsWith('slot-'))
    .filter(([slotId]) => {
      const idx = parseInt(slotId.replace('slot-', ''), 10);
      return !Number.isNaN(idx) && idx < totalSlots / 2;
    });
  const teamBSlots = slotsArray
    .filter(([slotId]) => slotId.startsWith('slot-'))
    .filter(([slotId]) => {
      const idx = parseInt(slotId.replace('slot-', ''), 10);
      return !Number.isNaN(idx) && idx >= totalSlots / 2 && idx < totalSlots;
    });

  const teamAPlayers = teamASlots.map(([, player]) => player);
  const teamBPlayers = teamBSlots.map(([, player]) => player);

  const teamAPlayerIds = new Set(teamAPlayers.map(p => p.id));
  const teamBPlayerIds = new Set(teamBPlayers.map(p => p.id));

  // Get bench (extra) players
  const benchPlayers = slotsArray
    .filter(([slotId]) => slotId.startsWith('bench-'))
    .map(([, player]) => player);

  return (
    <>
      {/* Only show the attached toggle button when not controlled externally */}
      {!isModal && !onToggle && (
        /* Toggle Button - only show when not in modal and not controlled externally */
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'absolute -left-12 top-1/2 transform -translate-y-1/2 z-20',
            'w-10 h-24 rounded-l-xl rounded-r-lg shadow-lg',
            'flex flex-col items-center justify-center gap-1',
            'bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-emerald-500/50',
            'hover:from-slate-600 hover:to-slate-700',
            'transition-all duration-300',
            isOpen ? '-translate-x-full left-auto right-0' : 'right-0'
          )}
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-emerald-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-emerald-400" />
          )}
          <Users className="w-5 h-5 text-emerald-400" />
        </button>
      )}

      {/* Sidebar Content */}
      <div
        className={cn(
          isModal ? 'w-full' : 'fixed right-0 top-0 h-screen w-72',
          'transition-all duration-300 ease-in-out overflow-hidden',
          'bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl',
          isModal ? 'border-l-0 border-slate-700/50 rounded-none' : 'border-l border-slate-700/50 shadow-2xl rounded-l-2xl',
          'z-10 overflow-y-auto',
          // Hide on mobile when not modal
          !isModal && 'hidden lg:block',
          isOpen || isModal ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {!isModal && (
          /* Header - only show when not in modal (modal has its own header) */
          <div className="sticky top-0 z-10 p-4 bg-slate-800/95 border-b border-slate-700/50 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Takım Kadroları
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activePlayers.size} / {totalSlots} dolu
            </p>
          </div>
        )}

        <div className="p-4 space-y-6">
          {/* Team A */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/30">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
              <h4 className="text-blue-400 font-semibold">TAKIM A</h4>
              <span className="text-xs text-blue-300 ml-auto">
                {teamAPlayers.length} oyuncu
              </span>
            </div>

            {teamAPlayers.length === 0 ? (
              <div className="text-center py-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">Oyuncu atanmadı</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamAPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 transition-all"
                  >
                    <span className="text-xs text-blue-400 font-mono w-4">A{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{player.name}</p>
                      <p className="text-xs text-slate-400">{player.positionPreference}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team B */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/30">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600"></div>
              <h4 className="text-red-400 font-semibold">TAKIM B</h4>
              <span className="text-xs text-red-300 ml-auto">
                {teamBPlayers.length} oyuncu
              </span>
            </div>

            {teamBPlayers.length === 0 ? (
              <div className="text-center py-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">Oyuncu atanmadı</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamBPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 transition-all"
                  >
                    <span className="text-xs text-red-400 font-mono w-4">B{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{player.name}</p>
                      <p className="text-xs text-slate-400">{player.positionPreference}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bench */}
          {benchPlayers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/30">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"></div>
                <h4 className="text-emerald-400 font-semibold">YEDEKLER</h4>
                <span className="text-xs text-emerald-300 ml-auto">
                  {benchPlayers.length} oyuncu
                </span>
              </div>

              <div className="space-y-2">
                {benchPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/40 transition-all"
                  >
                    <span className="text-xs text-emerald-400 font-mono w-4">Y{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">{player.name}</p>
                      <p className="text-xs text-slate-400">{player.positionPreference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isModal && (
          /* Legend - only show when not in modal */
          <div className="p-4 border-t border-slate-700/50">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Pozisyonlar:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">Forvet</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">Orta Saha</span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Defans</span>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">Kaleci</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
