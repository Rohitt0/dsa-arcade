/** Reward map for playable stages only. IDs and challenge slugs are stable save keys. */
export const implementedStageRewards = [
  { stageId: 'greenhouse-maximum-crystal-energy', challengeSlug: 'maximum-sum-k-consecutive-crystals', adventure: 'Sliding Window', title: 'Restart the Greenhouse', xp: 100 },
  { stageId: 'greenhouse-reliable-power-windows', challengeSlug: 'reliable-crystal-windows', adventure: 'Sliding Window', title: 'Keep the Greenhouse Alive', xp: 125 },
  { stageId: 'greenhouse-short-crystal-burst', challengeSlug: 'minimum-crystal-burst', adventure: 'Sliding Window', title: 'A Short Burst', xp: 175 },
  { stageId: 'greenhouse-keep-vines-warm', challengeSlug: 'longest-crystal-budget', adventure: 'Sliding Window', title: 'Keep the Vines Warm', xp: 200 },
  { stageId: 'binary-search-find-the-signal', challengeSlug: 'find-the-signal', adventure: 'Binary Search', title: 'Find the Signal', xp: 100 },
] as const;

export type ImplementedStageReward = (typeof implementedStageRewards)[number];

export function getStageRewardByChallenge(slug: string) {
  return implementedStageRewards.find((stage) => stage.challengeSlug === slug);
}

export function getStageReward(stageId: string) {
  return implementedStageRewards.find((stage) => stage.stageId === stageId);
}
