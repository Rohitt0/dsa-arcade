import { Link } from 'react-router-dom';
import { useChallenge } from '../features/challenge/useChallenge';
import { PixelButton } from '../components/ui';
import { greenhouseGame } from '../game-engine/content/greenhouse';
import { getGreenhouseStageStatus, stageHref } from '../game-engine/content/greenhouse-progress';
import { ProgressManager } from '../game-engine/ProgressManager';
import { useAuthStore } from '../stores/auth.store';

const greenhouseStages = greenhouseGame.stages;
const greenhouseArtwork = '/images/greenhouse/greenhouse-background-clean.png';

function ObservatoryArt() {
  return <div aria-hidden="true" className="relative h-full min-h-48 overflow-hidden bg-[radial-gradient(ellipse_at_50%_110%,#176879_0%,#142c49_42%,#101727_100%)]">
    <div className="absolute left-1/2 top-5 h-28 w-28 -translate-x-1/2 rounded-full border border-sky/60 bg-[radial-gradient(circle_at_35%_30%,#f3dfa5_0_3%,#cb965b_4%_10%,#614e5b_12%_16%,#152a42_18%_100%)] shadow-[0_0_50px_#67c5e477]" />
    <div className="absolute left-[18%] top-8 h-1 w-1 bg-parchment shadow-[70px_28px_0_1px_#f0dca0,160px_-8px_0_0_#d9efff,240px_42px_0_1px_#f0dca0,-40px_78px_0_0_#d9efff,300px_92px_0_0_#f0dca0]" />
    <div className="absolute inset-x-0 bottom-0 h-16 border-t-2 border-[#d1b36b] bg-[#172538] [clip-path:polygon(0_20%,15%_0,31%_28%,52%_4%,73%_30%,88%_8%,100%_26%,100%_100%,0_100%)]" />
    <div className="absolute bottom-8 left-1/2 h-24 w-10 -translate-x-1/2 border-x-2 border-[#d1b36b] bg-[#273547]" />
    <div className="absolute bottom-24 left-1/2 h-7 w-16 -translate-x-1/2 border-2 border-[#d1b36b] bg-[#273547]" />
    <div className="absolute bottom-[7.5rem] left-1/2 h-20 w-1 -translate-x-1/2 bg-[#d1b36b]" />
    <div className="absolute bottom-[12.2rem] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-[#f0dca0] bg-[#f0dca0] shadow-[0_0_18px_8px_#f0dca066]" />
    <span className="absolute bottom-3 left-4 font-pixel text-[8px] uppercase tracking-widest text-sky">The Observatory · signal offline</span>
  </div>;
}

