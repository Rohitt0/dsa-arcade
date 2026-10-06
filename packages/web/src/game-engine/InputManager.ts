import Phaser from 'phaser';
import { GameBridge } from './GameBridge';

/** Normalizes touch/pointer and keyboard actions and removes listeners with the scene. */
export class InputManager {
  private readonly onPointerDown = (pointer: Phaser.Input.Pointer) => {
    this.bridge.emit('game:input', {
      source: 'pointer',
      x: pointer.worldX,
      y: pointer.worldY,
    });
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    this.bridge.emit('game:input', {
      source: 'keyboard',
      key: event.code,
    });
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly bridge: GameBridge,
  ) {
    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.keyboard?.on('keydown', this.onKeyDown);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  destroy() {
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.keyboard?.off('keydown', this.onKeyDown);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
