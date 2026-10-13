import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PixelButton } from '../components/ui';
import { LeetCodeReference } from '../components/LeetCodeReference';
import { useChallenge } from '../features/challenge/useChallenge';
import { binarySearchStage } from '../game-engine/content/binary-search-game';
import { useAuthStore } from '../stores/auth.store';

export function BinarySearchPreviewPage() {
  const [selected, setSelected] = useState(false);
  const challenge = useChallenge(binarySearchStage.challengeSlug);
  const xp = useAuthStore((state) => state.user?.xp ?? 0);
  const completed = Boolean(challenge.data?.savedSolution?.completed);
  return <main className="mx-auto max-w-5xl">
    <Link to="/world" className="inline-flex min-h-11 items-center font-pixel text-[9px] uppercase tracking-wide text-sky underline decoration-sky/50 underline-offset-4">← Back to adventures</Link>
    <section className="mt-5 overflow-hidden border-2 border-[#52625b] bg-[#17262a] shadow-[5px_5px_0_#080f12]">
      <div className="relative flex min-h-64 items-end overflow-hidden border-b-2 border-[#52625b] sm:min-h-80">
        <img src="/images/observatory/observatory-background-v2-native.png" alt="The pixel-art observatory beneath a night sky" className="pixelated absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101b20]/95 via-[#101b20]/30 to-transparent" />
        <div className="relative z-10 w-full p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-pixel text-[9px] uppercase tracking-[.16em] text-sky">Binary Search · The Observatory</p>
            <p className="border border-[#b4cc83] bg-[#101b20]/90 px-3 py-2 font-pixel text-[8px] text-[#d8edbc]" aria-label={`${xp} total experience points`}>{xp} XP TOTAL</p>
          </div>
          <h1 className="mt-3 font-pixel text-sm leading-relaxed text-[#f0dca0] sm:text-base">Find the Signal</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e3ebe2]">Rowan’s telescope has lost a distant signal. Search the sorted frequency readings and bring back its exact index.</p>
        </div>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="font-pixel text-[8px] uppercase tracking-widest text-sky">Stage 1 · Beginner</p>
          <h2 className="mt-3 text-sm text-[#f0dca0]">{binarySearchStage.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#c5d5c8]">Given sorted, distinct readings and a target, return its zero-based index or -1 if it is absent. Your solution should run in O(log n).</p>
          <LeetCodeReference reference={binarySearchStage.leetcode} className="mt-3" />
          <p className="mt-3 text-xs text-[#aabbb1]">Reward: <span className="text-[#dcebd0]">{completed ? '100 XP · Earned' : '100 XP'}</span></p>
        </div>
        <div className="flex min-w-44 flex-col gap-2">
          <Link to="/game/observatory?stage=binary-search-find-the-signal"><PixelButton fullWidth>{completed ? 'Replay stage' : challenge.data?.savedSolution?.code ? 'Resume stage' : 'Play stage'}</PixelButton></Link>
          <button type="button" aria-pressed={selected} onClick={() => setSelected((value) => !value)} className="min-h-10 border border-[#657b73] px-3 font-pixel text-[8px] uppercase tracking-wide text-[#c5d5c8] hover:border-sky">{selected ? 'Hide stage details' : 'Stage details'}</button>
        </div>
      </div>
      {selected && <div className="border-t border-[#52625b] bg-[#142126] px-5 py-4 text-sm leading-6 text-[#c5d5c8]">
        <p><strong className="text-[#f0dca0]">Example:</strong> readings = [{binarySearchStage.example.readings.join(', ')}], target = {binarySearchStage.example.target}, answer = {binarySearchStage.example.answer}.</p>
        <p className="mt-2">Run checks the visible examples. Submit checks hidden cases and is the only action that completes this stage. No LeetCode account is required.</p>
      </div>}
    </section>
  </main>;
}
