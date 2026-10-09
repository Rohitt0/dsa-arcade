import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChallenge, useRunExamples, useSubmitCode } from '../features/challenge/useChallenge';
import { greenhouseGame } from '../game-engine/content/greenhouse';
import type { GameEvent } from '../game-engine/types';
import { PhaserHost } from '../game-engine/PhaserHost';
import { PixelButton } from '../components/ui';
import { ErrorState, LoadingState } from '../components/feedback';
import { ProgressManager } from '../game-engine/ProgressManager';
import { greenhouseCharacter, tutorialSteps, type TutorialState } from '../game-engine/content/greenhouse-tutorial';
import { useAuthStore } from '../stores/auth.store';

const Editor = lazy(() => import('../editor/MonacoEditor'));
const loadGreenhouseScenes = () =>
  import('../game-engine/content/greenhouse-scenes').then((module) => module.greenhouseScenes);
const challengeSlug = 'maximum-sum-k-consecutive-crystals';
const stageId = greenhouseGame.stages[0].id;
const editorTips = {
  function: 'Return the largest total energy from k consecutive crystals.',
  run: 'Try your code on the visible examples.',
  submit: 'Check your solution against all tests.',
};
type TipId = keyof typeof editorTips;

function EditorTip({ id, dismiss }: { id: TipId; dismiss: () => void }) {
  return <div className="my-2 flex items-start gap-2 border-l-2 border-[#b0d28c] bg-[#20332b] p-2 text-xs leading-relaxed text-[#dcebd0]">
    <p className="flex-1"><strong className="capitalize">{id}: </strong>{editorTips[id]}</p>
    <button type="button" aria-label={`Dismiss ${id} tip`} onClick={dismiss} className="min-h-8 min-w-8 border border-[#66805c]">×</button>
  </div>;
}
type WorkbenchRect = { x: number; y: number; width: number; height: number };

const workbenchBounds = () => {
  const margin = window.innerWidth < 640 ? 8 : 16;
  const top = window.innerWidth < 640 ? 68 : 76;
  return {
    margin,
    top,
    maxWidth: Math.max(280, window.innerWidth - margin * 2),
    maxHeight: Math.max(260, window.innerHeight - top - margin),
  };
};

function TestResults({ result, label }: { result: ReturnType<typeof useRunExamples>['data']; label: string }) {
  if (!result) return null;
  return (
    <section className="mt-3 border border-[#425b4b] bg-[#13241e] p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs">
        <strong className={result.status === 'ACCEPTED' ? 'text-[#9ce5a6]' : 'text-[#ffab91]'}>
          {result.status === 'ACCEPTED' ? `${label} passed` : result.status.replaceAll('_', ' ')}
        </strong>
        <span className="font-mono text-[#d9e8dc]">{result.passed}/{result.total}</span>
      </div>
      {result.message && <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-[11px] text-[#ffb59a]">{result.message}</pre>}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {result.tests.map((test) => (
          <span key={test.caseNumber} className={`text-[11px] ${test.passed ? 'text-[#9ce5a6]' : 'text-[#ffab91]'}`}>
            Case {test.caseNumber}: {test.passed ? 'PASS' : 'FAIL'}{test.hidden ? ' · hidden' : ''}
          </span>
        ))}
      </div>
    </section>
  );
}

export function GreenhouseGamePage() {
  const scope = useAuthStore((state) => state.user?.id ?? 'guest');
  return <GreenhouseMissionPage key={scope} progressScope={scope} />;
}

