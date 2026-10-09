import Phaser from 'phaser';
import { InputManager } from '../InputManager';
import type { GameRuntime, StageDefinition } from '../types';

interface SceneData {
  stage?: StageDefinition;
}

/** Small framework smoke scene retained for engine diagnostics. */
export class FrameworkPreviewScene extends Phaser.Scene {
  private stage: StageDefinition;
  private taps = 0;
  private checkpointSent = false;
  private stageFinished = false;
  private title?: Phaser.GameObjects.Text;
  private prompt?: Phaser.GameObjects.Text;
  private counter?: Phaser.GameObjects.Text;
  private unsubscribeInput?: () => void;
  private inputManager?: InputManager;
  private hasAnnouncedReady = false;

  constructor(
    private readonly runtime: GameRuntime,
    initialStage: StageDefinition,
  ) {
    super({ key: 'FrameworkPreviewScene' });
    this.stage = initialStage;
  }

  init(data?: SceneData) {
    if (data?.stage) this.stage = data.stage;
    this.taps = 0;
    this.checkpointSent = false;
    this.stageFinished = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#141633');
    this.title = this.add.text(0, 0, this.stage.title.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffcf4e',
      align: 'center',
      wordWrap: { width: Math.max(160, this.scale.width - 32) },
    }).setOrigin(0.5);

    this.prompt = this.add.text(0, 0, 'TAP HERE OR PRESS SPACE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f4e9d0',
      align: 'center',
      wordWrap: { width: Math.max(160, this.scale.width - 32) },
    }).setOrigin(0.5);

    this.counter = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#6cb8e4',
      align: 'center',
    }).setOrigin(0.5);

    this.inputManager = new InputManager(this, this.runtime.bridge);
    this.unsubscribeInput = this.runtime.bridge.on('game:input', this.handleAction);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.unsubscribeInput?.();
      this.inputManager?.destroy();
    });

    this.layout();
    this.updateCounter();
    if (!this.hasAnnouncedReady) {
      this.hasAnnouncedReady = true;
      this.runtime.bridge.emit('game:ready', { gameId: this.runtime.game.id });
    }
  }

  private handleAction = () => {
    if (this.stageFinished) return;

    const targetTaps = Math.max(1, Math.floor(Number(this.stage.config.targetTaps) || 1));
    this.taps += 1;
    this.updateCounter();

    if (!this.checkpointSent && this.taps >= Math.ceil(targetTaps / 2)) {
      this.checkpointSent = true;
      this.runtime.progress.checkpoint(this.stage.id, 'halfway', { taps: this.taps });
    }

    if (this.taps >= targetTaps) {
      this.stageFinished = true;
      this.runtime.completeStage(this.stage.id, this.taps);
    }
  };

  private updateCounter() {
    const targetTaps = Math.max(1, Math.floor(Number(this.stage.config.targetTaps) || 1));
    this.counter?.setText(`ACTIONS ${this.taps} / ${targetTaps}`);
  }

  private layout = () => {
    const centerX = this.scale.width / 2;
    this.title?.setPosition(centerX, this.scale.height * 0.34);
    this.prompt?.setPosition(centerX, this.scale.height * 0.52);
    this.counter?.setPosition(centerX, this.scale.height * 0.68);
  };
}
