import type { GameSceneRegistry } from '../types';
import { frameworkPreviewGame } from './framework-preview';
import { FrameworkPreviewScene } from '../scenes/FrameworkPreviewScene';

export const frameworkPreviewScenes: GameSceneRegistry = {
  FrameworkPreviewScene: (runtime) =>
    new FrameworkPreviewScene(runtime, frameworkPreviewGame.stages[0]!),
};
