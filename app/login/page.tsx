'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAllPlayers } from '@/lib/api/players';
import { Shield, LogIn, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { isAuthenticated, currentPlayer, loading, login } = useAuth();
  const router = useRouter();
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const data = await getAllPlayers();
      setPlayers(data);
    } catch (err) {
      setError('Oyuncular yüklenirken hata oluştu');
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setShouldRedirect(true);
      router.push('/');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPlayerId || !password) {
      setError('Lütfen oyuncu ve şifre girin');
      return;
    }

    const result = await login(selectedPlayerId, password);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Giriş başarısız');
    }
  };

  if (shouldRedirect || loading || loadingPlayers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Oyuncu Girişi</h1>
          <p className="text-slate-400">Futbol sahası yönetim sistemi</p>
        </div>

        {/* Login Form */}
        <GlassCard className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Oyuncu Seçin
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Seçiniz...</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                    {player.isAdmin && ' (Admin)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="•••••••••"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Giriş Yap
            </button>
          </form>
        </GlassCard>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
