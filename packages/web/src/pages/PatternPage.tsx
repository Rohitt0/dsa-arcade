import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { usePattern, useRegions } from '../features/world/useRegions';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PixelBadge, PixelButton, PixelPanel } from '../components/ui';
import type { Difficulty } from '@dsa/shared';

const diffTone: Record<Difficulty, 'easy' | 'medium' | 'hard'> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export function PatternPage() {
  const { slug } = useParams();
  const { data: pattern, isLoading, isError, error, refetch } = usePattern(slug);
  const { data: regions } = useRegions();

  if (isLoading) return <LoadingState />;
  if (isError) {
    const status = error instanceof AxiosError ? error.response?.status : undefined;
    if (status === 404) {
      return (
        <EmptyState
          title="Pattern not found"
          message="This technique isn't in the archives."
          action={
            <Link to="/world">
              <PixelButton variant="secondary">Back to world</PixelButton>
            </Link>
          }
        />
      );
    }
    return <ErrorState onRetry={() => void refetch()} />;
  }
  if (!pattern) return null;

  const region = regions?.find((r) => r.id === pattern.regionId);
  const backTo = region ? `/region/${region.slug}` : '/world';

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={backTo}
        className="mb-4 inline-block font-pixel text-[9px] uppercase tracking-wide text-sky hover:underline"
      >
        ← {region ? region.name : 'World map'}
      </Link>

      <header className="mb-6">
        <h1 className="text-xl text-gold">{pattern.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PixelBadge tone={diffTone[pattern.difficulty]}>{pattern.difficulty}</PixelBadge>
          {pattern.complexity && <PixelBadge tone="default">{pattern.complexity}</PixelBadge>}
        </div>
      </header>

      <div className="flex flex-col gap-5">
        <PixelPanel title="The idea" accent="#6cb8e4">
          <p className="text-sm leading-relaxed text-parchment">{pattern.description}</p>
        </PixelPanel>

        {pattern.analogy && (
          <PixelPanel title="Think of it like…" accent="#b06cf0">
            <p className="text-sm leading-relaxed text-parchment">{pattern.analogy}</p>
          </PixelPanel>
        )}

        {pattern.pseudocode && (
          <PixelPanel title="Pseudocode" accent="#5fc26a">
            <pre className="overflow-hidden whitespace-pre-wrap break-words bg-night-900 p-3 text-xs leading-relaxed text-parchment">
              <code>{pattern.pseudocode}</code>
            </pre>
          </PixelPanel>
        )}

        {/* The rest of the learning loop lands in later phases. Shown so the path is clear. */}
        <PixelPanel title="Your quest" accent="#f2a65a">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-stone-300">
              Soon you'll <strong className="text-parchment">play</strong> this pattern as a pixel
              stage, then <strong className="text-parchment">solve</strong> it in C++ with
              progressive hints.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <PixelButton disabled className="relative">
                Play the stage
              </PixelButton>
              <PixelButton variant="secondary" disabled>
                Solve the challenge
              </PixelButton>
              <PixelBadge tone="default" className="self-center">
                Coming soon
              </PixelBadge>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
