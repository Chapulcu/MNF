'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { usePitchState } from '@/lib/hooks/usePitchState';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FootballPitch } from '@/components/pitch/FootballPitch';
import { useToast } from '@/components/ui/Toast';
import { PlayerSelectorModal } from '@/components/player/PlayerSelectorModal';
import { BenchSection } from '@/components/pitch/BenchSection';
import { TeamRosterSidebar } from '@/components/pitch/TeamRosterSidebar';
import { FormationDiagram, Formation } from '@/components/pitch/FormationDiagram';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Link, Users, Shield, List, RotateCw, Maximize, Minimize, X, LogOut, BarChart3, Sparkles, Share2 } from 'lucide-react';
import { MatchType, Player } from '@/types';
import { getPitchConfig } from '@/lib/utils/pitch-layout';
import { toPng } from 'html-to-image';

export default function Home() {
  const {
    matchType,
    setMatchType,
    activePlayers,
    playerPool,
    scheduledAt,
    isActive,
    addPlayerToSlot,
    removePlayerFromSlot,
    refreshPlayerPool,
    clearPitch,
  } = usePitchState();

  const { isAuthenticated, currentPlayer, isAdmin, logout: authLogout } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [pitchOrientation, setPitchOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const [fullScreenPitch, setFullScreenPitch] = useState(false);
  const [teamAFormation, setTeamAFormation] = useState<Formation | null>(null);
  const [teamBFormation, setTeamBFormation] = useState<Formation | null>(null);
  const [teamAFormationIndex, setTeamAFormationIndex] = useState(0);
  const [teamBFormationIndex, setTeamBFormationIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const pitchRef = useRef<HTMLDivElement | null>(null);

  const matchTypes: MatchType[] = ['5v5', '6v6', '7v7'];

  // Auto-detect screen orientation on mobile and set pitch accordingly
  useEffect(() => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint

    if (!isMobile) return; // Only apply on mobile

    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setPitchOrientation(isPortrait ? 'vertical' : 'horizontal');
    };

    // Initial check
    updateOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Get available players (not on pitch)
  const availablePlayers = useMemo(() => {
    const activePlayerIds = Array.from(activePlayers.values()).map((p) => p.id);
    return playerPool.filter((p) => !activePlayerIds.includes(p.id));
  }, [playerPool, activePlayers]);

  const parseScheduledAt = (value: string | null): Date | null => {
    if (!value) return null;
    if (/Z|[+-]\d{2}:\d{2}$/.test(value)) {
      return new Date(value);
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (match) {
      const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;
      return new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss)
      );
    }
    return new Date(value);
  };

  const handleSlotClick = (slotId: string) => {
    if (!isAuthenticated) {
      alert('Slot seçmek için giriş yapmalısınız.');
      return;
    }

    const now = new Date();
    const scheduledDate = parseScheduledAt(scheduledAt);
    const hasSchedule = !!scheduledDate;
    const isScheduleReady = !scheduledDate || now >= scheduledDate;
    const canJoin = hasSchedule ? isScheduleReady : isActive;

    if (!isAdmin && !canJoin) {
      if (hasSchedule && !isScheduleReady) {
        alert('Maç zamanı henüz gelmedi. Lütfen belirtilen saatte tekrar deneyin.');
        return;
      }
      if (!hasSchedule && !isActive) {
        alert('Saha şu an aktif değil. Admin tarafından aktif edildikten sonra katılabilirsiniz.');
        return;
      }
    }
    const player = activePlayers.get(slotId);
    if (player) {
      // If slot has a player, check permissions
      // Only allow the player themselves or admin to remove
      const isOwnSlot = isAuthenticated && currentPlayer?.id === player.id;
      const canRemove = isAdmin || isOwnSlot;

      if (!canRemove) {
        alert('Bu slotu sadece kendisi veya admin boşaltabilir.');
        return;
      }

      removePlayerFromSlot(slotId);
    } else {
      // If slot is empty, check if current user already has a slot
      if (isAuthenticated && currentPlayer && !isAdmin) {
        const currentUserSlotId = Array.from(activePlayers.entries()).find(
          ([, p]) => p.id === currentPlayer.id
        )?.[0];

        if (currentUserSlotId) {
          alert('Zaten bir slota atanmışsınız. Önce mevcut slotunuzu boşaltın.');
          return;
        }
      }

      // Show player selector
      setSelectedSlotId(slotId);
      setShowModal(true);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    if (selectedSlotId) {
      addPlayerToSlot(selectedSlotId, player);
      setShowModal(false);
      setSelectedSlotId(null);
    }
  };

  const handleSharePitch = async () => {
    if (isSharing) return;
    const node = pitchRef.current;
    if (!node) {
      toast('Saha görüntüsü bulunamadı.', 'error');
      return;
    }
    setIsSharing(true);

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'palmiye-futbol-kadro.png', { type: 'image/png' });
      const shareData = {
        title: 'Palmiye Futbol - Kadro',
        text: 'Son kadro saha görünümü',
        files: [file],
      };

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
        toast('PNG paylaşıldı.', 'success');
        return;
      }

      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'palmiye-futbol-kadro.png';
      downloadLink.click();
      toast('PNG indirildi. Paylaşmak için galeriden seçebilirsiniz.', 'info');
    } catch (error) {
      const err = error as DOMException;
      if (err?.name === 'AbortError') {
        toast('Paylaşım iptal edildi.', 'info');
        return;
      }
      console.error('Failed to share pitch:', error);
      toast('Paylaşım sırasında bir hata oluştu.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePlayerMove = (fromSlotId: string, toSlotId: string) => {
    if (!isAdmin) {
      alert('Slot değiştirmek için önce mevcut slotunuzu boşaltın.');
      return;
    }

    const player = activePlayers.get(fromSlotId);
    if (!player) return;

    // Check permissions: only admin or the player themselves can move
    const isOwnPlayer = isAuthenticated && currentPlayer?.id === player.id;
    if (!isAdmin && !isOwnPlayer) {
      alert('Sadece kendi slotunuzu taşıyabilirsiniz.');
      return;
    }

    // Check if target slot has a player
    const targetPlayer = activePlayers.get(toSlotId);
    if (targetPlayer) {
      // Check permissions for removing target player
      const isTargetOwnPlayer = isAuthenticated && currentPlayer?.id === targetPlayer.id;
      if (!isAdmin && !isTargetOwnPlayer) {
        alert('Hedef slottaki oyuncuyu sadece kendi kaldırabilirsiniz.');
        return;
      }
    }

    // Perform the swap/move
    const fromPlayer = activePlayers.get(fromSlotId);
    const toPlayer = activePlayers.get(toSlotId);

    // Remove both players first
    if (fromPlayer) removePlayerFromSlot(fromSlotId);
    if (toPlayer) removePlayerFromSlot(toSlotId);

    // Add players to their new positions
    if (fromPlayer) addPlayerToSlot(toSlotId, fromPlayer);
    if (toPlayer) addPlayerToSlot(fromSlotId, toPlayer);
  };

  const handleFormationChange = (teamA: Formation | null, teamB: Formation | null) => {
    if (!teamA || !teamB) {
      // If no formation selected, just update state
      if (teamA) setTeamAFormation(teamA);
      if (teamB) setTeamBFormation(teamB);
      setShowFormation(false);
      return;
    }

    // Get current players in order (by slot index)
    const currentPlayerList: Player[] = [];
    const config = getPitchConfig(matchType);

    for (let i = 0; i < config.totalSlots; i++) {
      const slotId = `slot-${i}`;
      const player = activePlayers.get(slotId);
      if (player) {
        currentPlayerList.push(player);
      }
    }

    // Preserve bench slots
    const benchSlotIds = Array.from(activePlayers.keys()).filter((id) => id.startsWith('bench-'));
    const benchSlotPlayers = benchSlotIds.map((id) => [id, activePlayers.get(id)] as const);

    // Clear all current assignments
    const allSlotIds = Array.from(activePlayers.keys());
    allSlotIds.forEach(slotId => removePlayerFromSlot(slotId));

    // Calculate how many players per team based on current match type
    const playersPerTeam = config.totalSlots / 2;

    // Reassign Team A players to first half of slots
    const teamAPlayers = currentPlayerList.slice(0, Math.min(playersPerTeam, currentPlayerList.length));
    teamAPlayers.forEach((player, index) => {
      addPlayerToSlot(`slot-${index}`, player);
    });

    // Reassign Team B players to second half of slots
    const teamBPlayers = currentPlayerList.slice(playersPerTeam, playersPerTeam * 2);
    teamBPlayers.forEach((player, index) => {
      addPlayerToSlot(`slot-${playersPerTeam + index}`, player);
    });

    // Restore bench slots
    benchSlotPlayers.forEach(([id, player]) => {
      if (player) addPlayerToSlot(id, player);
    });

    // Update formation state
    setTeamAFormation(teamA);
    setTeamBFormation(teamB);
    setShowFormation(false);
  };

  const handleMatchTypeChange = async (type: MatchType) => {
    // Clear players first (this syncs to server)
    await clearPitch();
    // Reset formations when match type changes
    setTeamAFormation(null);
    setTeamBFormation(null);
    setTeamAFormationIndex(0);
    setTeamBFormationIndex(0);
    // Then change match type (this syncs to server with new type)
    setMatchType(type);
  };

  const config = getPitchConfig(matchType);
  const isPitchFull = Array.from(activePlayers.keys()).filter((key, i) => i < config.totalSlots).length >= config.totalSlots;

  return (
    <div className={fullScreenPitch ? 'fixed inset-0 bg-slate-900 dark:bg-black flex items-center justify-center p-2 sm:p-4' : 'min-h-screen p-2 sm:p-4 md:p-8'}>
      {/* Full screen mode - only pitch and exit button */}
      {fullScreenPitch ? (
        <>
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-cyan-900/20 to-purple-900/20 dark:from-purple-900/30 dark:via-cyan-900/20 dark:to-emerald-900/30 animate-pulse-slow" />

          {/* Exit button */}
          <button
            onClick={() => setFullScreenPitch(false)}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 backdrop-blur-sm border border-amber-400/50 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2"
          >
            <Minimize className="w-4 h-4" />
            <span className="hidden sm:inline">Tam Ekrandan Çık</span>
            <span className="sm:hidden">Çık</span>
          </button>

          {/* Full screen pitch */}
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
            <FootballPitch
              matchType={matchType}
              activePlayers={activePlayers}
              onSlotClick={handleSlotClick}
              onPlayerMove={isAdmin ? handlePlayerMove : undefined}
              teamAFormation={teamAFormation}
              teamBFormation={teamBFormation}
              orientation={pitchOrientation}
            />
          </div>
        </>
      ) : (
        <>
          {/* Normal mode - all UI elements */}

          {/* Futuristic animated gradient background */}
          <div className="fixed inset-0 -z-10">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500" />

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-cyan-500/5 to-purple-500/5 dark:from-emerald-500/10 dark:via-cyan-500/10 dark:to-purple-500/10 animate-pulse-slow" />

            {/* Animated subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-20 dark:opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />

            {/* Floating orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6 relative z-10 px-2 sm:px-0">
            {/* Header */}
            <div className="p-3 sm:p-5 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/40 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-black/30">
              <div className="flex flex-col gap-3">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                      <img
                        src="/logo.svg"
                        alt="Palmiye Futbol"
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <span className="truncate">Palmiye Futbol</span>
                    </h1>
                    <p className="text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                      {Array.from(activePlayers.values()).length} oyuncu sahada
                    </p>
                  </div>

                  {/* Theme toggle */}
                  <div className="flex items-center justify-center sm:justify-end">
                    <ThemeToggle />
                  </div>
                </div>

                {/* Match schedule info */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm">
                  <span className={`px-2.5 py-1 rounded-full border ${
                    isActive
                      ? 'bg-emerald-100/80 dark:bg-emerald-500/15 border-emerald-300/70 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-200'
                      : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-300/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isActive ? 'Saha Aktif' : 'Saha Pasif'}
                  </span>
                  {scheduledAt && (
                    <span className="px-2.5 py-1 rounded-full border bg-blue-50/80 dark:bg-blue-500/15 border-blue-200/70 dark:border-blue-400/30 text-blue-700 dark:text-blue-200">
                      Maç: {new Date(scheduledAt).toLocaleString('tr-TR')}
                    </span>
                  )}
                </div>

                {/* Match type selector */}
                <div className="flex gap-1 sm:gap-2 justify-center">
                  {matchTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleMatchTypeChange(type)}
                      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all duration-200 text-sm sm:text-base ${
                        matchType === type
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white shadow-lg shadow-emerald-500/30 scale-105'
                          : 'bg-white/40 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-white/60 dark:hover:bg-white/10 border border-slate-300 dark:border-white/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center px-2">
          <Button
            onClick={refreshPlayerPool}
            variant="secondary"
            className="flex items-center gap-1.5 sm:gap-2 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl"
          >
            <Link className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Oyuncuları Yenile</span>
            <span className="sm:hidden">Yenile</span>
          </Button>
          <Button
            onClick={() => setShowFormation(true)}
            variant="secondary"
            className="flex items-center gap-1.5 sm:gap-2 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            Formasyon
          </Button>
          {/* Pitch Orientation Toggle */}
          <button
            onClick={() => setPitchOrientation(pitchOrientation === 'horizontal' ? 'vertical' : 'horizontal')}
            className={`flex items-center gap-1.5 sm:gap-2 border backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all ${
              pitchOrientation === 'horizontal'
                ? 'bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 dark:hover:from-emerald-500 dark:hover:to-cyan-500 border-emerald-400/50 text-white'
            }`}
          >
            <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{pitchOrientation === 'horizontal' ? 'Yatay' : 'Dikey'}</span>
            <span className="sm:hidden">{pitchOrientation === 'horizontal' ? 'Yatay' : 'Dikey'}</span>
          </button>
          <Button
            onClick={handleSharePitch}
            variant="secondary"
            disabled={isSharing}
            className="flex items-center gap-1.5 sm:gap-2 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl disabled:opacity-60"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{isSharing ? 'Paylaşılıyor' : 'Paylaş'}</span>
            <span className="sm:hidden">{isSharing ? 'Paylaşılıyor' : 'Paylaş'}</span>
          </Button>
          {/* Desktop Sidebar Toggle - only shows on desktop */}
          <button
            onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
            className={`hidden lg:flex items-center gap-1.5 sm:gap-2 border backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all ${
              showDesktopSidebar
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 border-emerald-400/50 text-white'
                : 'bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white'
            }`}
          >
            <List className="w-3 h-3 sm:w-4 sm:h-4" />
            Kadro
          </button>
          {/* Full Screen Pitch Toggle */}
          <button
            onClick={() => setFullScreenPitch(!fullScreenPitch)}
            className={`flex items-center gap-1.5 sm:gap-2 border backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all ${
              fullScreenPitch
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-amber-400/50 text-white'
                : 'bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white'
            }`}
          >
            {fullScreenPitch ? <Minimize className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{fullScreenPitch ? 'Tam Ekran Çık' : 'Tam Ekran'}</span>
            <span className="sm:hidden">{fullScreenPitch ? 'Çık' : 'Tam Ekran'}</span>
          </button>
          {/* Mobile Roster Button - only shows on mobile */}
          <button
            onClick={() => setShowRoster(true)}
            className="lg:hidden flex items-center gap-1.5 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white backdrop-blur-sm text-xs px-3 py-2 rounded-lg font-medium transition-all"
          >
            <List className="w-3 h-3" />
            Kadrolar
          </button>
          {isAdmin && activePlayers.size > 0 && (
            <Button
              onClick={() => {
                clearPitch();
                setMatchType('5v5');
                setTeamAFormation(null);
                setTeamBFormation(null);
                setTeamAFormationIndex(0);
                setTeamBFormationIndex(0);
              }}
              variant="danger"
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border border-red-400/50 text-white backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl"
            >
              Sahayı Temizle
            </Button>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs sm:text-sm text-slate-700 dark:text-white/80 px-2">
                {currentPlayer?.name}
                {currentPlayer?.isAdmin && ' (Admin)'}
              </span>
              <button
                onClick={async () => {
                  await authLogout();
                  window.location.href = '/login';
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white rounded-lg sm:rounded-xl font-medium transition-all backdrop-blur-sm flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white rounded-lg sm:rounded-xl font-medium transition-all backdrop-blur-sm flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Giriş</span>
            </a>
          )}
          {isAdmin && (
            <a
              href="/admin"
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 dark:from-purple-400 dark:to-pink-400 dark:hover:from-purple-500 dark:hover:to-pink-500 border border-purple-400/50 text-white rounded-lg sm:rounded-xl font-medium transition-all backdrop-blur-sm flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Yönetim</span>
            </a>
          )}
          {isAuthenticated && (
            <a
              href="/stats"
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 dark:from-cyan-400 dark:to-blue-400 dark:hover:from-cyan-500 dark:hover:to-blue-500 border border-cyan-400/50 text-white rounded-lg sm:rounded-xl font-medium transition-all backdrop-blur-sm flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">İstatistik</span>
            </a>
          )}
        </div>

        {/* Formation Info - Modern glass cards */}
        {(teamAFormation || teamBFormation) && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 px-2">
            {teamAFormation && (
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-400/40 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center shadow-lg">
                <p className="text-white font-bold text-xs sm:text-sm">{teamAFormation.name}</p>
                <p className="text-blue-200 text-[10px] sm:text-xs mt-0.5">{teamAFormation.description}</p>
              </div>
            )}
            {teamBFormation && (
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md border border-red-400/40 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center shadow-lg">
                <p className="text-white font-bold text-xs sm:text-sm">{teamBFormation.name}</p>
                <p className="text-red-200 text-[10px] sm:text-xs mt-0.5">{teamBFormation.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {playerPool.length === 0 && (
          <GlassCard className="p-6 bg-blue-500/20 backdrop-blur-md border border-blue-400/40 text-center rounded-xl">
            <p className="text-blue-100 text-lg mb-3 font-medium">👥 Başlamak için oyuncu ekleyin</p>
            <a
              href="/admin"
              className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg"
            >
              Admin Sayfasına Git
            </a>
          </GlassCard>
        )}

        {/* Football Pitch with Sidebar */}
        <div className="relative flex justify-center">
          <div className="w-full px-2 sm:px-4" ref={pitchRef}>
            <FootballPitch
              matchType={matchType}
              activePlayers={activePlayers}
              onSlotClick={handleSlotClick}
              onPlayerMove={isAdmin ? handlePlayerMove : undefined}
              teamAFormation={teamAFormation}
              teamBFormation={teamBFormation}
              orientation={pitchOrientation}
            />
          </div>
          {/* Sidebar - hidden on mobile, fixed on larger screens */}
          <TeamRosterSidebar
            activePlayers={activePlayers}
            totalSlots={config.totalSlots}
            isOpen={showDesktopSidebar}
            onToggle={() => setShowDesktopSidebar(!showDesktopSidebar)}
          />
        </div>

        {/* Bench Section */}
        <BenchSection
          matchType={matchType}
          activePlayers={activePlayers}
          onSlotClick={handleSlotClick}
        />

        {/* Player Selector Modal */}
        <PlayerSelectorModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSlotId(null);
          }}
          availablePlayers={availablePlayers}
          onSelectPlayer={handleSelectPlayer}
        />

        {/* Formation Diagram Modal */}
        {showFormation && (
          <FormationDiagram
            matchType={matchType}
            onClose={handleFormationChange}
            initialTeamAIndex={teamAFormationIndex}
            initialTeamBIndex={teamBFormationIndex}
            currentTeamAFormation={teamAFormation}
            currentTeamBFormation={teamBFormation}
          />
        )}

        {/* Mobile Roster Modal */}
        {showRoster && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center lg:hidden">
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 backdrop-blur-xl border-t border-slate-300 dark:border-slate-700 rounded-t-2xl shadow-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 z-10 p-4 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-300 dark:border-slate-700 backdrop-blur-xl flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  Takım Kadroları
                </h3>
                <button
                  onClick={() => setShowRoster(false)}
                  className="p-2 text-slate-600 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <TeamRosterSidebar
                  activePlayers={activePlayers}
                  totalSlots={config.totalSlots}
                  isModal={true}
                />
              </div>
            </div>
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
}
