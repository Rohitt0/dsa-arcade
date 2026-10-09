import Phaser from 'phaser';
import type { GameInput, GameRuntime, StageDefinition } from '../types';
import { greenhouseCrystals, greenhouseWindowSize } from '../content/greenhouse';
import { GreenhouseTutorialController } from '../GreenhouseTutorialController';
import { tutorialCrystals, type TutorialStep } from '../content/greenhouse-tutorial';

const imagePath = '/images/greenhouse/';
const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 270;
const RAIL_X = 96;
const RAIL_Y = 174;
// Native rail sockets: x=32..256 in steps of 32, with the seat at y=24.
const CRYSTAL_SPACING = 32;
const FIRST_CRYSTAL_X = RAIL_X + 32;
const CRYSTAL_Y = RAIL_Y - 48 / 2 + 24;
const COLLECTOR_X = FIRST_CRYSTAL_X - CRYSTAL_SPACING / 2;
const COLLECTOR_Y = CRYSTAL_Y - 14;
const animationSpecs = [
  { key: 'boy-idle', file: 'hooded-boy-idle-4frames.png', metadata: 'hooded-boy-idle-4frames.json', frameWidth: 96, frameHeight: 112 },
  { key: 'boy-walk', file: 'hooded-boy-walk-8frames.png', metadata: 'hooded-boy-walk-8frames.json', frameWidth: 96, frameHeight: 112 },
  { key: 'boy-scan', file: 'hooded-boy-scan-6frames.png', metadata: 'hooded-boy-scan-6frames.json', frameWidth: 96, frameHeight: 112 },
  { key: 'boy-celebrate', file: 'hooded-boy-celebrate-6frames.png', metadata: 'hooded-boy-celebrate-6frames.json', frameWidth: 96, frameHeight: 112 },
  { key: 'pulse', file: 'golden-pulse-6frames.png', metadata: 'golden-pulse-6frames.json', frameWidth: 33, frameHeight: 33 },
  { key: 'energy-mote', file: 'energy-mote-4frames.png', metadata: 'energy-mote-4frames.json', frameWidth: 24, frameHeight: 16 },
] as const;

/** One C++ mission: solve the standard function; a separate optional animation explains the window. */
export class GreenhouseMissionScene extends Phaser.Scene {
  private stage: StageDefinition;
  private world!: Phaser.GameObjects.Container;
  private backdrop!: Phaser.GameObjects.Image;
  private walkway!: Phaser.GameObjects.TileSprite;
  private rail!: Phaser.GameObjects.Image;
  private collector!: Phaser.GameObjects.Image;
  private crystals: Phaser.GameObjects.Image[] = [];
  private valueLabels: Phaser.GameObjects.Text[] = [];
  private plants: Phaser.GameObjects.Image[] = [];
  private core!: Phaser.GameObjects.Image;
  private boy!: Phaser.GameObjects.Sprite;
  private energyMote?: Phaser.GameObjects.Sprite;
  private demoRunning = false;
  private restored = false;
  private unsubscribe?: () => void;
  private assetErrors = new Set<string>();
  private tutorial!: GreenhouseTutorialController;
  private successEffects: Phaser.GameObjects.Sprite[] = [];

  constructor(private readonly runtime: GameRuntime, initialStage: StageDefinition) {
    super({ key: 'GreenhouseMissionScene' });
    this.stage = initialStage;
  }

