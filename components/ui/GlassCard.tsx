import { cn } from '@/lib/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
}
