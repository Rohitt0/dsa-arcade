import { Link } from 'react-router-dom';
import type { Region } from '@dsa/shared';
import { useRegions } from '../features/world/useRegions';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PixelBadge } from '../components/ui';
import { cn } from '../lib/cn';

function LockGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="4" y="11" width="16" height="9" rx="1" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function RegionNode({ region, index }: { region: Region; index: number }) {
  const accent = region.theme?.accent ?? '#ffcf4e';
  const patternCount = region.patterns.length;

  const card = (
    <div
      className={cn(
        'pixel-frame flex items-center gap-4 p-4',
        region.unlocked ? 'transition-transform hover:-translate-y-0.5' : 'opacity-60 grayscale',
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-ink font-pixel text-sm text-ink"
        style={{ backgroundColor: region.unlocked ? accent : '#6b7280' }}
      >
        {region.unlocked ? index + 1 : <LockGlyph />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-pixel text-[11px] text-parchment sm:text-xs">{region.name}</h2>
          <PixelBadge tone={region.unlocked ? 'open' : 'locked'}>
            {region.unlocked ? 'Open' : 'Locked'}
          </PixelBadge>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-stone-300">{region.description}</p>
        <p className="mt-2 font-pixel text-[8px] uppercase tracking-wide text-stone-400">
          {patternCount} pattern{patternCount === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );

  if (!region.unlocked) {
    return (
      <li aria-disabled="true" title="Locked — complete earlier regions to unlock (coming soon)">
        {card}
      </li>
    );
  }

  return (
    <li>
      <Link
        to={`/region/${region.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {card}
      </Link>
    </li>
  );
}

export function WorldMapPage() {
  const { data: regions, isLoading, isError, refetch } = useRegions();

  if (isLoading) return <LoadingState label="Loading the world…" />;
  if (isError)
    return <ErrorState message="Could not load the world map." onRetry={() => void refetch()} />;
  if (!regions || regions.length === 0)
    return <EmptyState title="No regions yet" message="The world is still being drawn." />;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl text-gold">World Map</h1>
        <p className="mt-2 text-sm text-stone-300">
          Follow the path. Each region teaches a new way of thinking.
        </p>
      </header>
      <ol className="mx-auto flex max-w-2xl flex-col gap-4">
        {regions.map((region, i) => (
          <RegionNode key={region.id} region={region} index={i} />
        ))}
      </ol>
    </div>
  );
}
