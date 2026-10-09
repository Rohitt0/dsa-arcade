import type { GameSceneRegistry } from '../types';
import { greenhouseGame } from './greenhouse';
import { GreenhouseMissionScene } from '../scenes/GreenhouseMissionScene';

export const greenhouseScenes: GameSceneRegistry = {
  GreenhouseMissionScene: (runtime) => new GreenhouseMissionScene(runtime, greenhouseGame.stages[0]!),
};
