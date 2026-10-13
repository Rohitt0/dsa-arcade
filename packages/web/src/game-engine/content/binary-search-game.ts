import type { GameDefinition, StageDefinition } from '../types';
import { binarySearchStage } from '@dsa/shared';

const stage: StageDefinition = {
  id: binarySearchStage.id,
  title: binarySearchStage.title,
  objective: 'Find the target in sorted readings in O(log n) time.',
  leetcode: binarySearchStage.leetcode,
  rewardXp: binarySearchStage.rewardXp,
  sceneKey: 'ObservatoryMissionScene',
  difficulty: 1,
  config: {
    challengeSlug: binarySearchStage.challengeSlug,
    readings: [...binarySearchStage.example.readings],
    target: binarySearchStage.example.target,
    answer: binarySearchStage.example.answer,
  },
};

export const binarySearchGame: GameDefinition = {
  id: 'the-observatory',
  title: 'The Observatory',
  stages: [stage],
};

export { binarySearchStage };