  preload() {
    this.load.image('gh-background', `${imagePath}greenhouse-background-clean.png`);
    this.load.image('gh-walkway', `${imagePath}greenhouse-walkway-native.png`);
    this.load.image('gh-rail', `${imagePath}greenhouse-scanning-rail-native.png`);
    this.load.image('gh-crystal-dormant', `${imagePath}energy-crystal-dormant.png`);
    this.load.image('gh-crystal-sparkles', `${imagePath}energy-crystal-activated-sparkles.png`);
    this.load.image('gh-collector', `${imagePath}three-slot-collector-native.png`);
    this.load.image('gh-core-dormant', `${imagePath}greenhouse-power-core-dormant.png`);
    this.load.image('gh-core-powered', `${imagePath}greenhouse-power-core-powered.png`);
    for (const plant of ['fern', 'flower', 'vine']) {
      this.load.image(`gh-${plant}-dormant`, `${imagePath}${plant}-dormant.png`);
      this.load.image(`gh-${plant}-revived`, `${imagePath}${plant}-revived.png`);
    }
    for (const spec of animationSpecs) {
      this.load.spritesheet(spec.key, `${imagePath}${spec.file}`, { frameWidth: spec.frameWidth, frameHeight: spec.frameHeight });
      this.load.json(`${spec.key}-metadata`, `${imagePath}${spec.metadata}`);
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onAssetError);
  }

