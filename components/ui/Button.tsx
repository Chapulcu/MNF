import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-medium rounded-lg transition-all duration-200',
          {
            'bg-green-600 text-white hover:bg-green-700 active:scale-95': variant === 'primary',
            'bg-slate-200 text-slate-800 hover:bg-slate-300 active:scale-95 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 active:scale-95': variant === 'danger',
            'bg-transparent text-slate-700 hover:bg-slate-100 active:scale-95 dark:text-slate-200 dark:hover:bg-slate-800/60': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
