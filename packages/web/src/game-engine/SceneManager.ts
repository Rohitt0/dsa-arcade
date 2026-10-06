import Phaser from 'phaser';
import type { GameRuntime, GameSceneRegistry, StageDefinition } from './types';

/** Resolves data-driven scene keys and starts/restarts the requested stage scene. */
export class SceneManager {
  private registered = new Set<string>();

  constructor(
    private readonly game: Phaser.Game,
    private readonly factories: GameSceneRegistry,
    private readonly runtime: GameRuntime,
    initialSceneKey: string,
  ) {
    this.registered.add(initialSceneKey);
  }

  start(stage: StageDefinition) {
    const factory = this.factories[stage.sceneKey];
    if (!factory) throw new Error(`No Phaser scene registered for "${stage.sceneKey}".`);

    if (!this.registered.has(stage.sceneKey)) {
      this.game.scene.add(stage.sceneKey, factory(this.runtime), false);
      this.registered.add(stage.sceneKey);
    }

    this.game.scene.start(stage.sceneKey, { stage });
  }
}
