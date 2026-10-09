import type Phaser from 'phaser';
import type { GameBridge } from './GameBridge';
import type { ProgressManager } from './ProgressManager';
import type { TutorialState } from './content/greenhouse-tutorial';

export type ProgressValue =
  string | number | boolean | null | ProgressValue[] | { [key: string]: ProgressValue };

export interface GameControl {
  id: string;
  label: string;
}

export interface StageDefinition {
  id: string;
  title: string;
  sceneKey: string;
  difficulty: number;
  config: Record<string, ProgressValue>;
}

export interface GameDefinition {
  id: string;
  title: string;
  stages: StageDefinition[];
}

export type GameInput =
  | { source: 'pointer'; x: number; y: number }
  | { source: 'keyboard'; key: 'Space' | 'Enter' }
  | { source: 'control'; action: string };

export interface CheckpointPayload {
  gameId: string;
  stageId: string;
  checkpointId: string;
  progress: Record<string, ProgressValue>;
}

export interface GameEventMap {
  'game:tutorial': TutorialState;
  'game:ready': { gameId: string };
  'game:error': { message: string };
  'game:completed': { gameId: string };
  'stage:started': { gameId: string; stage: StageDefinition; stageNumber: number };
  'stage:completed': { gameId: string; stageId: string; score: number };
  'game:input': GameInput;
  'game:controls': { stageId: string; controls: GameControl[] };
  'game:lesson': { message: string };
  'checkpoint:reached': CheckpointPayload;
}

export type GameEvent = {
  [K in keyof GameEventMap]: { type: K; payload: GameEventMap[K] };
}[keyof GameEventMap];

export type GameEventListener = (event: GameEvent) => void;

export interface GameRuntime {
  readonly game: GameDefinition;
  readonly bridge: GameBridge;
  readonly progress: ProgressManager;
  completeStage(stageId: string, score: number): void;
}

export type GameSceneFactory = (runtime: GameRuntime) => Phaser.Scene;
export type GameSceneRegistry = Record<string, GameSceneFactory>;
export type GameSceneLoader = () => Promise<GameSceneRegistry>;