export function WorldMapPage() {
  const userId = useAuthStore((state) => state.user?.id ?? 'guest');
  const totalXp = useAuthStore((state) => state.user?.xp ?? 0);
  const progress = new ProgressManager(greenhouseGame.id, undefined, userId);
  const stageOneQuery = useChallenge(String(greenhouseStages[0]!.config.challengeSlug));
  const stageTwoQuery = useChallenge(String(greenhouseStages[1]!.config.challengeSlug));
  const stageThreeQuery = useChallenge(String(greenhouseStages[2]!.config.challengeSlug));
  const stageFourQuery = useChallenge(String(greenhouseStages[3]!.config.challengeSlug));
  const stageQueries = [stageOneQuery, stageTwoQuery, stageThreeQuery, stageFourQuery];
  const statuses = greenhouseStages.map((stage, index) => getGreenhouseStageStatus(
    stage,
    progress,
    stageQueries[index]?.data?.savedSolution?.completed,
    Boolean(stageQueries[index]?.data?.savedSolution?.code),
  ));
  const completedCount = statuses.filter((status) => status === 'Completed').length;
  const hasProgress = statuses.some((status) => status !== 'Not started');
  const inProgressIndex = statuses.lastIndexOf('In progress');
  const nextIndex = statuses.findIndex((status) => status !== 'Completed');
  const lastCompletedIndex = statuses.lastIndexOf('Completed');
  const resumeIndex = inProgressIndex >= 0 ? inProgressIndex : nextIndex > lastCompletedIndex ? nextIndex : lastCompletedIndex;
  const resumeStage = resumeIndex >= 0 ? greenhouseStages[resumeIndex] : undefined;
  const resumeHref = resumeStage ? stageHref(resumeStage.id) : stageHref(greenhouseStages[0]!.id);

  return <div className="mx-auto max-w-6xl">
    <header className="mb-8 sm:mb-10">
      <p className="font-pixel text-[9px] uppercase tracking-[.2em] text-sky">DSA Arcade · two paths are open</p>
      <h1 className="mt-4 text-xl text-gold sm:text-2xl">Choose your adventure</h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">Learn a pattern. Restore a little piece of the world.</p><p className="border border-[#657b73] bg-[#17262a] px-3 py-2 font-pixel text-[8px] text-[#d8edbc]">{totalXp} XP TOTAL</p></div>
    </header>

    {hasProgress && resumeStage && <section className="mb-8 flex flex-col gap-4 border-2 border-[#927b3c] bg-[#292719] p-4 shadow-[4px_4px_0_#080b13] sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-label="Continue your journey">
      <div>
        <p className="font-pixel text-[9px] uppercase tracking-widest text-gold">Continue your journey</p>
        <p className="mt-2 text-sm text-parchment"><span className="text-sky">Sliding Window</span><span aria-hidden="true"> · </span>{resumeStage.title}</p>
      </div>
      <Link to={resumeHref} className="shrink-0"><PixelButton>Resume</PixelButton></Link>
    </section>}

    <section aria-label="Available adventures" className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
      <article className="flex min-w-0 flex-col overflow-hidden border-2 border-[#52625b] bg-[#17262a] shadow-[5px_5px_0_#080f12]">
        <div className="relative h-52 overflow-hidden border-b-2 border-[#52625b] sm:h-60">
          <img src={greenhouseArtwork} alt="Pixel-art greenhouse by a lake beneath alpine peaks" className="pixelated h-full w-full object-cover object-[50%_63%]" />
          <span className="absolute left-3 top-3 border border-[#b4cc83] bg-[#101b20]/90 px-3 py-2 font-pixel text-[8px] uppercase tracking-wider text-[#d8edbc]">Sliding Window</span>
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm text-[#f0dca0] sm:text-base">The Greenhouse</h2>
            <span className="text-xs text-[#b7c8b9]">{completedCount} / {greenhouseStages.length} stages complete</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#c5d5c8]">Restore the greenhouse by mastering consecutive ranges.</p>
          <div className="mt-5 h-2 border border-[#52625b] bg-[#101b20]" role="progressbar" aria-label="Greenhouse stage progress" aria-valuemin={0} aria-valuemax={greenhouseStages.length} aria-valuenow={completedCount}>
            <div className="h-full bg-[#b4cc83]" style={{ width: `${(completedCount / greenhouseStages.length) * 100}%` }} />
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
            <Link to={completedCount === greenhouseStages.length ? stageHref(greenhouseStages[0]!.id) : resumeHref} className="sm:flex-1">
              <PixelButton fullWidth>{completedCount === greenhouseStages.length ? 'Replay adventure' : hasProgress ? 'Continue' : 'Start adventure'}</PixelButton>
            </Link>
            <Link to="/pattern/sliding-window" className="inline-flex min-h-11 items-center justify-center px-3 font-pixel text-[8px] uppercase tracking-wide text-sky underline decoration-sky/50 underline-offset-4 hover:text-parchment">View stages</Link>
          </div>
        </div>
      </article>

      <article className="flex min-w-0 flex-col overflow-hidden border-2 border-[#52625b] bg-[#17262a] shadow-[5px_5px_0_#080f12]">
        <div className="h-52 border-b-2 border-[#52625b] sm:h-60"><ObservatoryArt /></div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-sm text-[#f0dca0] sm:text-base">The Observatory — Binary Search</h2>
            <span className="border border-[#b4cc83] px-2 py-1 font-pixel text-[8px] uppercase tracking-wide text-[#d8edbc]">Stage 1 playable</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#c5d5c8]">Locate hidden signals by narrowing a sorted search range.</p>
          <p className="mt-auto pt-6 text-xs leading-5 text-[#94a6a6]">Stage 1 · Find the Signal · 100 XP reward</p>
          <Link to="/pattern/binary-search" className="mt-4 inline-flex min-h-11 items-center justify-center border border-[#657b73] px-4 font-pixel text-[8px] uppercase tracking-wide text-sky hover:border-sky">Choose a Binary Search stage</Link>
        </div>
      </article>
    </section>
  </div>;
}
