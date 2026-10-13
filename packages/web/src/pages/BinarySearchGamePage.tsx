import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useChallenge, useRunExamples, useSubmitCode } from '../features/challenge/useChallenge';
import { PhaserHost } from '../game-engine/PhaserHost';
import { ProgressManager } from '../game-engine/ProgressManager';
import type { GameControl, GameEvent } from '../game-engine/types';
import { binarySearchGame, binarySearchStage } from '../game-engine/content/binary-search-game';
import { useAuthStore } from '../stores/auth.store';
import { LeetCodeReference } from '../components/LeetCodeReference';
import { PixelButton } from '../components/ui';

const Editor = lazy(() => import('../editor/MonacoEditor'));
const loadScenes = () => import('../game-engine/content/binary-search-scenes').then((module) => module.binarySearchScenes);
const LAYOUT_KEY = 'binary-search-workbench-layout-v2';
type TutorialEvent = Extract<GameEvent, { type: 'game:binary-tutorial' }>['payload'];
type Layout = { split: number; problemHeight: number };
type FloatingRect = { x: number; y: number; width: number; height: number };
const defaultLayout: Layout = { split: 62, problemHeight: 190 };
const defaultFloatingRect = (): FloatingRect => ({ x: Math.max(12, window.innerWidth - 548), y: 12, width: Math.min(520, window.innerWidth - 24), height: Math.min(760, window.innerHeight - 84) });
function readFloatingRect(): FloatingRect {
  const fallback = defaultFloatingRect();
  try {
    const saved = JSON.parse(localStorage.getItem('binary-search-workbench-window-v1') ?? 'null') as Partial<FloatingRect> | null;
    const width = Math.min(window.innerWidth - 24, Math.max(400, saved?.width ?? fallback.width));
    const height = Math.min(window.innerHeight - 80, Math.max(360, saved?.height ?? fallback.height));
    return { x: Math.max(12, Math.min(window.innerWidth - width - 12, saved?.x ?? fallback.x)), y: Math.max(12, Math.min(window.innerHeight - height - 68, saved?.y ?? fallback.y)), width, height };
  } catch { return fallback; }
}
function readLayout(): Layout {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? 'null') as Partial<Layout> | null;
    return { split: Number.isFinite(saved?.split) ? Math.min(74, Math.max(46, saved!.split!)) : defaultLayout.split,
      problemHeight: Number.isFinite(saved?.problemHeight) ? Math.min(290, Math.max(115, saved!.problemHeight!)) : defaultLayout.problemHeight };
  } catch { return defaultLayout; }
}

