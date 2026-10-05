import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-gold text-ink hover:bg-sun',
  secondary: 'bg-night-600 text-parchment hover:bg-night-700',
  ghost: 'bg-transparent text-parchment hover:bg-night-700',
  danger: 'bg-ember text-parchment hover:brightness-110',
};

const sizes: Record<Size, string> = {
  // min-h keeps every button a comfortable touch target (>=44px) on mobile.
  sm: 'min-h-[44px] px-3 text-[10px]',
  md: 'min-h-[44px] px-4 text-xs',
  lg: 'min-h-[52px] px-6 text-sm',
};

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(function PixelButton(
  { variant = 'primary', size = 'md', fullWidth, loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-pixel uppercase tracking-wide',
        'border-2 border-ink shadow-pixel transition-transform select-none',
        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-pixel-sm',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-3 w-3 animate-spin border-2 border-ink border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
});
