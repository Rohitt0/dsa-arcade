import type { GameSceneRegistry } from '../types';
import { greenhouseGame } from './greenhouse';
import { GreenhouseMissionScene } from '../scenes/GreenhouseMissionScene';

export const greenhouseScenes: GameSceneRegistry = {
  GreenhouseMissionScene: (runtime, initialStage) => new GreenhouseMissionScene(runtime, initialStage ?? greenhouseGame.stages[0]!),
};
