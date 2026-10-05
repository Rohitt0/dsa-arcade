import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'default' | 'easy' | 'medium' | 'hard' | 'locked' | 'open';

const tones: Record<Tone, string> = {
  default: 'bg-night-600 text-parchment',
  easy: 'bg-grass text-ink',
  medium: 'bg-gold text-ink',
  hard: 'bg-ember text-parchment',
  locked: 'bg-stone-500 text-parchment',
  open: 'bg-sky text-ink',
};

export interface PixelBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function PixelBadge({ tone = 'default', className, children, ...props }: PixelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border-2 border-ink px-2 py-0.5',
        'font-pixel text-[8px] uppercase tracking-wide sm:text-[9px]',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
