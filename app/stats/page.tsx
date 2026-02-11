'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { addGoal, createMatch, deleteGoal, deleteMatch, getAllMatches, getStats, MatchWithGoals, MatchStats, PlayerStats, updateGoal, updateMatch, GoalWithPlayer } from '@/lib/api/matches';
import { getAllPlayers } from '@/lib/api/players';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Calendar, Trophy, Target, TrendingUp, Users, Circle, ArrowLeft, Sparkles, Plus, Pencil, Trash2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { Player } from '@/types';

type TabType = 'matches' | 'players' | 'leaderboards';

function formatSeconds(seconds: number | null) {
  if (seconds === null || Number.isNaN(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StatsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [matches, setMatches] = useState<MatchWithGoals[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5v5' | '6v6' | '7v7'>('all');
  const [players, setPlayers] = useState<Player[]>([]);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedPendingGoals, setSelectedPendingGoals] = useState<Set<string>>(new Set());

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchWithGoals | null>(null);
  const [matchDate, setMatchDate] = useState('');
  const [matchType, setMatchType] = useState<'5v5' | '6v6' | '7v7'>('5v5');
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [matchNotes, setMatchNotes] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);
  const [playerFilterA, setPlayerFilterA] = useState('');
  const [playerFilterB, setPlayerFilterB] = useState('');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalMatch, setGoalMatch] = useState<MatchWithGoals | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalWithPlayer | null>(null);
  const [goalPlayerId, setGoalPlayerId] = useState('');
  const [goalTeam, setGoalTeam] = useState<'A' | 'B'>('A');
  const [goalMinute, setGoalMinute] = useState('');
  const [goalYoutubeUrl, setGoalYoutubeUrl] = useState('');
  const [goalConfirmed, setGoalConfirmed] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      const [matchesData, statsData, playersData] = await Promise.all([
        getAllMatches(),
        getStats(),
        getAllPlayers(),
      ]);

      // Filter matches by type if needed
      const filteredMatches = filter === 'all'
        ? matchesData
        : matchesData.filter(m => m.matchType === filter);

      // Sort matches by date (newest first)
      filteredMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setMatches(filteredMatches);
      setPlayerStats((statsData as any).players || []);
      setMatchStats((statsData as any).matches || null);
      setPlayers(playersData);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast('İstatistikler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toLocalDatetimeInput = (date: Date) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const getFilteredPlayers = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  };

  const renderPlayerChips = (selectedIds: string[], onRemove: (id: string) => void) => {
    if (selectedIds.length === 0) {
      return <div className="text-xs text-slate-500 dark:text-slate-400">Seçili oyuncu yok.</div>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {selectedIds.map((id) => {
          const player = players.find((p) => p.id === id);
          if (!player) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 text-xs"
            >
              {player.name}
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label="Kaldır"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  const parseDurationToSeconds = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    const hms = trimmed.match(/^(\d+):([0-5]?\d):([0-5]?\d)$/);
    if (hms) {
      const hours = parseInt(hms[1], 10);
      const minutes = parseInt(hms[2], 10);
      const seconds = parseInt(hms[3], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    const ms = trimmed.match(/^(\d+):([0-5]?\d)$/);
    if (!ms) return NaN;
    const minutes = parseInt(ms[1], 10);
    const seconds = parseInt(ms[2], 10);
    return minutes * 60 + seconds;
  };

  const isValidYoutubeUrl = (value: string) => {
    if (!value) return true;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(value);
  };


  const openNewMatchModal = () => {
    setEditingMatch(null);
    setMatchDate(toLocalDatetimeInput(new Date()));
    setMatchType('5v5');
    setTeamAScore(0);
    setTeamBScore(0);
    setMatchNotes('');
    setTeamAPlayers([]);
    setTeamBPlayers([]);
    setPlayerFilterA('');
    setPlayerFilterB('');
    setShowMatchModal(true);
  };

  const openEditMatchModal = (match: MatchWithGoals) => {
    setEditingMatch(match);
    setMatchDate(toLocalDatetimeInput(new Date(match.date)));
    setMatchType(match.matchType as '5v5' | '6v6' | '7v7');
    setTeamAScore(match.teamAScore);
    setTeamBScore(match.teamBScore);
    setMatchNotes(match.notes || '');
    setTeamAPlayers(match.teamAPlayers || []);
    setTeamBPlayers(match.teamBPlayers || []);
    setPlayerFilterA('');
    setPlayerFilterB('');
    setShowMatchModal(true);
  };

  const handleSubmitMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMatch) {
        await updateMatch(editingMatch.id, {
          date: new Date(matchDate),
          matchType,
          teamAScore,
          teamBScore,
          teamAPlayers,
          teamBPlayers,
          notes: matchNotes || null,
        });
        toast('Maç güncellendi.', 'success');
      } else {
        await createMatch({
          date: new Date(matchDate),
          matchType,
          teamAScore,
          teamBScore,
          teamAFormation: null,
          teamBFormation: null,
          teamAPlayers,
          teamBPlayers,
          notes: matchNotes || null,
        });
        toast('Maç eklendi.', 'success');
      }
      setShowMatchModal(false);
      loadData();
    } catch (error) {
      console.error('Match save failed:', error);
      toast('Maç kaydedilemedi.', 'error');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Bu maçı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteMatch(matchId);
      toast('Maç silindi.', 'success');
      loadData();
    } catch (error) {
      console.error('Match delete failed:', error);
      toast('Maç silinemedi.', 'error');
    }
  };

  const openNewGoalModal = (match: MatchWithGoals) => {
    setGoalMatch(match);
    setEditingGoal(null);
    setGoalPlayerId('');
    setGoalTeam('A');
    setGoalMinute('');
    setGoalYoutubeUrl('');
    setGoalConfirmed(false);
    setShowGoalModal(true);
  };

  const openEditGoalModal = (match: MatchWithGoals, goal: GoalWithPlayer) => {
    setGoalMatch(match);
    setEditingGoal(goal);
    setGoalPlayerId(goal.playerId);
    setGoalTeam(goal.team);
    setGoalMinute(formatSeconds(goal.minute ?? null));
    setGoalYoutubeUrl(goal.youtubeUrl || '');
    setGoalConfirmed(goal.isConfirmed);
    setShowGoalModal(true);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalMatch) return;

    try {
      const parsedSeconds = parseDurationToSeconds(goalMinute);
      if (Number.isNaN(parsedSeconds)) {
        toast('Süre formatı geçersiz. Örn: 0:38 veya 75', 'error');
        return;
      }
      if (!isValidYoutubeUrl(goalYoutubeUrl.trim())) {
        toast('Geçerli bir YouTube linki girin.', 'error');
        return;
      }
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          minute: parsedSeconds,
          isConfirmed: isAdmin ? goalConfirmed : undefined,
          youtubeUrl: goalYoutubeUrl.trim() || null,
        });
        toast('Gol güncellendi.', 'success');
      } else {
        if (!goalPlayerId) {
          toast('Oyuncu seçin.', 'error');
          return;
        }
        const isInRoster =
          (goalTeam === 'A' ? goalMatch.teamAPlayers : goalMatch.teamBPlayers)?.includes(goalPlayerId) ?? true;
        if ((goalMatch.teamAPlayers?.length || goalMatch.teamBPlayers?.length) && !isInRoster) {
          toast('Oyuncu maç kadrosunda değil.', 'error');
          return;
        }
        await addGoal(goalMatch.id, {
          matchId: goalMatch.id,
          playerId: goalPlayerId,
          team: goalTeam,
          minute: parsedSeconds,
          isConfirmed: isAdmin ? goalConfirmed : false,
          youtubeUrl: goalYoutubeUrl.trim() || null,
        });
        toast('Gol eklendi.', 'success');
      }
      setShowGoalModal(false);
      loadData();
    } catch (error) {
      console.error('Goal save failed:', error);
      toast('Gol kaydedilemedi.', 'error');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bu golü silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteGoal(goalId);
      toast('Gol silindi.', 'success');
      loadData();
    } catch (error) {
      console.error('Goal delete failed:', error);
      toast('Gol silinemedi.', 'error');
    }
  };

  const handleConfirmGoal = async (goalId: string, confirmed: boolean) => {
    if (!isAdmin) {
      toast('Gol onayı için admin yetkisi gerekir.', 'error');
      return;
    }
    try {
      await updateGoal(goalId, { isConfirmed: confirmed });
      toast(confirmed ? 'Gol onaylandı.' : 'Gol onayı kaldırıldı.', 'success');
      loadData();
    } catch (error) {
      console.error('Goal confirm failed:', error);
      toast('Gol onayı güncellenemedi.', 'error');
    }
  };

  const getAllPendingGoalIds = () => {
    return matches.flatMap((m) => m.goals.filter((g) => !g.isConfirmed).map((g) => g.id));
  };

  const toggleSelectPending = (goalId: string) => {
    setSelectedPendingGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    const allPending = getAllPendingGoalIds();
    setSelectedPendingGoals((prev) => {
      if (prev.size === allPending.length) return new Set();
      return new Set(allPending);
    });
  };

  const handleApproveSelectedPending = async () => {
    if (!isAdmin) {
      toast('Gol onayı için admin yetkisi gerekir.', 'error');
      return;
    }
    const ids = Array.from(selectedPendingGoals);
    if (ids.length === 0) {
      toast('Seçili gol yok.', 'info');
      return;
    }
    try {
      await Promise.all(ids.map((id) => updateGoal(id, { isConfirmed: true })));
      toast('Seçili goller onaylandı.', 'success');
      setSelectedPendingGoals(new Set());
      loadData();
    } catch (error) {
      console.error('Bulk approve failed:', error);
      toast('Toplu onay başarısız.', 'error');
    }
  };

  const handleDeleteSelectedPending = async () => {
    const ids = Array.from(selectedPendingGoals);
    if (ids.length === 0) {
      toast('Seçili gol yok.', 'info');
      return;
    }
    if (!confirm('Seçili golleri silmek istediğinizden emin misiniz?')) return;
    try {
      await Promise.all(ids.map((id) => deleteGoal(id)));
      toast('Seçili goller silindi.', 'success');
      setSelectedPendingGoals(new Set());
      loadData();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast('Toplu silme başarısız.', 'error');
    }
  };

  const handleExportGoalsTxt = (scope?: MatchWithGoals) => {
    if (matches.length === 0) {
      toast('Dışa aktarmak için maç yok.', 'info');
      return;
    }
    const lines: string[] = [];
    const list = scope ? [scope] : matches;
    lines.push(scope ? 'Palmiye Futbol - Maç Gol Listesi' : 'Palmiye Futbol - Gol Listesi');
    lines.push(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
    lines.push('');
    list.forEach((match) => {
      const matchDate = new Date(match.date).toLocaleString('tr-TR');
      lines.push(`Maç: ${matchDate} | ${match.matchType} | A ${match.teamAScore} - ${match.teamBScore} B`);
      if (match.goals.length === 0) {
        lines.push('  Gol yok');
      } else {
        match.goals.forEach((g) => {
          const time = formatSeconds(g.minute);
          const confirmed = g.isConfirmed ? 'onaylı' : 'beklemede';
          const yt = g.youtubeUrl ? ` | YouTube: ${g.youtubeUrl}` : '';
          lines.push(`  [${g.team}] ${g.playerName} - ${time || '-'} (${confirmed})${yt}`);
        });
      }
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.download = scope
      ? `palmiye-futbol-mac-${new Date(scope.date).toISOString().slice(0, 10)}-goller-${dateStamp}.txt`
      : `palmiye-futbol-goller-${dateStamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Gol listesi dışa aktarıldı.', 'success');
  };

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8">
      {/* Futuristic animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-purple-500/5 to-pink-500/5 dark:from-cyan-500/10 dark:via-purple-500/10 dark:to-pink-500/10 animate-pulse-slow" />
        <div className="absolute top-40 left-10 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-pink-400/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-300 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/30">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/60 rounded-xl shadow-lg backdrop-blur-sm">
                  <img src="/logo.svg" alt="Palmiye Futbol" className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                    İstatistikler
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500 dark:text-cyan-400" />
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">Maçlar, oyuncu istatistikleri ve liderlik tablosu</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <ThemeToggle />
                <Link
                  href="/"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 dark:hover:from-emerald-500 dark:hover:to-cyan-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Sahaya Dön
                </Link>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => openNewMatchModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 dark:from-purple-400 dark:to-pink-400 dark:hover:from-purple-500 dark:hover:to-pink-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/30"
              >
                <Circle className="w-4 h-4" />
                + Maç Ekle
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
              filter === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('5v5')}
            className={`px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
              filter === '5v5'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20'
            }`}
          >
            5v5
          </button>
          <button
            onClick={() => setFilter('6v6')}
            className={`px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
              filter === '6v6'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20'
            }`}
          >
            6v6
          </button>
          <button
            onClick={() => setFilter('7v7')}
            className={`px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
              filter === '7v7'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20'
            }`}
          >
            7v7
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-300 dark:border-white/10 shadow-lg">
          <div className="flex border-b border-slate-300 dark:border-white/10">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === 'matches'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Circle className="w-5 h-5" />
              Maçlar ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === 'players'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              Oyuncular ({playerStats.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboards')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === 'leaderboards'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Trophy className="w-5 h-5" />
              Lider Tablosu
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <>
                {/* Matches Tab */}
                {activeTab === 'matches' && (
                  <div className="space-y-4">
                    {matches.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-300">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Henüz maç kaydı yok.</p>
                        {isAdmin && (
                          <p className="mt-2">
                            <button
                              onClick={() => openNewMatchModal()}
                              className="text-emerald-600 dark:text-emerald-300 hover:underline"
                            >
                              İlk maçı ekleyin
                            </button>
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            {showPendingOnly ? 'Sadece onay bekleyen goller gösteriliyor.' : 'Tüm goller gösteriliyor.'}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleExportGoalsTxt}
                            >
                              Golleri TXT Dışa Aktar
                            </Button>
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                              <input
                                type="checkbox"
                                checked={showPendingOnly}
                                onChange={(e) => {
                                  setShowPendingOnly(e.target.checked);
                                  setSelectedPendingGoals(new Set());
                                }}
                                className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                              />
                              Bekleyenler
                            </label>
                            {showPendingOnly && (
                              <>
                                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={selectedPendingGoals.size > 0 && selectedPendingGoals.size === getAllPendingGoalIds().length}
                                    onChange={toggleSelectAllPending}
                                    className="w-3.5 h-3.5 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                                  />
                                  Tümünü seç
                                </label>
                                {isAdmin && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={handleApproveSelectedPending}
                                    >
                                      Seçiliyi onayla
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="danger"
                                      size="sm"
                                      onClick={handleDeleteSelectedPending}
                                    >
                                      Seçiliyi sil
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isAdmin={isAdmin}
                            showPendingOnly={showPendingOnly}
                            selectedPendingGoals={selectedPendingGoals}
                            onToggleSelectPending={toggleSelectPending}
                            onEditMatch={() => openEditMatchModal(match)}
                            onDeleteMatch={() => handleDeleteMatch(match.id)}
                            onAddGoal={() => openNewGoalModal(match)}
                            onExportGoals={() => handleExportGoalsTxt(match)}
                            onEditGoal={(goal) => openEditGoalModal(match, goal)}
                            onDeleteGoal={(goalId) => handleDeleteGoal(goalId)}
                            onConfirmGoal={(goalId, confirmed) => handleConfirmGoal(goalId, confirmed)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Players Tab */}
                {activeTab === 'players' && (
                  <div className="space-y-4">
                    {playerStats.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-300">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Henüz oyuncu istatistiği yok.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playerStats.map((stat) => (
                          <PlayerStatCard key={stat.playerId} stat={stat} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Leaderboards Tab */}
                {activeTab === 'leaderboards' && (
                  <LeaderboardSection playerStats={playerStats} matchStats={matchStats} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        title={editingMatch ? 'Maçı Düzenle' : 'Yeni Maç Ekle'}
      >
        <form className="space-y-4" onSubmit={(e) => handleSubmitMatch(e)}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Tarih</label>
            <Input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Maç Tipi</label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as '5v5' | '6v6' | '7v7')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="5v5">5v5</option>
              <option value="6v6">6v6</option>
              <option value="7v7">7v7</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Takım A Skor</label>
              <Input
                type="number"
                min={0}
                value={teamAScore}
                onChange={(e) => setTeamAScore(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Takım B Skor</label>
              <Input
                type="number"
                min={0}
                value={teamBScore}
                onChange={(e) => setTeamBScore(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Takım A Kadro</label>
              <Input
                value={playerFilterA}
                onChange={(e) => setPlayerFilterA(e.target.value)}
                placeholder="Oyuncu ara..."
              />
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 p-2">
                {getFilteredPlayers(playerFilterA).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 py-1">
                    <input
                      type="checkbox"
                      checked={teamAPlayers.includes(p.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTeamAPlayers((prev) => checked ? [...prev, p.id] : prev.filter((id) => id !== p.id));
                        if (checked) {
                          setTeamBPlayers((prev) => prev.filter((id) => id !== p.id));
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
              {renderPlayerChips(teamAPlayers, (id) => setTeamAPlayers((prev) => prev.filter((pid) => pid !== id)))}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Takım B Kadro</label>
              <Input
                value={playerFilterB}
                onChange={(e) => setPlayerFilterB(e.target.value)}
                placeholder="Oyuncu ara..."
              />
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 p-2">
                {getFilteredPlayers(playerFilterB).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 py-1">
                    <input
                      type="checkbox"
                      checked={teamBPlayers.includes(p.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTeamBPlayers((prev) => checked ? [...prev, p.id] : prev.filter((id) => id !== p.id));
                        if (checked) {
                          setTeamAPlayers((prev) => prev.filter((id) => id !== p.id));
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
              {renderPlayerChips(teamBPlayers, (id) => setTeamBPlayers((prev) => prev.filter((pid) => pid !== id)))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Notlar</label>
            <textarea
              value={matchNotes}
              onChange={(e) => setMatchNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowMatchModal(false)}>
              İptal
            </Button>
            <Button type="submit" className="flex-1">
              {editingMatch ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title={editingGoal ? 'Golü Düzenle' : 'Gol Ekle'}
      >
        <form className="space-y-4" onSubmit={(e) => handleSubmitGoal(e)}>
          {!editingGoal && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Oyuncu</label>
                <select
                  value={goalPlayerId}
                  onChange={(e) => setGoalPlayerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" disabled>Oyuncu seçin</option>
                  {(
                    goalMatch?.teamAPlayers?.length || goalMatch?.teamBPlayers?.length
                      ? players.filter((p) =>
                          goalTeam === 'A'
                            ? goalMatch?.teamAPlayers?.includes(p.id)
                            : goalMatch?.teamBPlayers?.includes(p.id)
                        )
                      : players
                  ).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGoalTeam('A');
                    setGoalPlayerId('');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    goalTeam === 'A'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700/60'
                  }`}
                >
                  Takım A
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalTeam('B');
                    setGoalPlayerId('');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    goalTeam === 'B'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700/60'
                  }`}
                >
                  Takım B
                </button>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Süre (ss, mm:ss, hh:mm:ss)</label>
            <Input
              type="text"
              value={goalMinute}
              onChange={(e) => setGoalMinute(e.target.value)}
              placeholder="Örn: 0:38, 12:05 veya 1:02:15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">YouTube Linki (opsiyonel)</label>
            <Input
              type="url"
              value={goalYoutubeUrl}
              onChange={(e) => setGoalYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={goalConfirmed}
                onChange={(e) => setGoalConfirmed(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
              />
              Gol onaylı
            </label>
          )}
          {!isAdmin && (
            <Alert variant="info">
              Eklediğiniz goller admin onayı sonrası görünür.
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowGoalModal(false)}>
              İptal
            </Button>
            <Button type="submit" className="flex-1">
              {editingGoal ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Match Card Component
function MatchCard({
  match,
  isAdmin,
  showPendingOnly,
  selectedPendingGoals,
  onToggleSelectPending,
  onEditMatch,
  onDeleteMatch,
  onAddGoal,
  onExportGoals,
  onEditGoal,
  onDeleteGoal,
  onConfirmGoal,
}: {
  match: MatchWithGoals;
  isAdmin: boolean;
  showPendingOnly: boolean;
  selectedPendingGoals: Set<string>;
  onToggleSelectPending: (goalId: string) => void;
  onEditMatch: () => void;
  onDeleteMatch: () => void;
  onAddGoal: () => void;
  onExportGoals: () => void;
  onEditGoal: (goal: GoalWithPlayer) => void;
  onDeleteGoal: (goalId: string) => void;
  onConfirmGoal: (goalId: string, confirmed: boolean) => void;
}) {
  const [goalsOpen, setGoalsOpen] = useState(false);
  const result = getResult(match.teamAScore, match.teamBScore);
  const filteredGoals = showPendingOnly ? match.goals.filter((g) => !g.isConfirmed) : match.goals;
  const teamAGoals = filteredGoals.filter(g => g.team === 'A');
  const teamBGoals = filteredGoals.filter(g => g.team === 'B');

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg border border-slate-200/70 dark:border-slate-700/60 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-300">{formatDate(match.date)}</span>
            <span className="px-2 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-full">
              {match.matchType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ResultBadge result={result} />
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onExportGoals}
                  className="p-2.5 rounded-lg text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Maç gollerini dışa aktar"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  onClick={onEditMatch}
                  className="p-2.5 rounded-lg text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Maçı düzenle"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={onDeleteMatch}
                  className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Maçı sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 py-4">
          {/* Team A */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto shadow-lg">
              A
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{match.teamAScore}</div>
          </div>

          <div className="text-2xl text-slate-400 dark:text-slate-500 font-light">-</div>

          {/* Team B */}
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto shadow-lg">
              B
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{match.teamBScore}</div>
          </div>
        </div>

        {/* Goals */}
        <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700/60">
          <button
            onClick={() => setGoalsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 min-h-[44px]"
          >
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                ⚽
              </span>
              Goller {showPendingOnly ? '(Bekleyenler)' : ''}
            </span>
            <span className="text-slate-500 dark:text-slate-300">
              {filteredGoals.length} {goalsOpen ? '▲' : '▼'}
            </span>
          </button>

          {goalsOpen && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-200/60 dark:border-blue-400/20 bg-blue-50/50 dark:bg-blue-500/10 p-3">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-200 mb-2">Takım A</div>
                {teamAGoals.length === 0 ? (
                  <div className="text-xs text-slate-500 dark:text-slate-300">Gol yok</div>
                ) : (
                  <div className="space-y-2">
                    {teamAGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {showPendingOnly && (
                            <input
                              type="checkbox"
                              checked={selectedPendingGoals.has(goal.id)}
                              onChange={() => onToggleSelectPending(goal.id)}
                              className="w-3.5 h-3.5 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                            />
                          )}
                          <span className="text-blue-700 dark:text-blue-200 font-medium">{goal.playerName}</span>
                          {!goal.isConfirmed && (
                            <span className="px-1.5 py-0.5 bg-yellow-100/80 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-200 text-xs rounded">
                              Onay bekliyor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {goal.minute !== null && (
                            <span className="text-slate-500 dark:text-slate-300">{formatSeconds(goal.minute)}</span>
                          )}
                          {goal.youtubeUrl && (
                            <a
                              href={goal.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                            >
                              YouTube
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onEditGoal(goal)}
                                className="p-2 rounded text-slate-600 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Golü düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onConfirmGoal(goal.id, !goal.isConfirmed)}
                                className="p-2 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title={goal.isConfirmed ? 'Onayı kaldır' : 'Onayla'}
                              >
                                {goal.isConfirmed ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => onDeleteGoal(goal.id)}
                                className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Golü sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-red-200/60 dark:border-red-400/20 bg-red-50/50 dark:bg-red-500/10 p-3">
                <div className="text-xs font-semibold text-red-700 dark:text-red-200 mb-2">Takım B</div>
                {teamBGoals.length === 0 ? (
                  <div className="text-xs text-slate-500 dark:text-slate-300">Gol yok</div>
                ) : (
                  <div className="space-y-2">
                    {teamBGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {showPendingOnly && (
                            <input
                              type="checkbox"
                              checked={selectedPendingGoals.has(goal.id)}
                              onChange={() => onToggleSelectPending(goal.id)}
                              className="w-3.5 h-3.5 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                            />
                          )}
                          <span className="text-red-700 dark:text-red-200 font-medium">{goal.playerName}</span>
                          {!goal.isConfirmed && (
                            <span className="px-1.5 py-0.5 bg-yellow-100/80 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-200 text-xs rounded">
                              Onay bekliyor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {goal.minute !== null && (
                            <span className="text-slate-500 dark:text-slate-300">{formatSeconds(goal.minute)}</span>
                          )}
                          {goal.youtubeUrl && (
                            <a
                              href={goal.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                            >
                              YouTube
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onEditGoal(goal)}
                                className="p-2 rounded text-slate-600 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800/60 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Golü düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onConfirmGoal(goal.id, !goal.isConfirmed)}
                                className="p-2 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title={goal.isConfirmed ? 'Onayı kaldır' : 'Onayla'}
                              >
                                {goal.isConfirmed ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => onDeleteGoal(goal.id)}
                                className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Golü sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showPendingOnly && filteredGoals.length === 0 && (
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-300">
              Bu maçta onay bekleyen gol yok.
            </div>
          )}
        </div>

        <div className="mt-3">
          <button
            onClick={onAddGoal}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm"
          >
            <Plus className="w-4 h-4" />
            Gol Ekle
          </button>
        </div>

        {/* Notes */}
        {match.notes && (
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
            <p className="text-sm text-slate-600 dark:text-slate-300">{match.notes}</p>
          </div>
        )}

        {/* Roster Summary */}
        {(match.teamAPlayers?.length || match.teamBPlayers?.length) && (
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kadro</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-blue-50/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-200">
                A: {match.teamAPlayers?.length || 0}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-50/80 dark:bg-red-500/15 text-red-700 dark:text-red-200">
                B: {match.teamBPlayers?.length || 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Player Stat Card Component
function PlayerStatCard({ stat }: { stat: PlayerStats }) {
  return (
    <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg border border-slate-200/70 dark:border-slate-700/60 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        {stat.photoUrl ? (
          <img src={stat.photoUrl} alt={stat.playerName} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {stat.playerName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{stat.playerName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-300">{stat.position}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-emerald-50/80 dark:bg-emerald-500/15 rounded-lg p-2">
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">{stat.totalGoals}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Gol</div>
        </div>
        <div className="bg-blue-50/80 dark:bg-blue-500/15 rounded-lg p-2">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-300">{stat.totalMatches}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Maç</div>
        </div>
        <div className="bg-purple-50/80 dark:bg-purple-500/15 rounded-lg p-2">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-300">{stat.goalsPerMatch.toFixed(2)}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Gol/Maç</div>
        </div>
      </div>
    </div>
  );
}

// Leaderboard Section Component
function LeaderboardSection({ playerStats, matchStats }: { playerStats: PlayerStats[]; matchStats: MatchStats | null }) {
  const topScorers = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 10);
  const mostMatches = [...playerStats].sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 10);
  const bestRatio = [...playerStats]
    .filter(p => p.totalMatches >= 3)
    .sort((a, b) => b.goalsPerMatch - a.goalsPerMatch)
    .slice(0, 10);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="space-y-6">
      {/* Match Stats Overview */}
      {matchStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="w-5 h-5" />
              <span className="text-sm opacity-90">Toplam Maç</span>
            </div>
            <div className="text-3xl font-bold">{matchStats.totalMatches}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5" />
              <span className="text-sm opacity-90">Toplam Gol</span>
            </div>
            <div className="text-3xl font-bold">{matchStats.totalGoals}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm opacity-90">Ortalama Gol</span>
            </div>
            <div className="text-3xl font-bold">{matchStats.avgGoalsPerMatch.toFixed(1)}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-sm opacity-90">A Takımı</span>
            </div>
            <div className="text-3xl font-bold">{matchStats.teamAWins}</div>
            <div className="text-xs opacity-90">Galibiyet</div>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-red-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-sm opacity-90">B Takımı</span>
            </div>
            <div className="text-3xl font-bold">{matchStats.teamBWins}</div>
            <div className="text-xs opacity-90">Galibiyet</div>
          </div>
        </div>
      )}

      {/* Top Scorers */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-yellow-500" />
          Gol Kralları
        </h3>
        <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
          {topScorers.length === 0 ? (
            <p className="text-center py-8 text-slate-500 dark:text-slate-300">Veri yok</p>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100/80 dark:bg-slate-800/70">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">#</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Oyuncu</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Gol</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Maç</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Ort</th>
                </tr>
              </thead>
              <tbody>
                {topScorers.map((stat, index) => (
                  <tr key={stat.playerId} className="border-t border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">{getMedal(index)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {stat.photoUrl ? (
                          <img src={stat.photoUrl} alt={stat.playerName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {stat.playerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">{stat.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-300">{stat.totalGoals}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{stat.totalMatches}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{stat.goalsPerMatch.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Most Matches */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          En Çok Oynayanlar
        </h3>
        <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
          {mostMatches.length === 0 ? (
            <p className="text-center py-8 text-slate-500 dark:text-slate-300">Veri yok</p>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100/80 dark:bg-slate-800/70">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">#</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Oyuncu</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Maç</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Gol</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Ort</th>
                </tr>
              </thead>
              <tbody>
                {mostMatches.map((stat, index) => (
                  <tr key={stat.playerId} className="border-t border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">{getMedal(index)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {stat.photoUrl ? (
                          <img src={stat.photoUrl} alt={stat.playerName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {stat.playerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">{stat.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-300">{stat.totalMatches}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{stat.totalGoals}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{stat.goalsPerMatch.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Best Goal Ratio */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          En Verimli Oyuncular (Min. 3 Maç)
        </h3>
        <div className="bg-white/70 dark:bg-slate-900/70 rounded-lg overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
          {bestRatio.length === 0 ? (
            <p className="text-center py-8 text-slate-500 dark:text-slate-300">Veri yok (en az 3 maç gerekli)</p>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100/80 dark:bg-slate-800/70">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">#</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Oyuncu</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Gol/Maç</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Gol</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">Maç</th>
                </tr>
              </thead>
              <tbody>
                {bestRatio.map((stat, index) => (
                  <tr key={stat.playerId} className="border-t border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">{getMedal(index)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {stat.photoUrl ? (
                          <img src={stat.photoUrl} alt={stat.playerName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {stat.playerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">{stat.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-purple-600 dark:text-purple-300">{stat.goalsPerMatch.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{stat.totalGoals}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{stat.totalMatches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Result Badge Component
function ResultBadge({ result }: { result: 'win' | 'loss' | 'draw' }) {
  const config = {
    win: { bg: 'bg-emerald-100/80 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-200', label: 'A Kazandı' },
    loss: { bg: 'bg-red-100/80 dark:bg-red-500/15', text: 'text-red-700 dark:text-red-200', label: 'B Kazandı' },
    draw: { bg: 'bg-slate-100/80 dark:bg-slate-700/40', text: 'text-slate-700 dark:text-slate-200', label: 'Berabere' },
  };

  const { bg, text, label } = config[result];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}

// Helper function to determine match result
function getResult(teamAScore: number, teamBScore: number): 'win' | 'loss' | 'draw' {
  if (teamAScore > teamBScore) return 'win';
  if (teamAScore < teamBScore) return 'loss';
  return 'draw';
}
