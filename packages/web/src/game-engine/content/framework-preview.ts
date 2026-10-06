import type { GameDefinition } from '../types';

export const frameworkPreviewGame: GameDefinition = {
  id: 'framework-preview',
  title: 'Game Framework Preview',
  stages: [
    {
      id: 'tap-intro',
      title: 'Warm up',
      sceneKey: 'FrameworkPreviewScene',
      difficulty: 1,
      config: { targetTaps: 2 },
    },
    {
      id: 'tap-repeat',
      title: 'Repeat the action',
      sceneKey: 'FrameworkPreviewScene',
      difficulty: 1,
      config: { targetTaps: 3 },
    },
  ],
};
