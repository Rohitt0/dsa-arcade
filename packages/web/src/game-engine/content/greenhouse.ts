import type { GameDefinition } from '../types';

export const greenhouseCrystals = [4, 2, 7, 1, 6, 3, 8, 5];
export const greenhouseWindowSize = 3;

export const greenhouseGame: GameDefinition = {
  id: 'restart-greenhouse',
  title: 'Restart the Greenhouse',
  stages: [
    {
      id: 'greenhouse-maximum-crystal-energy',
      title: 'Maximum Crystal Energy',
      sceneKey: 'GreenhouseMissionScene',
      difficulty: 1,
      config: {
        crystals: greenhouseCrystals,
        windowSize: greenhouseWindowSize,
        challengeSlug: 'maximum-sum-k-consecutive-crystals',
      },
    },
  ],
};
