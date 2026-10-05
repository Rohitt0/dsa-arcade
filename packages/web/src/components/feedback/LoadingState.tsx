import { PixelSpinner } from '../ui/PixelSpinner';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <PixelSpinner />
      <p className="font-pixel text-[10px] uppercase tracking-wide text-stone-300">{label}</p>
    </div>
  );
}
