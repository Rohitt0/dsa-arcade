import { Link, useParams } from 'react-router-dom';
import type { Difficulty } from '@dsa/shared';
import { useRegions } from '../features/world/useRegions';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PixelBadge, PixelButton, PixelCard } from '../components/ui';

const diffTone: Record<Difficulty, 'easy' | 'medium' | 'hard'> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export function RegionPage() {
  const { slug } = useParams();
  const { data: regions, isLoading, isError, refetch } = useRegions();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const region = regions?.find((r) => r.slug === slug);

  if (!region) {
    return (
      <EmptyState
        title="Region not found"
        message="This place isn't on the map."
        action={
          <Link to="/world">
            <PixelButton variant="secondary">Back to world</PixelButton>
          </Link>
        }
      />
    );
  }

  if (!region.unlocked) {
    return (
      <EmptyState
        title={`${region.name} is locked`}
        message="Complete earlier regions to unlock this one. (Progression arrives in a later update.)"
        action={
          <Link to="/world">
            <PixelButton variant="secondary">Back to world</PixelButton>
          </Link>
        }
      />
    );
  }

  const accent = region.theme?.accent ?? '#ffcf4e';
  const patterns = [...region.patterns].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div>
      <Link
        to="/world"
        className="mb-4 inline-block font-pixel text-[9px] uppercase tracking-wide text-sky hover:underline"
      >
        ← World map
      </Link>

      <header className="mb-6 border-l-4 pl-4" style={{ borderColor: accent }}>
        <h1 className="text-xl text-gold">{region.name}</h1>
        <p className="mt-2 max-w-prose text-sm text-stone-300">{region.description}</p>
      </header>

      {patterns.length === 0 ? (
        <EmptyState title="No patterns yet" message="This region is still being authored." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map((pattern) => (
            <Link
              key={pattern.id}
              to={`/pattern/${pattern.slug}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <PixelCard interactive className="flex h-full flex-col">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-pixel text-[11px] text-parchment">{pattern.name}</h2>
                  <PixelBadge tone={diffTone[pattern.difficulty]}>{pattern.difficulty}</PixelBadge>
                </div>
                <p className="line-clamp-3 flex-1 text-xs text-stone-300">{pattern.description}</p>
                <span className="mt-3 font-pixel text-[8px] uppercase tracking-wide text-sky">
                  Learn →
                </span>
              </PixelCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
