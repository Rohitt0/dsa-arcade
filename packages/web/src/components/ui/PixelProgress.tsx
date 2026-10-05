import { cn } from '../../lib/cn';

export interface PixelProgressProps {
  value: number; // 0..100
  label?: string;
  className?: string;
  tone?: string; // fill colour (hex / css)
}

export function PixelProgress({ value, label, className, tone = '#5fc26a' }: PixelProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between font-pixel text-[9px] uppercase text-stone-300">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className="h-4 w-full border-2 border-ink bg-night-900"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${clamped}%`,
            backgroundColor: tone,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 8px)',
          }}
        />
      </div>
    </div>
  );
}
