'use client';

import { useEffect, useState } from 'react';
import { FootballPitch } from '@/components/pitch/FootballPitch';
import { usePitchState } from '@/lib/hooks/usePitchState';
import { getPitchConfig } from '@/lib/utils/pitch-layout';
import { ArrowLeft, Share2 } from 'lucide-react';

export default function SharePage() {
  const { matchType, activePlayers, playerPositions } = usePitchState();
  const [pitchOrientation, setPitchOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Auto-detect screen orientation on mobile and set pitch accordingly
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;

    const updateOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setPitchOrientation(isPortrait ? 'vertical' : 'horizontal');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  const config = getPitchConfig(matchType);
  const playerCount = Array.from(activePlayers.values()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri dön
            </a>
            <div className="hidden sm:flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm">
              <Share2 className="w-4 h-4" />
              Paylaşılan Kadro
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-white/70">
            {playerCount}/{config.totalSlots} oyuncu
          </div>
        </div>

        <div className="w-full px-1 sm:px-2">
          <FootballPitch
            matchType={matchType}
            activePlayers={activePlayers}
            playerPositions={playerPositions}
            onSlotClick={() => {}}
            orientation={pitchOrientation}
          />
        </div>
      </div>
    </div>
  );
}
