'use client';

import { cn } from '@/lib/utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant = 'info', className, children }: AlertProps) {
  const styles: Record<AlertVariant, string> = {
    info: 'bg-blue-50/80 dark:bg-blue-500/15 border-blue-200/70 dark:border-blue-400/30 text-blue-900 dark:text-blue-200',
    success: 'bg-emerald-100/80 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-400/40 text-emerald-900 dark:text-emerald-200',
    warning: 'bg-amber-100/80 dark:bg-amber-500/15 border-amber-300 dark:border-amber-400/40 text-amber-900 dark:text-amber-200',
    error: 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-400/30 text-red-700 dark:text-red-200',
  };

  return (
    <div className={cn('p-4 rounded-xl border text-sm', styles[variant], className)}>
      {children}
    </div>
  );
}
