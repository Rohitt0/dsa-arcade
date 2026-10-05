import { PixelButton } from '../ui/PixelButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something broke',
  message = 'We could not load this. Try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center border-2 border-ink bg-ember font-pixel text-xl text-parchment">
        !
      </div>
      <h2 className="font-pixel text-sm text-parchment">{title}</h2>
      <p className="text-sm text-stone-300">{message}</p>
      {onRetry && (
        <PixelButton variant="secondary" onClick={onRetry}>
          Retry
        </PixelButton>
      )}
    </div>
  );
}
