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

        {pattern.slug === 'sliding-window' && (
          <>
            <PixelPanel title="Restart the Greenhouse" accent="#5fc26a">
              <div className="overflow-hidden border-2 border-ink">
                <img
                  src="/images/greenhouse/greenhouse-background-clean.png"
                  alt="Dark pixel-art greenhouse waiting for its crystal power source to be restored"
                  className="pixelated aspect-[16/9] w-full object-cover"
                />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-stone-300">
                Restore the greenhouse by finding the highest energy in three neighboring crystals.
                Write and test a standard C++ solution; passing hidden cases brings the garden back
                to life.
              </p>
              <Link to="/game/greenhouse" className="mt-4 block">
                <PixelButton className="w-full">Restart the Greenhouse · Play now</PixelButton>
              </Link>
            </PixelPanel>
            <PixelPanel title="Ready to code?" accent="#f2a65a">
              <p className="mb-3 text-sm leading-relaxed text-stone-300">
                Run checks the visible examples; Submit also checks hidden cases. Correct
                submissions restore the greenhouse scene.
              </p>
              <Link to="/game/greenhouse"><PixelButton className="w-full sm:w-auto">Open the greenhouse mission</PixelButton></Link>
            </PixelPanel>
          </>
        )}

        {pattern.slug !== 'sliding-window' && (
          <PixelPanel title="Your quest" accent="#f2a65a">
            <p className="text-sm leading-relaxed text-stone-300">
              The interactive lesson for this pattern is planned for a later game milestone. You can
              explore its analogy and pseudocode here in the meantime.
            </p>
          </PixelPanel>
        )}
      </div>
    </div>
  );
}
