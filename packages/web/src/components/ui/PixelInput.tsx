import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(function PixelInput(
  { label, error, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block font-pixel text-[9px] uppercase tracking-wide text-stone-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          'min-h-[44px] w-full border-2 border-ink bg-night-900 px-3 py-2 text-sm text-parchment',
          'placeholder:text-stone-400 focus:border-gold',
          error && 'border-ember',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-ember">{error}</p>}
    </div>
  );
});
