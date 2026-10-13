import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PixelButton } from '../components/ui';
import { LeetCodeReference } from '../components/LeetCodeReference';
import { useChallenge } from '../features/challenge/useChallenge';
import { greenhouseGame } from '../game-engine/content/greenhouse';
import { getGreenhouseStageStatus, stageHref } from '../game-engine/content/greenhouse-progress';
import { ProgressManager } from '../game-engine/ProgressManager';
import { useAuthStore } from '../stores/auth.store';

const stages = greenhouseGame.stages;
const artwork = '/images/greenhouse/greenhouse-background-clean.png';

export function PatternPage() {
  const userId = useAuthStore((state) => state.user?.id ?? 'guest');
  const totalXp = useAuthStore((state) => state.user?.xp ?? 0);
  const progress = new ProgressManager(greenhouseGame.id, undefined, userId);
  const [selectedId, setSelectedId] = useState(stages[0]!.id);
  const stageOneQuery = useChallenge(String(stages[0]!.config.challengeSlug));
  const stageTwoQuery = useChallenge(String(stages[1]!.config.challengeSlug));
  const stageThreeQuery = useChallenge(String(stages[2]!.config.challengeSlug));
  const stageFourQuery = useChallenge(String(stages[3]!.config.challengeSlug));
  const queries = [stageOneQuery, stageTwoQuery, stageThreeQuery, stageFourQuery];
  const statuses = stages.map((stage, index) => getGreenhouseStageStatus(
    stage,
    progress,
    queries[index]?.data?.savedSolution?.completed,
    Boolean(queries[index]?.data?.savedSolution?.code),
  ));
  const completedCount = statuses.filter((status) => status === 'Completed').length;
  const selectedIndex = Math.max(0, stages.findIndex((stage) => stage.id === selectedId));
  const selectedStage = stages[selectedIndex]!;
  const selectedStatus = statuses[selectedIndex]!;
  const actionLabel = selectedStatus === 'Completed' ? 'Replay stage' : selectedStatus === 'In progress' ? 'Resume stage' : 'Play stage';
  const nextIndex = statuses.findIndex((status) => status !== 'Completed');
  const inProgressIndex = statuses.lastIndexOf('In progress');
  const lastCompletedIndex = statuses.lastIndexOf('Completed');
  const journeyIndex = inProgressIndex >= 0 ? inProgressIndex : nextIndex > lastCompletedIndex ? nextIndex : Math.max(0, lastCompletedIndex);
  const journeyStage = stages[journeyIndex]!;
  const journeyLabel = completedCount === stages.length ? 'Replay adventure' : completedCount > 0 ? 'Continue adventure' : 'Start adventure';

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/world" className="inline-flex min-h-11 items-center font-pixel text-[9px] uppercase tracking-wide text-sky underline decoration-sky/50 underline-offset-4 hover:text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">← Back to adventures</Link><p className="border border-[#657b73] bg-[#17262a] px-3 py-2 font-pixel text-[8px] text-[#d8edbc]" aria-label={`${totalXp} total experience points`}>{totalXp} XP TOTAL</p></div>

    <section className="mt-5 overflow-hidden border-2 border-[#52625b] bg-[#17262a] shadow-[5px_5px_0_#080f12]">
      <div className="relative h-48 overflow-hidden border-b-2 border-[#52625b] sm:h-64 lg:h-72">
        <img src={artwork} alt="A pixel-art alpine greenhouse beside a bright lake" className="pixelated h-full w-full object-cover object-[50%_56%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101b20]/95 via-[#101b20]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
          <p className="font-pixel text-[9px] uppercase tracking-[.18em] text-[#c9e6aa]">Sliding Window · adventure</p>
          <h1 className="mt-2 text-xl text-[#f0dca0] sm:text-2xl">The Greenhouse</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white">Restore the greenhouse by mastering consecutive ranges.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4 text-xs text-[#c5d5c8]"><span>Adventure progress</span><span>{completedCount} of {stages.length} stages complete</span></div>
          <div className="mt-2 h-2 border border-[#52625b] bg-[#101b20]" role="progressbar" aria-label="Greenhouse stage progress" aria-valuemin={0} aria-valuemax={stages.length} aria-valuenow={completedCount}><div className="h-full bg-[#b4cc83]" style={{ width: `${(completedCount / stages.length) * 100}%` }} /></div>
        </div>
        <Link to={stageHref(journeyStage.id)} className="shrink-0"><PixelButton>{journeyLabel}</PixelButton></Link>
      </div>
    </section>

    <div className="mt-7 grid gap-5 lg:grid-cols-3 lg:items-start">
      <section aria-labelledby="stage-list-title" className="min-w-0 lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="font-pixel text-[8px] uppercase tracking-widest text-sky">Choose your route</p><h2 id="stage-list-title" className="mt-2 text-sm text-parchment">Greenhouse stages</h2></div>
          <p className="text-xs text-[#aabbb1]">Recommended order · every stage is open</p>
        </div>
        <ol className="space-y-3">
          {stages.map((stage, index) => {
            const selected = selectedStage.id === stage.id;
            const status = statuses[index]!;
            return <li key={stage.id}>
              <button type="button" aria-pressed={selected} onClick={() => setSelectedId(stage.id)} className={`flex min-h-[92px] w-full items-center gap-4 border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selected ? 'border-[#d6bd72] bg-[#292719] shadow-[3px_3px_0_#080f12]' : 'border-[#40534e] bg-[#17262a] hover:border-[#799585]'}`}>
                <span className={`grid h-12 w-12 shrink-0 place-items-center border-2 font-pixel text-sm ${selected ? 'border-[#d6bd72] bg-[#d6bd72] text-[#16191a]' : 'border-[#657b73] text-[#dae4d4]'}`} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-pixel text-[9px] leading-relaxed text-[#f0dca0] sm:text-[10px]">{stage.title}</span><span className={`border px-2 py-1 text-[10px] ${status === 'Completed' ? 'border-[#87b77d] text-[#b6e3a2]' : status === 'In progress' ? 'border-[#b39b55] text-[#f0dca0]' : 'border-[#53635e] text-[#bdc9c0]'}`}>{status}</span><span className="text-[10px] text-[#bfe4ae]">{status === 'Completed' ? 'Earned' : `${stage.rewardXp ?? 0} XP`}</span></span><span className="mt-2 block text-sm leading-5 text-[#c5d5c8]">{stage.objective}</span></span>
                <span className="hidden text-lg text-sky sm:block" aria-hidden="true">{selected ? '›' : '＋'}</span>
              </button>
            </li>;
          })}
        </ol>
      </section>

      <aside aria-labelledby="stage-preview-title" className="min-w-0 border-2 border-[#52625b] bg-[#17262a] shadow-[4px_4px_0_#080f12] lg:sticky lg:top-24">
        <div className="relative h-36 overflow-hidden border-b-2 border-[#52625b] sm:h-44">
          <img src={artwork} alt="Greenhouse mission scene preview" className="pixelated h-full w-full object-cover object-[50%_72%]" />
          <span className="absolute left-3 top-3 border border-[#b4cc83] bg-[#101b20]/90 px-2 py-2 font-pixel text-[8px] text-[#d8edbc]">STAGE {selectedIndex + 1}</span>
        </div>
        <div className="p-4 sm:p-5">
          <p className="font-pixel text-[8px] uppercase tracking-widest text-sky">Mission preview</p>
          <h2 id="stage-preview-title" className="mt-3 text-sm leading-relaxed text-[#f0dca0]">{selectedStage.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#c5d5c8]">{selectedStage.objective}</p>
          {selectedStage.leetcode && <LeetCodeReference reference={selectedStage.leetcode} className="mt-2" />}
          <div className="mt-5 border-l-2 border-[#b4cc83] bg-[#1c2c2c] p-3">
            <p className="font-pixel text-[8px] uppercase tracking-wide text-[#c9e6aa]">Story objective</p>
            <p className="mt-2 text-xs leading-5 text-[#d2ded2]">{[
              'Bring the greenhouse core back to life by finding the strongest neighboring crystal run.',
              'Keep the revived greenhouse powered by finding every dependable group of neighboring crystals.',
              'Give the healthy flowers a quick, efficient burst of energy with the shortest crystal group that reaches the target.',
            ][selectedIndex]}</p>
          </div>
          <p className="mt-4 text-xs text-[#aabbb1]">Status: <span className="text-parchment">{selectedStatus}</span></p>
          <p className="mt-2 text-xs text-[#aabbb1]">Reward: <span className="text-[#bfe4ae]">{selectedStatus === 'Completed' ? 'Earned' : `${selectedStage.rewardXp ?? 0} XP`}</span></p>
          <Link to={stageHref(selectedStage.id)} className="mt-5 block"><PixelButton fullWidth>{actionLabel}</PixelButton></Link>
          <Link to={stageHref(stages[0]!.id, { replayTutorial: true })} className="mt-2 flex min-h-11 items-center justify-center px-2 text-center font-pixel text-[8px] uppercase tracking-wide text-sky underline decoration-sky/50 underline-offset-4 hover:text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Replay introduction</Link>
        </div>
      </aside>
    </div>
  </div>;
}
