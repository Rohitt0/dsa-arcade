import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { usePattern, useRegions } from '../features/world/useRegions';
import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PixelBadge, PixelButton, PixelPanel } from '../components/ui';
import type { Difficulty } from '@dsa/shared';
import { PhaserHost } from '../game-engine/PhaserHost';
import { trainWindowGame } from '../game-engine/content/train-window';

const loadTrainWindowScenes = () =>
  import('../game-engine/content/train-window-scenes').then((module) => module.trainWindowScenes);

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
            <PixelPanel title="The Train Window" accent="#5fc26a">
              <div className="mb-4 space-y-2 text-sm leading-relaxed text-stone-300">
                <p>
                  The conductor can inspect a few neighboring train cars at once. Help them scan the
                  train, keep track of the values, and solve a mystery crossing.
                </p>
                <p className="text-parchment">
                  Use the large controls below the game, or tap the play area. Every stage explains
                  what changed as you play.
                </p>
              </div>
              <PhaserHost
                game={trainWindowGame}
                loadScenes={loadTrainWindowScenes}
                renderControls={(controls, sendAction) => (
                  <div
                    className="mt-3 grid grid-cols-2 gap-2 xs:grid-cols-3"
                    aria-label="Game controls"
                  >
                    {controls.map((control) => (
                      <PixelButton
                        key={control.id}
                        type="button"
                        size="sm"
                        variant={
                          control.id === 'finish' || control.id === 'confirm'
                            ? 'primary'
                            : 'secondary'
                        }
                        className="w-full whitespace-normal text-center leading-relaxed"
                        onClick={() => sendAction(control.id)}
                      >
                        {control.label}
                      </PixelButton>
                    ))}
                  </div>
                )}
              />
            </PixelPanel>
            <PixelPanel title="Ready to code?" accent="#f2a65a">
              <p className="mb-3 text-sm leading-relaxed text-stone-300">
                Try a real Sliding Window problem in C++. The editor includes sample tests and gives
                feedback when a test fails.
              </p>
              <Link to="/challenge/longest-substring-without-repeating-characters">
                <PixelButton className="w-full sm:w-auto">Open C++ challenge</PixelButton>
              </Link>
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
