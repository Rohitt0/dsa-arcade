import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PixelCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function PixelCard({ interactive, className, children, ...props }: PixelCardProps) {
  return (
    <div
      className={cn(
        'pixel-frame p-4 sm:p-5',
        interactive &&
          'cursor-pointer transition-transform hover:-translate-y-0.5 focus-within:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PixelPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  accent?: string;
}

/** A titled "quest panel" with a header strip. */
export function PixelPanel({ title, accent, className, children, ...props }: PixelPanelProps) {
  return (
    <section className={cn('pixel-frame overflow-hidden p-0', className)} {...props}>
      {title && (
        <header
          className="border-b-2 border-ink px-4 py-2 font-pixel text-[10px] uppercase tracking-wide text-ink sm:text-xs"
          style={{ backgroundColor: accent ?? '#ffcf4e' }}
        >
          {title}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
