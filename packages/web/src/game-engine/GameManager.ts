import Phaser from 'phaser';
import { GameBridge } from './GameBridge';
import { LevelManager } from './LevelManager';
import { ProgressManager } from './ProgressManager';
import { SceneManager } from './SceneManager';
import type { GameDefinition, GameRuntime, GameSceneRegistry } from './types';

/** Owns one Phaser instance and coordinates stage completion and progression. */
export class GameManager {
  readonly bridge: GameBridge;
  readonly levels: LevelManager;
  readonly progress: ProgressManager;
  private readonly game: Phaser.Game;
  private readonly scenes: SceneManager;
  private readonly unsubscribeStageComplete: () => void;

  constructor(
    parent: HTMLElement,
    definition: GameDefinition,
    sceneFactories: GameSceneRegistry,
    bridge: GameBridge = new GameBridge(),
    progressScope = 'guest',
  ) {
    this.bridge = bridge;
    this.levels = new LevelManager(definition);
    this.progress = new ProgressManager(definition.id, this.bridge, progressScope);

    const firstStage = this.levels.currentStage;
    if (!firstStage) throw new Error('The game has no playable stages.');
    const firstFactory = sceneFactories[firstStage.sceneKey];
    if (!firstFactory) throw new Error(`No Phaser scene registered for "${firstStage.sceneKey}".`);
    const missingScene = definition.stages.find((stage) => !sceneFactories[stage.sceneKey]);
    if (missingScene) throw new Error(`No Phaser scene registered for "${missingScene.sceneKey}".`);

    const runtime: GameRuntime = {
      game: definition,
      bridge: this.bridge,
      progress: this.progress,
      completeStage: (stageId, score) => {
        this.bridge.emit('stage:completed', {
          gameId: definition.id,
          stageId,
          score,
        });
      },
    };

    // Subscribe before boot so an early scene event cannot be missed.
    this.unsubscribeStageComplete = this.bridge.on('stage:completed', ({ stageId }) => {
      const result = this.levels.complete(stageId);
      if (!result.accepted) return;

      if (result.nextStage) {
        this.bridge.emit('stage:started', {
          gameId: definition.id,
          stage: result.nextStage,
          stageNumber: this.levels.currentStageNumber,
        });
        this.scenes.start(result.nextStage);
      } else if (result.gameCompleted) {
        this.bridge.emit('game:completed', { gameId: definition.id });
      }
    });

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 800,
      height: 450,
      backgroundColor: '#141633',
      pixelArt: true,
      antialias: false,
      scene: [firstFactory(runtime)],
      scale: { mode: Phaser.Scale.RESIZE },
    });
    this.scenes = new SceneManager(this.game, sceneFactories, runtime, firstStage.sceneKey);
    this.bridge.emit('stage:started', {
      gameId: definition.id,
      stage: firstStage,
      stageNumber: 1,
    });
  }

  destroy() {
    this.unsubscribeStageComplete();
    this.game.destroy(true);
    this.bridge.clear();
  }
}
