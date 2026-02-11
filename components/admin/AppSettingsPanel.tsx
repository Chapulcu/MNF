'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { updateMaxPlayers } from '@/lib/api/settings';
import { Alert } from '@/components/ui/Alert';

interface AppSettingsPanelProps {
  onClose: () => void;
  onUpdated: () => void;
  currentMaxPlayers: number;
  currentPlayerCount: number;
}

export function AppSettingsPanel({
  onClose,
  onUpdated,
  currentMaxPlayers,
  currentPlayerCount
}: AppSettingsPanelProps) {
  const [maxPlayers, setMaxPlayers] = useState(currentMaxPlayers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      await updateMaxPlayers(maxPlayers);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Ayarlar güncellenirken bir hata oluştu.');
      setSaving(false);
    }
  };

  const isValid = maxPlayers >= currentPlayerCount && maxPlayers > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 dark:bg-slate-900/95 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/70 dark:border-slate-700/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/70 dark:border-slate-700/60">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Uygulama Ayarları</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Max Players Setting */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Maksimum Oyuncu Sayısı
            </label>
            <input
              type="number"
              min={currentPlayerCount}
              max={500}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value) || currentPlayerCount)}
              disabled={saving}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/60"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mevcut oyuncu sayısı: {currentPlayerCount}
            </p>
            {maxPlayers < currentPlayerCount && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Yeni limit mevcut oyuncu sayısından az olamaz.
              </p>
            )}
          </div>

          {/* Info */}
          <Alert variant="info">
            Bu ayar, sisteme kaydedilebilecek maksimum oyuncu sayısını belirler.
            Limit, mevcut oyuncu sayısından düşük olamaz.
          </Alert>

          {/* Error */}
          {error && (
            <Alert variant="error" className="p-3">
              {error}
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValid}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
