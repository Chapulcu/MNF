'use client';

import { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface PlayerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlayers: Player[];
  onSelectPlayer: (player: Player) => void;
}

export function PlayerSelectorModal({
  isOpen,
  onClose,
  availablePlayers,
  onSelectPlayer,
}: PlayerSelectorModalProps) {
  const { isAuthenticated, currentPlayer, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Filter players: non-admin users can only select themselves
  const selectablePlayers = useMemo(() => {
    if (isAuthenticated && currentPlayer && !isAdmin) {
      // Only show the current user
      return availablePlayers.filter(p => p.id === currentPlayer.id);
    }
    // Admin or not logged in - show all available players
    return availablePlayers;
  }, [availablePlayers, isAuthenticated, currentPlayer, isAdmin]);

  const filteredPlayers = useMemo(() => {
    return selectablePlayers.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition =
        positionFilter === 'all' || player.positionPreference === positionFilter;
      return matchesSearch && matchesPosition;
    });
  }, [selectablePlayers, searchQuery, positionFilter]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isAuthenticated && currentPlayer && !isAdmin ? "Kendinizi Seçin" : "Oyuncu Seç"}>
      <div className="space-y-4">
        {isAuthenticated && currentPlayer && !isAdmin && (
          <Alert variant="info">
            Sadece kendi adınıza slot seçebilirsiniz.
          </Alert>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="İsim ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Position Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPositionFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              positionFilter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tümü
          </button>
          {['Forvet', 'Orta Saha', 'Defans', 'Kaleci', 'Farketmez'].map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                positionFilter === pos
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Players Grid */}
        {filteredPlayers.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-300 py-8">
            {selectablePlayers.length === 0
              ? (isAuthenticated && currentPlayer && !isAdmin
                ? 'Sizin için uygun slot bulunamadı.'
                : 'Henüz oyuncu eklenmemiş. Admin sayfasından oyuncu ekleyin.')
              : 'Aramaya uygun oyuncu bulunamadı.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
            {filteredPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                className="hover:scale-105 transition-transform"
              >
                <PlayerCard player={player} size="md" showLabel showPosition labelTone="dark" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
