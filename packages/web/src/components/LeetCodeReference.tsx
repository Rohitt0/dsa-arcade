import type { StageDefinition } from '../game-engine/types';

interface LeetCodeReferenceProps {
  reference: NonNullable<StageDefinition['leetcode']>;
  className?: string;
}

export function LeetCodeReference({ reference, className = '' }: LeetCodeReferenceProps) {
  const label = reference.relationship === 'adapted' ? 'Adapted from:' : 'Related practice:';

  return <a
    href={reference.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${label} ${reference.title} (opens in a new tab)`}
    className={`inline-flex min-h-8 max-w-full items-center gap-1 text-xs leading-5 text-[#a9c8b5] underline decoration-[#738d7a] underline-offset-4 transition-colors hover:text-[#e1edcc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6bd72] ${className}`}
  >
    <span>{label}</span>
    <span className="break-words">{reference.title}</span>
    <span aria-hidden="true" className="shrink-0">↗</span>
  </a>;
}
