import { cn } from '../../lib/cn';

export function PixelSpinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-6 w-6 animate-spin border-4 border-stone-500 border-t-gold',
        className,
      )}
    />
  );
}