export function BinarySearchGamePage() {
  const scope = useAuthStore((state) => state.user?.id ?? 'guest');
  const user = useAuthStore((state) => state.user);
  const progress = useMemo(() => new ProgressManager(binarySearchGame.id, undefined, scope), [scope]);
  const challenge = useChallenge(binarySearchStage.challengeSlug);
  const run = useRunExamples(binarySearchStage.challengeSlug);
  const submit = useSubmitCode(binarySearchStage.challengeSlug);
  const queryClient = useQueryClient();
  const [tutorial, setTutorial] = useState<TutorialEvent | null>({ active: true, title: '', message: '', step: '' });
  const [code, setCode] = useState('');
  const [completed, setCompleted] = useState(false);
  const [earned, setEarned] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [layout, setLayout] = useState(readLayout);
  const [floating, setFloating] = useState(() => window.innerWidth >= 1024);
  const [floatingRect, setFloatingRect] = useState(readFloatingRect);
  const [mobileView, setMobileView] = useState<'game' | 'code'>('game');
  const [problemOpen, setProblemOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);
  const splitDrag = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ px: number; py: number; width: number; height: number } | null>(null);
  const submitSeq = useRef(0);
  const alive = useRef(true);
  const sceneActionRef = useRef<(action: string) => void>(() => {});

  useEffect(() => { alive.current = true; return () => { alive.current = false; submitSeq.current++; }; }, []);
  useEffect(() => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* Layout preference is optional. */ } }, [layout]);
  useEffect(() => { try { localStorage.setItem('binary-search-workbench-window-v1', JSON.stringify(floatingRect)); } catch { /* Window position is optional. */ } }, [floatingRect]);
  useEffect(() => {
    const clampWindow = () => {
      if (window.innerWidth < 1024) { setFloating(false); return; }
      const bounds = shellRef.current?.getBoundingClientRect();
      setFloatingRect((current) => {
        const maxWidth = Math.max(400, (bounds?.width ?? window.innerWidth) - 24);
        const maxHeight = Math.max(320, (bounds?.height ?? window.innerHeight - 56) - 24);
        const width = Math.min(maxWidth, Math.max(400, current.width));
        const height = Math.min(maxHeight, Math.max(320, current.height));
        return { x: Math.max(12, Math.min((bounds?.width ?? window.innerWidth) - width - 12, current.x)), y: Math.max(12, Math.min((bounds?.height ?? window.innerHeight - 56) - height - 12, current.y)), width, height };
      });
    };
    window.addEventListener('resize', clampWindow);
    return () => window.removeEventListener('resize', clampWindow);
  }, []);
  useEffect(() => {
    if (!challenge.data) return;
    const draft = progress.read(binarySearchStage.id, 'draft')?.code;
    setCode(typeof draft === 'string' ? draft : challenge.data.savedSolution?.code ?? challenge.data.starterCode);
    setCompleted(Boolean(challenge.data.savedSolution?.completed));
    if (challenge.data.savedSolution?.completed) sceneActionRef.current('mission:restore-state');
  }, [challenge.data, progress]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!shellRef.current) return;
      const rect = shellRef.current.getBoundingClientRect();
      if (splitDrag.current) {
        const availableWidth = Math.max(1, rect.width - 412);
        const percent = ((event.clientX - rect.left) / availableWidth) * 100;
        setLayout((current) => ({ ...current, split: Math.max(46, Math.min(74, percent)) }));
      } else if (dragRef.current) {
        const drag = dragRef.current;
        setFloatingRect((current) => ({ ...current, x: Math.max(12, Math.min(rect.width - current.width - 12, drag.x + event.clientX - drag.px)), y: Math.max(12, Math.min(rect.height - current.height - 12, drag.y + event.clientY - drag.py)) }));
      } else if (resizeRef.current) {
        const start = resizeRef.current;
        setFloatingRect((current) => ({ ...current, width: Math.max(400, Math.min(rect.width - current.x - 12, start.width + event.clientX - start.px)), height: Math.max(320, Math.min(rect.height - current.y - 12, start.height + event.clientY - start.py)) }));
      }
    };
    const up = () => { splitDrag.current = false; dragRef.current = null; resizeRef.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);
  const onEvent = useCallback((event: GameEvent) => {
    if (event.type === 'game:binary-tutorial') { setTutorial(event.payload); if (event.payload.step === 'success') setCompleted(true); }
  }, []);
  const controls = useCallback((_available: GameControl[], sendAction: (action: string) => void) => {
    sceneActionRef.current = sendAction;
    if (!tutorial?.active || !tutorial.choices?.length) return null;
    return <section className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-xl border-2 border-[#b4cc83] bg-[#142126]/[.97] p-3 shadow-[5px_5px_0_#080f12] sm:bottom-4 sm:p-4" aria-live="polite" aria-atomic="true">
      <p className="font-pixel text-[9px] uppercase tracking-widest text-[#bfe4ae]">{tutorial.title}</p>
      <p className="mt-2 text-sm leading-6 text-[#f0f3e8]">{tutorial.message}</p>
      <p className="mt-1 text-[10px] text-[#a8c4ad]">Guided reference demonstration · separate from your C++ execution</p>
      <div className="mt-3 flex flex-wrap gap-2">{tutorial.choices.map((choice) => <button key={choice.id} type="button" onClick={() => sendAction(`tutorial:${choice.id}`)} className="min-h-10 border border-[#a7c894] bg-[#20332b] px-4 font-pixel text-[8px] text-[#e7f1dc] hover:bg-[#2a4938]">{choice.label}</button>)}</div>
    </section>;
  }, [tutorial]);
  const updateCode = (value: string) => { setCode(value); progress.checkpoint(binarySearchStage.id, 'draft', { code: value }); };
  const runCode = () => { run.reset(); submit.reset(); setResultsOpen(true); progress.checkpoint(binarySearchStage.id, 'attempted', { attempted: true }); run.mutate(code); };
  const submitCode = async () => {
    const id = ++submitSeq.current; run.reset(); submit.reset(); setResultsOpen(true);
    try {
      const answer = await submit.mutateAsync(code);
      if (!alive.current || id !== submitSeq.current) return;
      if (answer.status === 'ACCEPTED') {
        setCompleted(true); setEarned(answer.xpAward?.awarded ? answer.xpAward.amount : 0);
        if (answer.xpAward) { const auth = useAuthStore.getState(); if (auth.user) auth.setUser({ ...auth.user, xp: answer.xpAward.totalXp }); }
        progress.checkpoint(binarySearchStage.id, 'completed', { completed: true }); sceneActionRef.current('mission:restore');
        await queryClient.invalidateQueries({ queryKey: ['challenge', binarySearchStage.challengeSlug] });
      }
    } catch { /* The mutation renders the API or runner error below. */ }
  };
  const displayedResult = submit.data ?? run.data;
  const result = submit.data;
  const success = tutorial?.step === 'success';
  const canEdit = Boolean(challenge.data && !tutorial?.active && !success);
  const resetLayout = () => { setLayout(defaultLayout); setFloating(false); setFloatingRect(defaultFloatingRect()); setMobileView('game'); };
  const beginWorkbenchDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || window.innerWidth < 1024 || (event.target as HTMLElement).closest('button')) return;
    const panel = event.currentTarget.parentElement?.getBoundingClientRect();
    const workspace = shellRef.current?.getBoundingClientRect();
    if (!panel || !workspace) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const x = floating ? floatingRect.x : panel.left - workspace.left;
    const y = floating ? floatingRect.y : panel.top - workspace.top;
    dragRef.current = { px: event.clientX, py: event.clientY, x, y };
    if (!floating) {
      const width = Math.min(panel.width, workspace.width - 24);
      const height = Math.min(panel.height, workspace.height - 24);
      setFloatingRect((current) => ({ ...current, x: Math.max(12, Math.min(workspace.width - width - 12, x)), y: Math.max(12, Math.min(workspace.height - height - 12, y)), width, height }));
      setFloating(true);
    }
    document.body.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
  };
  const beginWorkbenchResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { px: event.clientX, py: event.clientY, width: floatingRect.width, height: floatingRect.height };
    document.body.style.cursor = 'nwse-resize'; document.body.style.userSelect = 'none';
  };

  return <main className="relative grid h-dvh min-h-0 w-full overflow-hidden border-2 border-[#52625b] bg-[#101727] text-[#e8ede5] [grid-template-rows:56px_minmax(0,1fr)]">
    <header className="z-30 flex min-w-0 items-center gap-3 border-b-2 border-[#52625b] bg-[#121d22] px-3 sm:px-5">
      <Link to="/pattern/binary-search" className="inline-flex min-h-10 shrink-0 items-center border border-[#657b73] px-3 font-pixel text-[8px] uppercase tracking-wide text-[#d5e3d6]">← <span className="ml-1 hidden sm:inline">Back to Stages</span><span className="ml-1 sm:hidden">Stages</span></Link>
      <h1 className="min-w-0 flex-1 truncate font-pixel text-[9px] leading-tight text-[#f0dca0] sm:text-[11px]">Binary Search <span className="text-[#a8c4ad]">·</span> Stage 1: Find the Signal</h1>
      <button type="button" onClick={() => sceneActionRef.current('tutorial:replay')} className="hidden min-h-10 shrink-0 border border-[#657b73] px-3 font-pixel text-[8px] uppercase text-[#d5e3d6] sm:inline-flex sm:items-center">Replay Tutorial</button>
      <span className="shrink-0 border border-[#766b42] bg-[#2a2b20] px-2 py-2 font-pixel text-[8px] text-[#f0dca0]" aria-label={`${user?.xp ?? 0} experience points`}>XP {user?.xp ?? 0}</span>
      {canEdit && <div className="ml-auto flex shrink-0 gap-1 rounded border border-[#4b6256] p-1 lg:hidden"><button type="button" onClick={() => setMobileView('game')} className={`min-h-8 px-2 text-xs ${mobileView === 'game' ? 'bg-[#284334] text-white' : 'text-[#c4d1c8]'}`}>Game</button><button type="button" onClick={() => setMobileView('code')} className={`min-h-8 px-2 text-xs ${mobileView === 'code' ? 'bg-[#284334] text-white' : 'text-[#c4d1c8]'}`}>Code</button></div>}
    </header>

    <div ref={shellRef} className={`relative grid min-h-0 min-w-0 ${tutorial?.active || !canEdit || floating ? '[grid-template-columns:minmax(0,1fr)]' : 'lg:[grid-template-columns:minmax(0,var(--game-fr))_12px_minmax(400px,var(--code-fr))]'} grid-cols-1`} style={{ '--game-fr': `${layout.split}fr`, '--code-fr': `${100 - layout.split}fr` } as React.CSSProperties}>
      <section className={`relative min-h-0 min-w-0 overflow-hidden bg-[#101b25] ${canEdit && mobileView === 'code' ? 'hidden lg:block' : ''}`} aria-label="Observatory game scene">
        <PhaserHost game={binarySearchGame} loadScenes={loadScenes} progressScope={scope} initialStageId={binarySearchStage.id} autoAdvance={false} onEvent={onEvent} renderControls={controls} className="h-full min-h-0 w-full" canvasClassName="h-full w-full overflow-hidden pixelated" statusClassName="sr-only" />
        {!tutorial?.active && <span className="pointer-events-none absolute left-3 top-3 z-10 border border-[#526d63] bg-[#101b20]/90 px-3 py-2 font-mono text-xs text-[#c5dfc5]">{completed ? 'Signal restored' : 'Signal offline'}</span>}
      </section>
      {canEdit && !tutorial?.active && !floating && <div role="separator" aria-label="Resize game and code panels" aria-orientation="vertical" aria-valuenow={layout.split} tabIndex={0} className="group z-20 hidden cursor-col-resize touch-none items-center justify-center bg-[#101820] hover:bg-[#20352f] lg:flex" onPointerDown={(event) => { event.preventDefault(); splitDrag.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} onKeyDown={(event) => { if (event.key === 'ArrowLeft') setLayout((current) => ({ ...current, split: Math.min(74, current.split + 2) })); if (event.key === 'ArrowRight') setLayout((current) => ({ ...current, split: Math.max(46, current.split - 2) })); }}><span className="h-12 w-1 rounded bg-[#718078] group-hover:bg-[#c6d89e]" /></div>}
      {canEdit && <aside style={floating ? { left: floatingRect.x, top: floatingRect.y, width: floatingRect.width, height: floatingRect.height } : undefined} className={`min-h-0 min-w-0 flex-col border-2 border-[#52625b] bg-[#11191e] ${floating ? 'absolute z-30 flex resize-none overflow-hidden shadow-[8px_8px_0_#080f12]' : `overflow-y-auto lg:overflow-hidden ${mobileView === 'game' ? 'hidden lg:flex' : 'flex lg:flex'}`}`}>
        <div onPointerDown={beginWorkbenchDrag} className={`flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-[#354047] bg-[#1b252b] px-3 ${window.innerWidth >= 1024 ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}>
          <span className="font-pixel text-[8px] uppercase tracking-wider text-[#d8c992]">C++ Workbench</span>
          <div className="flex items-center gap-2"><span className="hidden font-mono text-[10px] text-[#9ac9a0] sm:inline">{floating ? 'Drag title · resize corner' : 'Drag title to move'}</span>{floating ? <button type="button" onClick={() => setFloating(false)} className="min-h-8 border border-[#657b73] px-2 text-[10px] text-[#d5e3d6]">Dock</button> : <button type="button" onClick={() => { setFloatingRect(readFloatingRect()); setFloating(true); }} className="min-h-8 border border-[#91bd7b] bg-[#263a30] px-2 text-[10px] text-[#e3f0d7]">Float</button>}<button type="button" onClick={resetLayout} className="min-h-8 border border-[#657b73] px-2 text-[10px] text-[#d5e3d6]">Reset layout</button></div>
        </div>
        <section className="min-h-0 shrink-0 overflow-y-auto border-b border-[#354047] px-3 py-2" style={{ height: problemOpen ? `min(${layout.problemHeight}px, 24dvh)` : 40 }}>
          <button type="button" aria-expanded={problemOpen} onClick={() => setProblemOpen((open) => !open)} className="flex min-h-7 w-full items-center justify-between text-left"><span className="font-pixel text-[8px] uppercase tracking-wider text-[#d8c992]">Problem · {challenge.data?.title ?? 'Find the Signal'}</span><span aria-hidden="true">{problemOpen ? '−' : '+'}</span></button>
          {problemOpen && <div className="pt-1 text-[13px] leading-5 text-[#d1dbd1]">
            <p>Given a sorted array of distinct integers <code className="font-mono text-[#d9e8dc]">readings</code> and an integer <code className="font-mono text-[#d9e8dc]">target</code>, return the target’s zero-based index. Return -1 if it does not appear.</p>
            <p className="mt-1 font-mono text-[11px] text-[#a8c4ad]">Input: readings = [{binarySearchStage.example.readings.join(', ')}], target = {binarySearchStage.example.target}<br/>Output: {binarySearchStage.example.answer}</p>
            <p className="font-mono text-[10px] leading-4 text-[#a8c4ad]">Also: [2, 6, 11, 19, 28], target 13 → -1 · [7], target 7 → 0. Required complexity O(log n).</p>
            <div className="flex flex-wrap items-center gap-x-3"><LeetCodeReference reference={binarySearchStage.leetcode} className="mt-1"/><button type="button" onClick={() => sceneActionRef.current('mission:preview-missing')} className="min-h-7 text-[11px] text-[#bfe4ae] underline">Preview missing signal</button><button type="button" onClick={() => setHintLevel((level) => Math.min(4, level + 1))} disabled={hintLevel >= 4} className="min-h-7 text-[11px] text-[#bfe4ae] underline disabled:opacity-60">{hintLevel >= 4 ? 'All hints revealed' : `Hint ${hintLevel + 1}/4`}</button></div>
            {hintLevel > 0 && <p className="mt-1 border-l-2 border-[#b4cc83] pl-2 text-xs leading-4 text-[#dcebd0]">{['Keep two indices around the remaining search range.','Compare the middle reading with the target.','If middle is smaller, move left to mid + 1; if larger, move right to mid - 1.','If left becomes greater than right, return -1.'][hintLevel - 1]}</p>}
          </div>}
        </section>
        <div className="min-h-[280px] flex-1 overflow-hidden p-2">
          <div className="h-full min-h-[280px] overflow-hidden border border-[#46555a] bg-[#0d1317]">
            {!challenge.data ? <div className="grid h-full place-items-center text-sm text-[#c5cad3]">Loading challenge…</div> : <Suspense fallback={<div className="grid h-full place-items-center text-sm text-[#c5cad3]">Loading C++ editor…</div>}><Editor height="100%" language="cpp" theme="vs-dark" value={code} onChange={(value) => updateCode(value ?? '')} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, wordWrap: 'on', padding: { top: 10, bottom: 10 } }}/></Suspense>}
          </div>
        </div>
        <footer className="shrink-0 border-t border-[#435249] bg-[#17231e] p-2">
          <div className="grid grid-cols-2 gap-2"><PixelButton variant="secondary" fullWidth loading={run.isPending} disabled={!code.trim() || submit.isPending} onClick={runCode}>Run examples</PixelButton><PixelButton fullWidth loading={submit.isPending} disabled={!code.trim() || run.isPending} onClick={() => void submitCode()}>Submit</PixelButton></div>
          <p className="mt-1 text-center text-[10px] leading-4 text-[#aebbb0]">Run checks visible examples · Submit checks hidden tests. Completion restores the signal and awards XP.</p>
          {(displayedResult || run.isError || submit.isError) && <div className="mt-1 border-t border-[#435249] pt-1"><button type="button" aria-expanded={resultsOpen} onClick={() => setResultsOpen((open) => !open)} className="min-h-7 text-[11px] text-[#c2d6c4]">{resultsOpen ? 'Hide results' : 'Show results'}{displayedResult ? ` · ${displayedResult.status}` : ''}</button>
            {resultsOpen && <div aria-live="polite" className="max-h-24 overflow-y-auto text-xs">{(run.isError || submit.isError) ? <p role="alert" className="text-[#ff9a7d]">The C++ runner could not be reached. Check the API and runner, then retry.</p> : displayedResult && <><p className={displayedResult.status === 'ACCEPTED' ? 'text-[#9ce5a6]' : 'text-[#ffab91]'}>{displayedResult.passed} / {displayedResult.total} cases passed {result?.xpAward?.awarded ? `· +${result.xpAward.amount} XP` : ''}</p>{displayedResult.message && <pre className="whitespace-pre-wrap text-[#ffb59a]">{displayedResult.message}</pre>}</>}</div>}
          </div>}
        </footer>
        {floating && <button type="button" aria-label="Resize C++ workbench" onPointerDown={beginWorkbenchResize} className="absolute bottom-0 right-0 z-10 h-7 w-7 touch-none cursor-nwse-resize border-l-2 border-t-2 border-[#99b77e] bg-[#263a30] hover:bg-[#496044]"><span aria-hidden="true" className="block text-center text-sm leading-6 text-[#d4e6c9]">↘</span></button>}
      </aside>}
    </div>
    {success && <section role="dialog" aria-modal="false" aria-labelledby="binary-success" className="absolute inset-x-3 bottom-4 z-40 mx-auto max-w-lg border-2 border-[#b4cc83] bg-[#142126]/[.98] p-5 text-center shadow-[6px_6px_0_#080f12]"><p className="font-pixel text-[9px] uppercase tracking-widest text-[#bfe4ae]">Stage complete</p><h2 id="binary-success" className="mt-3 font-pixel text-[10px] leading-relaxed text-[#f0dca0]">Signal located at index 5!</h2><p className={`mt-3 text-sm ${earned !== null && earned > 0 ? 'motion-safe:animate-pulse text-[#bfe4ae]' : 'text-[#d1dbd1]'}`}>{completed && earned === 0 ? 'Stage complete — XP already earned.' : earned !== null ? `+${earned} XP earned.` : 'Your completion has been saved.'}</p><div className="mt-4 flex justify-center gap-3"><button type="button" onClick={() => { setEarned(null); setTutorial(null); sceneActionRef.current('mission:replay'); }} className="min-h-10 border border-[#a7c894] px-3 font-pixel text-[8px] text-[#e7f1dc]">Replay</button><Link to="/pattern/binary-search" className="inline-flex min-h-10 items-center border border-[#728c7b] px-3 font-pixel text-[8px] text-[#dbedda]">Back to Stages</Link></div></section>}
  </main>;
}
