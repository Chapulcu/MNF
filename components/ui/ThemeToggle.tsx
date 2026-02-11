'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300"
        aria-label="Toggle theme"
      >
        <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 dark:hover:shadow-cyan-500/20 group"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-cyan-400/20 dark:from-purple-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Sliding circle */}
      <div
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center ${
          theme === 'dark'
            ? 'left-8 translate-x-0 bg-gradient-to-br from-purple-500 to-pink-500'
            : 'left-1 translate-x-0 bg-gradient-to-br from-green-400 to-cyan-500'
        }`}
      >
        {theme === 'light' ? (
          <Sun className="w-3 h-3 text-yellow-500" strokeWidth={2.5} />
        ) : (
          <Moon className="w-3 h-3 text-white" strokeWidth={2.5} />
        )}
      </div>

      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          theme === 'dark'
            ? 'opacity-100 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
            : 'opacity-0'
        }`}
      />
    </button>
  );
}
