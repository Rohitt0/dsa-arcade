import type { GameDefinition } from '../types';

export const frameworkPreviewGame: GameDefinition = {
  id: 'framework-preview',
  title: 'Game Framework Preview',
  stages: [
    {
      id: 'tap-intro',
      title: 'Warm up',
      objective: 'Try the basic interaction.',
      sceneKey: 'FrameworkPreviewScene',
      difficulty: 1,
      config: { targetTaps: 2 },
    },
    {
      id: 'tap-repeat',
      title: 'Repeat the action',
      objective: 'Repeat the interaction to finish the preview.',
      sceneKey: 'FrameworkPreviewScene',
      difficulty: 1,
      config: { targetTaps: 3 },
    },
  ],
};
