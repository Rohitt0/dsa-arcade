import type { GameSceneRegistry } from '../types';
import { binarySearchGame } from './binary-search-game';
import { ObservatoryMissionScene } from '../scenes/ObservatoryMissionScene';

export const binarySearchScenes: GameSceneRegistry = {
  ObservatoryMissionScene: (runtime, initialStage) => new ObservatoryMissionScene(runtime, initialStage ?? binarySearchGame.stages[0]!),
};
