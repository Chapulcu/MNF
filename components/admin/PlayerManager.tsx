'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types';
import {
  getAllPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer
} from '@/lib/api/players';
import { getSettings } from '@/lib/api/settings';
import { PlayerForm } from './PlayerForm';
import { PlayerCard } from '@/components/player/PlayerCard';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Alert } from '@/components/ui/Alert';
import { Trash2, Edit, Plus, Settings as SettingsIcon } from 'lucide-react';
import { AppSettingsPanel } from './AppSettingsPanel';
import { useAuth } from '@/lib/contexts/AuthContext';

export function PlayerManager() {
  const { currentPlayer, isAdmin } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(50);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const [data, settings] = await Promise.all([
        getAllPlayers(),
        getSettings()
      ]);
      setPlayers(data);
      setMaxPlayers(settings.maxPlayers);
    } catch (error) {
      console.error('Failed to load players:', error);
      alert('Oyuncular yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleAddPlayer = async (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createPlayer(playerData);
      setShowForm(false);
      loadPlayers();
    } catch (error: any) {
      console.error('Failed to add player:', error);
      alert(error.message || 'Oyuncu eklenirken bir hata oluştu.');
    }
  };

  const handleUpdatePlayer = async (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingPlayer) return;
    try {
      await updatePlayer(editingPlayer.id, playerData);
      setShowForm(false);
      setEditingPlayer(undefined);
      loadPlayers();
    } catch (error) {
      console.error('Failed to update player:', error);
      alert('Oyuncu güncellenirken bir hata oluştu.');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    // Check permissions: only admin can delete players
    if (!isAdmin) {
      alert('Sadece admin oyuncu silebilir.');
      return;
    }

    // Prevent deleting yourself
    if (currentPlayer?.id === id) {
      alert('Kendi hesabınızı silemezsiniz.');
      return;
    }

    if (!confirm('Bu oyuncuyu silmek istediğinizden emin misiniz?')) return;
    try {
      await deletePlayer(id);
      loadPlayers();
    } catch (error) {
      console.error('Failed to delete player:', error);
      alert('Oyuncu silinirken bir hata oluştu.');
    }
  };

  const handleEdit = (player: Player) => {
    // Check permissions: only admin or own profile can edit
    if (!isAdmin && currentPlayer?.id !== player.id) {
      alert('Sadece kendi profilinizi düzenleyebilirsiniz.');
      return;
    }

    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
  };

  const handleSettingsUpdated = () => {
    loadPlayers();
    setSettingsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500 dark:text-slate-300">Yükleniyor...</div>
      </div>
    );
  }

  const canAddMore = players.length < maxPlayers;

  return (
    <div className="space-y-6">
      {/* Settings Modal */}
      {settingsOpen && (
        <AppSettingsPanel
          onClose={() => setSettingsOpen(false)}
          onUpdated={handleSettingsUpdated}
          currentMaxPlayers={maxPlayers}
          currentPlayerCount={players.length}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Oyuncu Yönetimi</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Toplam {players.length} / {maxPlayers} oyuncu
            {!canAddMore && ' (Limit dolu!)'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              Ayarlar
            </Button>
          )}
          {isAdmin && !showForm && canAddMore && (
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yeni Oyuncu
            </Button>
          )}
        </div>
      </div>

      {/* Limit Warning */}
      {!canAddMore && (
        <Alert variant="warning">
          ⚠️ Maksimum oyuncu limitine ({maxPlayers}) ulaşıldı. Daha fazla oyuncu eklemek için ayarlardan limiti artırın.
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <PlayerForm
          onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
          onCancel={handleCancelForm}
          initialPlayer={editingPlayer}
        />
      )}

      {/* Players List */}
      {players.length === 0 ? (
        <div className="p-8 text-center bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <p className="text-slate-900 dark:text-slate-100 mb-4 font-medium">Henüz oyuncu eklenmemiş.</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            İlk oyuncuyu eklemek için &quot;Yeni Oyuncu&quot; butonuna tıklayın.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {players.map((player) => {
            // Check edit permission: admin or own profile
            const canEdit = isAdmin || currentPlayer?.id === player.id;
            // Check delete permission: admin only (and not self)
            const canDelete = isAdmin && currentPlayer?.id !== player.id;

            return (
              <div key={player.id} className="relative p-4 rounded-2xl border shadow-md group bg-white/80 dark:bg-slate-900/70 border-slate-200/70 dark:border-slate-700/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
                {canDelete && (
                  <button
                    onClick={() => handleDeletePlayer(player.id)}
                    className="absolute top-2 right-2 p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => handleEdit(player)}
                    className={`absolute top-2 p-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded ${canDelete ? 'right-10' : 'right-2'}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <div className="flex flex-col items-center">
                  <PlayerCard player={player} size="lg" showLabel showPosition labelTone="dark" />
                  <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight break-words">
                      {player.name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{player.positionPreference}</p>
                    {player.isAdmin && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1">👑 Admin</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Alert variant="success">
        ✅ Veriler sunucuda SQLite veritabanında saklanıyor. Tüm cihazlardan erişilebilir.
      </Alert>
    </div>
  );
}
