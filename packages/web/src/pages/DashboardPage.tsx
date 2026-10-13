import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { PixelButton, PixelCard, PixelPanel } from '../components/ui';
import { useChallenge } from '../features/challenge/useChallenge';
import { greenhouseGame } from '../game-engine/content/greenhouse';
import { getGreenhouseStageStatus, stageHref } from '../game-engine/content/greenhouse-progress';
import { ProgressManager } from '../game-engine/ProgressManager';
import { useAuthStore } from '../stores/auth.store';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <PixelCard className="text-center">
      <p className="font-pixel text-lg text-gold">{value}</p>
      <p className="mt-2 font-pixel text-[8px] uppercase tracking-wide text-stone-400">{label}</p>
    </PixelCard>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const userId = useAuthStore((state) => state.user?.id ?? 'guest');
  const progress = new ProgressManager(greenhouseGame.id, undefined, userId);
  const stageOneQuery = useChallenge(String(greenhouseGame.stages[0]!.config.challengeSlug));
  const stageTwoQuery = useChallenge(String(greenhouseGame.stages[1]!.config.challengeSlug));
  const stageThreeQuery = useChallenge(String(greenhouseGame.stages[2]!.config.challengeSlug));
  const stageFourQuery = useChallenge(String(greenhouseGame.stages[3]!.config.challengeSlug));
  const stageQueries = [stageOneQuery, stageTwoQuery, stageThreeQuery, stageFourQuery];
  const statuses = greenhouseGame.stages.map((stage, index) => getGreenhouseStageStatus(
    stage,
    progress,
    stageQueries[index]?.data?.savedSolution?.completed,
    Boolean(stageQueries[index]?.data?.savedSolution?.code),
  ));
  const completedCount = statuses.filter((status) => status === 'Completed').length;

  return (
    <div>
      <header className="mb-6">
          <h1 className="text-xl text-gold">
          Progress{user ? ` · ${user.username}` : ''}
        </h1>
        <p className="mt-2 text-sm text-stone-300">Here's where your adventure stands.</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatTile label="XP" value={String(user?.xp ?? 0)} />
        <StatTile label="Greenhouse stages" value={`${completedCount}/${greenhouseGame.stages.length}`} />
      </div>

      <PixelPanel title="Continue your journey">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-300">
            {completedCount === greenhouseGame.stages.length ? 'All implemented greenhouse stages are complete.' : 'Pick up a greenhouse stage or explore the other adventure.'}
          </p>
          <Link to="/world" className="w-full sm:w-auto">
            <PixelButton fullWidth>View adventures</PixelButton>
          </Link>
        </div>
      </PixelPanel>

      <section className="mt-6" aria-labelledby="greenhouse-progress-title">
        <h2 id="greenhouse-progress-title" className="mb-3 font-pixel text-[10px] uppercase tracking-wide text-sky">The Greenhouse</h2>
        <ol className="space-y-2">
          {greenhouseGame.stages.map((stage, index) => <li key={stage.id}>
            <Link to={stageHref(stage.id)} className="flex min-h-14 items-center justify-between gap-3 border-2 border-ink bg-night-800 px-4 py-3 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <span className="min-w-0"><span className="font-pixel text-[8px] text-stone-400">STAGE {index + 1}</span><span className="ml-3 font-pixel text-[9px] text-parchment">{stage.title}</span></span>
              <span className="shrink-0 text-xs text-sky">{statuses[index]}</span>
            </Link>
          </li>)}
        </ol>
      </section>
    </div>
  );
}
