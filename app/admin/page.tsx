'use client';

import { PlayerManager } from '@/components/admin/PlayerManager';
import { MatchSchedulePanel } from '@/components/admin/MatchSchedulePanel';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Futuristic animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-pink-500/5 to-cyan-500/5 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-cyan-500/10 animate-pulse-slow" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-300 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/60 rounded-xl shadow-lg backdrop-blur-sm">
                <img src="/logo.svg" alt="Palmiye Futbol" className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                  Admin Panel
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 dark:text-purple-400" />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">Oyuncu havuzunu yönetin</p>
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
        </div>

        {/* Match Schedule */}
        <MatchSchedulePanel />

        {/* Player Manager */}
        <PlayerManager />
      </div>
    </div>
  );
}
