import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full px-3 py-2 rounded-lg border',
          'border-slate-300 dark:border-slate-700/60',
          'bg-white text-slate-900 placeholder:text-slate-400',
          'dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
          'disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-800/60',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
