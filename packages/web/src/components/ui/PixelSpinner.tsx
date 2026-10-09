import { cn } from '../../lib/cn';

export function PixelSpinner({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <span
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : 'Loading'}
      aria-hidden={decorative || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1 text-current',
        className,
      )}
    >
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="h-1 w-1 bg-current motion-safe:animate-pulse" style={{ animationDelay: `${dot * 180}ms`, animationDuration: '900ms' }} />
      ))}
    </span>
  );
}
