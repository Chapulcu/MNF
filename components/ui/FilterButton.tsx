'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface FilterButtonProps {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    className?: string;
}

export function FilterButton({ active, onClick, children, className }: FilterButtonProps) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base',
                active
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20',
                className
            )}
        >
            {children}
        </button>
    );
}