function GreenhouseMissionPage({ progressScope }: { progressScope: string }) {
  const progress = useMemo(() => new ProgressManager(greenhouseGame.id, undefined, progressScope), [progressScope]);
  const { data: challenge, isLoading, isError, refetch } = useChallenge(challengeSlug);
  const runExamples = useRunExamples(challengeSlug);
  const submitSolution = useSubmitCode(challengeSlug);
  const [editedCode, setEditedCode] = useState<string | undefined>(() => {
    const saved = progress.read(stageId, 'draft')?.code;
    return typeof saved === 'string' ? saved : undefined;
  });
  const code = editedCode ?? challenge?.savedSolution?.code ?? challenge?.starterCode ?? '';
  const [resumeReady, setResumeReady] = useState(false);
  useEffect(() => {
    if (!challenge || resumeReady) return;
    if (challenge.savedSolution) {
      progress.checkpoint(stageId, 'attempted', { attempted: true });
      if (challenge.savedSolution.completed && !progress.read(stageId, 'greenhouse-restored')) {
        progress.checkpoint(stageId, 'greenhouse-restored', { completed: true });
      }
    }
    setResumeReady(true);
  }, [challenge, progress, resumeReady]);
  const [tutorial, setTutorial] = useState<TutorialState | null>(null);
  const inMission = tutorial !== null && !tutorial.active;
  const [dismissedTips, setDismissedTips] = useState(() => progress.read(stageId, 'editor-tips') ?? {});
  const dismissTip = (id: TipId) => {
    const next = { ...dismissedTips, [id]: true };
    setDismissedTips(next);
    progress.checkpoint(stageId, 'editor-tips', next);
  };
  const updateCode = (value: string | undefined) => {
    const next = value ?? '';
    setEditedCode(next);
    progress.checkpoint(stageId, 'draft', { code: next });
  };
  const [lessonMessage, setLessonMessage] = useState('Restore the greenhouse core by finding the highest total in any 3 neighboring crystals.');
  const sendActionRef = useRef<(action: string) => void>(() => {});
  const [workbench, setWorkbench] = useState<WorkbenchRect>({ x: 380, y: 100, width: 420, height: 560 });
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; rect: WorkbenchRect } | null>(null);

  useEffect(() => {
    const placeWorkbench = () => {
      const compact = window.innerWidth < 768;
      const bounds = workbenchBounds();
      const width = Math.min(bounds.maxWidth, compact ? window.innerWidth - bounds.margin * 2 : Math.max(420, window.innerWidth * 0.42), 640);
      const height = Math.min(bounds.maxHeight, compact ? window.innerHeight * 0.58 : Math.max(420, window.innerHeight * 0.76), 760);
      setWorkbench({
        x: Math.max(bounds.margin, window.innerWidth - width - bounds.margin),
        y: Math.max(bounds.top, window.innerHeight - height - bounds.margin),
        width,
        height,
      });
    };
    placeWorkbench();
    const move = (event: PointerEvent) => {
      if (dragRef.current) {
        const drag = dragRef.current;
        const bounds = workbenchBounds();
        setWorkbench((current) => ({
          ...current,
          x: Math.max(bounds.margin, Math.min(window.innerWidth - current.width - bounds.margin, drag.x + event.clientX - drag.startX)),
          y: Math.max(bounds.top, Math.min(window.innerHeight - current.height - bounds.margin, drag.y + event.clientY - drag.startY)),
        }));
      }
      if (resizeRef.current) {
        const resize = resizeRef.current;
        const bounds = workbenchBounds();
        const minWidth = Math.min(320, bounds.maxWidth);
        const minHeight = Math.min(280, bounds.maxHeight);
        setWorkbench({
          ...resize.rect,
          width: Math.max(minWidth, Math.min(window.innerWidth - resize.rect.x - bounds.margin, resize.rect.width + event.clientX - resize.startX)),
          height: Math.max(minHeight, Math.min(window.innerHeight - resize.rect.y - bounds.margin, resize.rect.height + event.clientY - resize.startY)),
        });
      }
    };
    const end = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('resize', placeWorkbench);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      window.removeEventListener('resize', placeWorkbench);
    };
  }, []);
  const onGameEvent = useCallback((event: GameEvent) => {
    if (event.type === 'game:lesson') setLessonMessage(event.payload.message);
    if (event.type === 'game:tutorial') setTutorial(event.payload);
  }, []);

  const submit = async () => {
    progress.checkpoint(stageId, 'attempted', { attempted: true });
    try {
      const result = await submitSolution.mutateAsync(code);
      if (result.status === 'ACCEPTED') sendActionRef.current('mission:restore');
    } catch { /* The existing error panel reports runner failures. */ }
  };

  if (isLoading) return <LoadingState label="Waking the greenhouse…" />;
  if (isError || !challenge) return <ErrorState title="Could not load the greenhouse mission" onRetry={() => void refetch()} />;

  const result = submitSolution.data ?? runExamples.data;
  if (!resumeReady) return <LoadingState label="Preparing the greenhouse…" />;
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#101b20] text-[#edf2e5]">
      <PhaserHost
        game={greenhouseGame}
        progressScope={progressScope}
        loadScenes={loadGreenhouseScenes}
        className="absolute inset-0 h-full w-full"
        canvasClassName="h-full w-full touch-manipulation overflow-hidden"
        statusClassName="sr-only"
        onEvent={onGameEvent}
        renderControls={(controls, sendAction) => {
          sendActionRef.current = sendAction;
          if (!inMission) return null;
          return (
            <div className="pointer-events-none absolute inset-x-3 bottom-4 z-10 flex justify-center">
              {controls.map((control) => (
                <button key={control.id} type="button" onClick={() => sendAction(control.id)} className="pointer-events-auto min-h-10 border border-[#9cb58c] bg-[#192e2a]/95 px-4 font-pixel text-[8px] text-[#dcf2ce] shadow-[3px_3px_0_#0a1112] hover:bg-[#2a473b]">
                  {control.label}
                </button>
              ))}
            </div>
          );
        }}
      />

      <header className="absolute inset-x-2 top-2 z-20 flex h-14 items-center justify-between border-2 border-[#080f12] bg-[#17262a]/95 px-2 shadow-[4px_4px_0_#0a1112] sm:inset-x-5 sm:top-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/pattern/sliding-window" aria-label="Back to Sliding Window" className="grid h-10 w-10 shrink-0 place-items-center border border-[#728c7b] text-lg text-[#dbedda]">←</Link>
          <div className="min-w-0">
            <p className="truncate font-pixel text-[8px] uppercase tracking-wide text-[#bfe4ae]">Chapter 1 · Restart the Greenhouse</p>
            <p className="truncate text-xs text-[#c5d5c8]">Maximum sum of k consecutive crystals</p>
          </div>
        </div>
        {tutorial?.active ? (
          <button type="button" className="ml-2 min-h-11 shrink-0 px-2 text-xs text-[#f0dca0] underline" onClick={() => sendActionRef.current('tutorial:skip')}>Skip intro</button>
        ) : inMission ? (
          <button type="button" disabled={runExamples.isPending || submitSolution.isPending} className="ml-2 min-h-11 shrink-0 px-2 text-xs text-[#bfe4ae] underline disabled:opacity-50" onClick={() => sendActionRef.current('tutorial:replay')}>Replay tutorial</button>
        ) : null}
      </header>

      {tutorial?.active && (() => {
        const step = tutorialSteps[tutorial.step];
        return <section aria-label="Greenhouse introduction" className="absolute inset-x-2 top-[4.75rem] z-20 mx-auto max-h-[calc(55dvh-76px)] max-w-2xl overflow-y-auto border-2 border-[#829a78] bg-[#142126]/95 p-3 shadow-[3px_3px_0_#0a1112] sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-pixel text-[10px] text-[#f0dca0]">{greenhouseCharacter.name}</p>
            <span className="text-xs text-[#a8c4ad]">{tutorial.replay ? 'Tutorial replay' : 'A new beginning'}</span>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <p className="mt-2 text-sm leading-relaxed text-[#f0f3e8] sm:text-base">{step.text}</p>
            {'calculation' in step && !tutorial.busy && <p className="mt-2 font-mono text-xl font-bold tracking-wide text-[#ffe694] sm:text-2xl">{step.calculation}</p>}
            {'detail' in step && !tutorial.busy && <p className="mt-1 text-sm text-[#bfe4ae]">{step.detail}</p>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-[#a8c4ad]">{tutorial.busy ? 'Collector at work…' : 'Continue when you’re ready.'}</span>
            <PixelButton key={tutorial.step} size="sm" disabled={tutorial.busy} onClick={() => sendActionRef.current(`tutorial:advance:${tutorial.step}`)}>
              {tutorial.replay && tutorial.step === 'stage' ? 'Return to Stage 1' : step.action}
            </PixelButton>
          </div>
        </section>;
      })()}

      {inMission && <section className="pointer-events-none absolute left-2 top-[4.75rem] z-10 max-w-[min(34rem,calc(100vw-1rem))] border border-[#829a78] bg-[#142126]/95 px-3 py-2 shadow-[3px_3px_0_#0a1112] sm:left-6 sm:top-[5.25rem] sm:px-5 sm:py-4" aria-live="polite">
        <p className="font-pixel text-[10px] leading-relaxed text-[#f0dca0] sm:text-xs">MISSION BRIEF</p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-[#f0f3e8] sm:text-base">{lessonMessage}</p>
      </section>}

      {inMission && <aside
        className="absolute z-30 flex min-h-0 flex-col overflow-hidden border-2 border-[#52625b] bg-[#11191e]/[.97] shadow-[6px_6px_0_#080f12]"
        style={{ left: workbench.x, top: workbench.y, width: workbench.width, height: workbench.height }}
      >
          <div
            className="flex min-h-12 shrink-0 touch-none cursor-grab items-center justify-between border-b border-[#354047] bg-[#1b252b] px-4 active:cursor-grabbing"
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              dragRef.current = { startX: event.clientX, startY: event.clientY, x: workbench.x, y: workbench.y };
            }}
          >
            <span className="font-pixel text-[8px] uppercase tracking-wider text-[#d8c992]">C++ Workbench</span>
            <span className="font-mono text-[11px] text-[#9ac9a0]">solution.cpp · drag header</span>
          </div>
          <div
            role="separator"
            aria-label="Resize C++ workbench"
            className="absolute bottom-0 right-0 z-20 h-7 w-7 touch-none cursor-nwse-resize border-l border-t border-[#91bd7b] bg-[#22332c] hover:bg-[#496044]"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              resizeRef.current = { startX: event.clientX, startY: event.clientY, rect: workbench };
            }}
          >
            <span aria-hidden="true" className="absolute bottom-1 right-1 text-sm leading-none text-[#cde2bd]">⤡</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-12 sm:p-4 sm:pb-12">
            <section className="mb-3 border-l-2 border-[#94c681] pl-3">
              <h1 className="font-pixel text-[8px] leading-relaxed text-[#e7d99f]">{challenge.title}</h1>
              <p className="mt-2 text-xs leading-relaxed text-[#d1dbd1]">{challenge.description}</p>
              <p className="mt-2 font-mono text-[11px] text-[#a8c4ad]">Input: n k, then n crystal values · Output: maximum k-window sum</p>
            </section>
            {!dismissedTips.function && <EditorTip id="function" dismiss={() => dismissTip('function')} />}
            <div className="h-[clamp(160px,42dvh,440px)] overflow-hidden border border-[#46555a] bg-[#0d1317]">
              <Suspense fallback={<div className="grid h-full min-h-[160px] place-items-center text-sm text-[#c5cad3]">Loading C++ editor…</div>}>
                <Editor height="100%" language="cpp" theme="vs-dark" value={code} onChange={updateCode} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, wordWrap: 'on', padding: { top: 12, bottom: 12 }, lineNumbersMinChars: 3, overviewRulerLanes: 0 }} />
              </Suspense>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
              <PixelButton className="w-full" variant="secondary" loading={runExamples.isPending} disabled={!code.trim() || submitSolution.isPending} onClick={() => { progress.checkpoint(stageId, 'attempted', { attempted: true }); submitSolution.reset(); runExamples.mutate(code); }}>
                {runExamples.isPending ? 'Running…' : 'Run examples'}
              </PixelButton>
              {!dismissedTips.run && <EditorTip id="run" dismiss={() => dismissTip('run')} />}
              </div>
              <div>
              <PixelButton className="w-full" loading={submitSolution.isPending} disabled={!code.trim() || runExamples.isPending} onClick={() => { runExamples.reset(); void submit(); }}>
                {submitSolution.isPending ? 'Submitting…' : 'Submit solution'}
              </PixelButton>
              {!dismissedTips.submit && <EditorTip id="submit" dismiss={() => dismissTip('submit')} />}
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#aebbb0]">Run checks the visible examples. Submit runs every example and hidden test; passing all tests restores the greenhouse.</p>
            {(runExamples.isError || submitSolution.isError) && <p role="alert" className="mt-2 text-xs text-[#ff9a7d]">The C++ runner could not be reached. Check that it is running, then retry.</p>}
            <TestResults result={result} label={submitSolution.data ? 'Submission' : 'Examples'} />
          </div>
      </aside>}
    </main>
  );
}
