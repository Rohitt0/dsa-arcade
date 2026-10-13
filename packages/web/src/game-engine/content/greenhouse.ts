import type { GameDefinition, StageDefinition } from '../types';
import { greenhouseStageExamples } from '@dsa/shared/greenhouse';

export const greenhouseStageIds = {
  restore: 'greenhouse-maximum-crystal-energy',
  sustain: 'greenhouse-reliable-power-windows',
  burst: 'greenhouse-short-crystal-burst',
  budget: 'greenhouse-keep-vines-warm',
} as const;

const stages: StageDefinition[] = [
  {
    id: greenhouseStageIds.restore,
    title: 'Restart the Greenhouse',
    objective: 'Find the maximum sum of 3 consecutive crystals.',
    leetcode: { title: 'Maximum Average Subarray I', url: 'https://leetcode.com/problems/maximum-average-subarray-i/', relationship: 'adapted' },
    sceneKey: 'GreenhouseMissionScene', difficulty: 1,
    rewardXp: 100,
    config: { crystals: [...greenhouseStageExamples.maximum.crystals], windowSize: greenhouseStageExamples.maximum.windowSize, challengeSlug: 'maximum-sum-k-consecutive-crystals' },
  },
  {
    id: greenhouseStageIds.sustain,
    title: 'Keep the Greenhouse Alive',
    objective: 'Count length-3 windows whose sum is at least 12.',
    leetcode: { title: 'Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold', url: 'https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/', relationship: 'related' },
    sceneKey: 'GreenhouseMissionScene', difficulty: 1,
    rewardXp: 125,
    config: { crystals: [...greenhouseStageExamples.reliable.crystals], windowSize: greenhouseStageExamples.reliable.windowSize, target: greenhouseStageExamples.reliable.target, challengeSlug: 'reliable-crystal-windows' },
  },
  {
    id: greenhouseStageIds.burst,
    title: 'A Short Burst',
    objective: 'Find the shortest contiguous group of crystals whose energy reaches 7.',
    leetcode: { title: 'Minimum Size Subarray Sum', url: 'https://leetcode.com/problems/minimum-size-subarray-sum/', relationship: 'adapted' },
    sceneKey: 'GreenhouseMissionScene', difficulty: 2,
    rewardXp: 175,
    config: { crystals: [...greenhouseStageExamples.burst.crystals], target: greenhouseStageExamples.burst.target, challengeSlug: 'minimum-crystal-burst' },
  },
  {
    id: greenhouseStageIds.budget,
    title: 'Keep the Vines Warm',
    objective: `Find the longest contiguous group whose energy stays within budget ${greenhouseStageExamples.budget.budget}.`,
    sceneKey: 'GreenhouseMissionScene', difficulty: 2,
    rewardXp: 200,
    config: { crystals: [...greenhouseStageExamples.budget.crystals], budget: greenhouseStageExamples.budget.budget, challengeSlug: 'longest-crystal-budget' },
  },
];

export const greenhouseCrystals = stages[0]!.config.crystals as number[];
export const greenhouseWindowSize = Number(stages[0]!.config.windowSize);
export const greenhouseReliableTarget = Number(stages[1]!.config.target);
export const stageCrystals = (stage: StageDefinition) => [...(stage.config.crystals as number[])];
export const stageBudget = (stage: StageDefinition) => Number(stage.config.budget ?? stage.config.target ?? 0);
export function findLongestBudgetWindow(values: number[], budget: number) {
  let left = 0; let sum = 0; let best = { start: 0, end: -1, length: 0 };
  for (let right = 0; right < values.length; right++) {
    sum += values[right]!;
    while (left <= right && sum > budget) sum -= values[left++]!;
    const length = right - left + 1;
    if (length > best.length) best = { start: left, end: right, length };
  }
  return best;
}

export const greenhouseGame: GameDefinition = {
  id: 'restart-greenhouse', title: 'Restart the Greenhouse', stages,
};