  create(data?: { stage?: StageDefinition }) {
    if (data?.stage) this.stage = data.stage;
    this.crystals = [];
    this.valueLabels = [];
    this.successEffects = [];
    this.restored = Boolean(this.runtime.progress.read(this.stage.id, 'greenhouse-restored'));
    this.cameras.main.setBackgroundColor('#132a31');
    this.createAnimations();
    this.world = this.add.container(0, 0);
    this.backdrop = this.add.image(0, 0, 'gh-background').setDepth(-20);
    this.walkway = this.add.tileSprite(240, 253, WORLD_WIDTH, 32, 'gh-walkway').setDepth(3);
    this.world.add(this.walkway);

    this.rail = this.add.image(RAIL_X, RAIL_Y, 'gh-rail').setOrigin(0, 0.5).setDepth(4);
    this.world.add(this.rail);
    for (let i = 0; i < greenhouseCrystals.length; i++) {
      const cx = FIRST_CRYSTAL_X + i * CRYSTAL_SPACING;
      const crystal = this.add.image(cx, CRYSTAL_Y, 'gh-crystal-dormant')
        .setOrigin(0.5, 30 / 32).setDepth(5).setInteractive({ useHandCursor: true });
      this.crystals.push(crystal);
      this.world.add(crystal);
      // Keep values above the crystal tips and collector, clear of the plants below.
      const label = this.add.text(cx, CRYSTAL_Y - 44, String(greenhouseCrystals[i]), {
        fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#f2e6c0',
        backgroundColor: '#172c31', padding: { x: 4, y: 3 },
      }).setOrigin(0.5).setDepth(12).setResolution(3);
      this.valueLabels.push(label);
      this.world.add(label);
      crystal.on('pointerover', () => { if (!this.tutorial?.state.active) { crystal.setScale(1.15); label.setColor('#ffe694'); } });
      crystal.on('pointerout', () => { if (!this.tutorial?.state.active) { crystal.setScale(1); label.setColor('#f2e6c0'); } });
      crystal.on('pointerup', () => {
        if (!this.tutorial?.state.active) this.runtime.bridge.emit('game:lesson', { message: `Crystal ${i + 1} stores ${greenhouseCrystals[i]} energy. The C++ function searches all windows of length ${greenhouseWindowSize}.` });
      });
    }
    this.collector = this.add.image(COLLECTOR_X, COLLECTOR_Y, 'gh-collector')
      .setOrigin(0, 0.5).setDisplaySize(CRYSTAL_SPACING * greenhouseWindowSize, 36)
      .setAlpha(0.88).setDepth(6).setVisible(false);
    this.world.add(this.collector);

    this.plants = [
      this.add.image(108, 248, 'gh-fern-dormant'),
      this.add.image(266, 248, 'gh-flower-dormant'),
      this.add.image(390, 248, 'gh-vine-dormant'),
    ].map((plant) => plant.setOrigin(0.5, 1).setDepth(4).setScale(0.72));
    this.plants.forEach((plant) => this.world.add(plant));
    this.core = this.add.image(440, 248, 'gh-core-dormant').setOrigin(0.5, 1).setDepth(5);
    this.world.add(this.core);

    this.boy = this.add.sprite(-30, 248, 'boy-walk').setOrigin(0.5, 1).setDepth(6).setScale(0.62);
    this.world.add(this.boy);
    // Keep value labels readable over scene effects.
    this.valueLabels.forEach((label) => this.world.bringToTop(label));

    this.unsubscribe = this.runtime.bridge.on('game:input', this.onInput);
    this.tutorial = new GreenhouseTutorialController({
      publish: (state) => { this.runtime.bridge.emit('game:tutorial', state); this.layout(); },
      enter: (step, done) => this.enterTutorialStep(step, done),
      finish: (skipped, replay) => {
        if (!replay) this.runtime.progress.checkpoint(this.stage.id, 'onboarding', { seen: true, skipped });
        this.enterMission();
      },
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.layout();
    const returning = this.restored || ['onboarding', 'draft', 'attempted'].some((id) => Boolean(this.runtime.progress.read(this.stage.id, id)));
    if (returning) {
      this.enterMission();
      this.runtime.bridge.emit('game:tutorial', { ...this.tutorial.state });
    } else this.startTutorial(false);
    this.runtime.bridge.emit('game:ready', { gameId: this.runtime.game.id });
  }

  private setCrystalLit(index: number, lit: boolean) {
    this.crystals[index]?.setTexture(lit ? 'gh-crystal-sparkles' : 'gh-crystal-dormant')
      .setOrigin(0.5, lit ? 34 / 44 : 30 / 32).setScale(1).clearTint();
  }

  private applyAppearance(restored: boolean) {
    this.crystals.forEach((_, index) => this.setCrystalLit(index, restored));
    this.core.setTexture(restored ? 'gh-core-powered' : 'gh-core-dormant').clearTint();
    ['fern', 'flower', 'vine'].forEach((name, index) => {
      this.plants[index].setTexture(`gh-${name}-${restored ? 'revived' : 'dormant'}`).setScale(0.72);
    });
  }

  private startTutorial(replay: boolean) {
    this.tutorial.dispose();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.successEffects.forEach((effect) => { if (effect.active) effect.destroy(); });
    this.successEffects = [];
    this.energyMote?.destroy();
    this.energyMote = undefined;
    this.demoRunning = false;
    this.applyAppearance(false);
    this.collector.setVisible(false).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.valueLabels.forEach((label, index) => label.setText(String(tutorialCrystals[index])).setVisible(false).setColor('#f2e6c0'));
    this.runtime.bridge.emit('game:controls', { stageId: this.stage.id, controls: [] });
    this.tutorial.start(replay);
  }

  private enterMission() {
    this.applyAppearance(this.restored);
    this.collector.setVisible(false).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.valueLabels.forEach((label, index) => label.setText(String(greenhouseCrystals[index])).setVisible(true).setColor('#f2e6c0'));
    this.boy.setX(42).play('boy-idle');
    this.runtime.bridge.emit('game:controls', { stageId: this.stage.id, controls: [{ id: 'demo', label: 'Show sliding-window walkthrough' }] });
    this.runtime.bridge.emit('game:lesson', { message: this.restored
      ? 'Your greenhouse is restored. You can revisit your solution or replay the tutorial.'
      : 'Find the maximum energy in exactly three consecutive crystals. Write a C++ solution function, then run the examples.' });
  }

  private enterTutorialStep(step: TutorialStep, done: () => void): () => void {
    const effects: Phaser.GameObjects.GameObject[] = [];
    const tweens: Phaser.Tweens.Tween[] = [];
    const timers: Phaser.Time.TimerEvent[] = [];
    const pulse = (x: number, y: number) => {
      const sprite = this.add.sprite(x, y, 'pulse').setScale(0.7);
      this.world.add(sprite);
      effects.push(sprite);
      sprite.play('pulse');
    };
    const scan = (finish: () => void) => {
      this.boy.play('boy-scan');
      pulse(this.boy.x + 10, this.boy.y - 34);
      timers.push(this.time.delayedCall(700, () => { this.boy.play('boy-idle'); finish(); done(); }));
    };
    if (step === 'arrival') {
      this.boy.setX(-30).play('boy-walk');
      tweens.push(this.tweens.add({ targets: this.boy, x: 42, duration: 800, ease: 'Cubic.Out', onComplete: () => { this.boy.play('boy-idle'); done(); } }));
    } else if (step === 'introduction') scan(() => {});
    else if (step === 'discover') {
      this.valueLabels.forEach((label) => label.setVisible(true).setColor('#ffe694'));
    } else if (step === 'collector') {
      this.collector.setVisible(true).setPosition(COLLECTOR_X, COLLECTOR_Y);
      this.valueLabels.forEach((label, index) => label.setColor(index < 3 ? '#ffe694' : '#f2e6c0'));
    } else if (step === 'scanned') {
      scan(() => { for (let index = 0; index < 3; index++) this.setCrystalLit(index, true); });
    } else if (step === 'remove') {
      this.boy.play('boy-scan');
      tweens.push(this.tweens.add({ targets: this.collector, x: COLLECTOR_X + CRYSTAL_SPACING, duration: 900, ease: 'Cubic.InOut', onComplete: () => {
        this.setCrystalLit(0, false);
        this.valueLabels[0].setColor('#ffab91');
        this.valueLabels[3].setColor('#9ce5a6');
        this.boy.play('boy-idle');
        done();
      } }));
    } else if (step === 'add') {
      this.setCrystalLit(3, true);
      pulse(this.crystals[3].x, CRYSTAL_Y - 14);
    } else if (step === 'stage') {
      this.core.setTint(0xffe2a6);
      pulse(this.core.x, this.core.y - 65);
    }
    return () => {
      timers.forEach((timer) => timer.remove(false));
      tweens.forEach((tween) => tween.remove());
      effects.forEach((effect) => { if (effect.active) effect.destroy(); });
      this.boy.play('boy-idle');
    };
  }

  private createAnimations() {
    for (const spec of animationSpecs) {
      const metadata = this.cache.json.get(`${spec.key}-metadata`) as { frameCount: number; frameRate: number; repeat: number } | undefined;
      if (!metadata || this.anims.exists(spec.key)) continue;
      this.anims.create({
        key: spec.key,
        frames: this.anims.generateFrameNumbers(spec.key, { start: 0, end: metadata.frameCount - 1 }),
        frameRate: metadata.frameRate,
        repeat: metadata.repeat,
      });
    }
  }

  private onInput = (input: GameInput) => {
    if (input.source !== 'control') return;
    if (input.action === 'tutorial:skip') { this.tutorial.skip(); return; }
    if (input.action.startsWith('tutorial:advance:')) { this.tutorial.advance(input.action.slice('tutorial:advance:'.length)); return; }
    if (input.action === 'tutorial:replay') { if (!this.tutorial.state.active) this.startTutorial(true); return; }
    if (this.tutorial.state.active) return;
    if (input.action === 'demo') this.playWalkthrough();
    if (input.action === 'mission:restore') this.restoreGreenhouse();
  };

  private playWalkthrough() {
    if (this.demoRunning || this.restored) return;
    this.demoRunning = true;
    this.collector.setVisible(true).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.boy.play('boy-scan');
    this.runtime.bridge.emit('game:lesson', { message: 'Walkthrough only: the collector compares each 3-crystal window. Your C++ code runs separately in the judge.' });
    let start = 0;
    const scanNext = () => {
      if (this.restored) { this.demoRunning = false; return; }
      if (start >= greenhouseCrystals.length - greenhouseWindowSize + 1) {
        const best = Math.max(...Array.from({ length: greenhouseCrystals.length - greenhouseWindowSize + 1 }, (_, i) => greenhouseCrystals.slice(i, i + greenhouseWindowSize).reduce((sum, value) => sum + value, 0)));
        this.runtime.bridge.emit('game:lesson', { message: `Walkthrough complete. The best window sums to ${best}.` });
        this.demoRunning = false;
        this.collector.setVisible(false);
        this.boy.play('boy-idle');
        return;
      }
      const sum = greenhouseCrystals.slice(start, start + greenhouseWindowSize).reduce((total, value) => total + value, 0);
      this.runtime.bridge.emit('game:lesson', { message: `Window ${start + 1}–${start + greenhouseWindowSize} has a sum of ${sum}.` });
      this.tweens.add({
        targets: this.collector,
        x: COLLECTOR_X + start * CRYSTAL_SPACING,
        duration: 420,
        ease: 'Cubic.Out',
        onComplete: () => {
          start += 1;
          this.time.delayedCall(200, scanNext);
        },
      });
    };
    scanNext();
  }

  private restoreGreenhouse() {
    if (this.restored) return;
    this.restored = true;
    this.demoRunning = false;
    this.tweens.killTweensOf(this.collector);
    this.collector.setVisible(false);
    this.crystals.forEach((crystal) => crystal.setTexture('gh-crystal-sparkles').setOrigin(0.5, 34 / 44));
    this.core.setTexture('gh-core-powered');
    this.plants[0]?.setTexture('gh-fern-revived');
    this.plants[1]?.setTexture('gh-flower-revived');
    this.plants[2]?.setTexture('gh-vine-revived');
    this.boy.play('boy-celebrate');
    this.plants.forEach((plant, index) => {
      const pulse = this.add.sprite(plant.x, plant.y - 26, 'pulse').setDepth(10).setScale(1.5);
      this.world.add(pulse);
      this.successEffects.push(pulse);
      pulse.play('pulse');
      pulse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => pulse.destroy());
      this.tweens.add({ targets: plant, scaleX: 1.12, scaleY: 1.12, duration: 240, delay: index * 130, yoyo: true, ease: 'Back.Out' });
    });
    this.energyMote = this.add.sprite(this.core.x, this.core.y - 75, 'energy-mote').setDepth(9);
    this.world.add(this.energyMote);
    this.energyMote.play('energy-mote');
    this.runtime.progress.checkpoint(this.stage.id, 'greenhouse-restored', { maxCrystalEnergy: 17, windowSize: greenhouseWindowSize });
    this.runtime.completeStage(this.stage.id, 17);
    this.runtime.bridge.emit('game:lesson', { message: 'Accepted C++ solution. The hidden tests passed and the greenhouse is restored.' });
  }

  private layout = () => {
    const width = this.scale.width;
    const height = this.scale.height;
    // Reserve readable dialogue space; fit the occupied part of the scene below it.
    const tutorialSpace = this.tutorial?.state.active ? height * 0.55 : 0;
    const unit = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT, (height - tutorialSpace) / 160);
    const backgroundScale = Math.max(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    this.backdrop
      .setPosition(width / 2, height / 2)
      .setDisplaySize(WORLD_WIDTH * backgroundScale, WORLD_HEIGHT * backgroundScale);
    this.world
      .setScale(unit)
      .setPosition((width - WORLD_WIDTH * unit) / 2, Math.max(0, height - WORLD_HEIGHT * unit));
  };

  private onAssetError = (file: Phaser.Loader.File) => {
    this.assetErrors.add(file.key);
    this.runtime.bridge.emit('game:error', { message: `Could not load greenhouse asset: ${file.key}` });
  };

  private shutdown() {
    this.tutorial?.dispose();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.unsubscribe?.();
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onAssetError);
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
