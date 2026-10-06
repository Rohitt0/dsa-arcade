import type { GameDefinition } from '../types';

const train = [4, 2, 7, 1, 5, 3, 6];

/** Curriculum configuration for the first complete, game-led Sliding Window lesson. */
export const trainWindowGame: GameDefinition = {
  id: 'train-window',
  title: 'The Train Window',
  stages: [
    {
      id: 'find-window',
      title: 'Find the Window',
      sceneKey: 'TrainWindowScene',
      difficulty: 1,
      config: {
        lesson: 'find-window',
        prompt: 'A window is a group of neighboring train cars. Make it 3 cars wide.',
        values: train,
      },
    },
    {
      id: 'move-window',
      title: 'Move the Window',
      sceneKey: 'TrainWindowScene',
      difficulty: 1,
      config: {
        lesson: 'move-window',
        prompt: 'Slide one car to the right. The group stays the same size.',
        values: train,
        windowSize: 3,
      },
    },
    {
      id: 'track-value',
      title: 'Track the Value',
      sceneKey: 'TrainWindowScene',
      difficulty: 2,
      config: {
        lesson: 'track-value',
        prompt: 'Find the largest sum of any 3 neighboring cars.',
        values: train,
        windowSize: 3,
      },
    },
    {
      id: 'variable-window',
      title: 'Variable Window',
      sceneKey: 'TrainWindowScene',
      difficulty: 2,
      config: {
        lesson: 'variable-window',
        prompt: 'Find the shortest stretch whose values add up to at least 10.',
        values: train,
        target: 10,
      },
    },
    {
      id: 'hidden-pattern',
      title: 'Hidden Pattern',
      sceneKey: 'TrainWindowScene',
      difficulty: 2,
      config: {
        lesson: 'hidden-pattern',
        prompt: 'Which tool fits a problem about a continuous run of neighboring values?',
        values: train,
      },
    },
    {
      id: 'boss',
      title: 'The Cloud-Sea Crossing',
      sceneKey: 'TrainWindowScene',
      difficulty: 3,
      config: {
        lesson: 'boss',
        prompt: 'Cross with the longest continuous stretch whose total is at most 12.',
        values: train,
        limit: 12,
      },
    },
  ],
};
