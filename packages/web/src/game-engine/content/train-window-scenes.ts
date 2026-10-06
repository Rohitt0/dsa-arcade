import type { GameSceneRegistry } from '../types';
import { trainWindowGame } from './train-window';
import { TrainWindowScene } from '../scenes/TrainWindowScene';

export const trainWindowScenes: GameSceneRegistry = {
  TrainWindowScene: (runtime) => new TrainWindowScene(runtime, trainWindowGame.stages[0]!),
};
