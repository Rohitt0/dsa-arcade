import Phaser from 'phaser';
import type { GameInput, GameRuntime, StageDefinition } from '../types';
import { findLongestBudgetWindow, greenhouseStageIds, stageBudget, stageCrystals } from '../content/greenhouse';
import { getFixedWindowSums } from '../content/fixed-windows';
import { findMinimumWindow } from '../content/variable-windows';
import { GreenhouseTutorialController } from '../GreenhouseTutorialController';
import { tutorialCrystals, tutorialPractice, type TutorialStep } from '../content/greenhouse-tutorial';

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
  private variableCollector!: Phaser.GameObjects.Graphics;
  private bestMarker!: Phaser.GameObjects.Graphics;
  private crystals: Phaser.GameObjects.Image[] = [];
  private valueLabels: Phaser.GameObjects.Text[] = [];
  private plants: Phaser.GameObjects.Image[] = [];
  private core!: Phaser.GameObjects.Image;
  private boy!: Phaser.GameObjects.Sprite;
  private energyMote?: Phaser.GameObjects.Sprite;
  private demoRunning = false;
  private successAnimationRunning = false;
  private restored = false;
  private transitionStarted = false;
  private departureRouted = false;
  private unsubscribe?: () => void;
  private assetErrors = new Set<string>();
  private tutorial!: GreenhouseTutorialController;
  private successEffects: Phaser.GameObjects.Sprite[] = [];
  private get activeCrystals() { return stageCrystals(this.stage); }
  private get windowSize() { return Number(this.stage.config.windowSize ?? 3); }
  private get target() { return Number(this.stage.config.target ?? this.stage.config.budget ?? 0); }
  private get budget() { return stageBudget(this.stage); }

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
    for (let i = 0; i < this.activeCrystals.length; i++) {
      const cx = FIRST_CRYSTAL_X + i * CRYSTAL_SPACING;
      const crystal = this.add.image(cx, CRYSTAL_Y, 'gh-crystal-dormant')
        .setOrigin(0.5, 30 / 32).setDepth(5).setInteractive({ useHandCursor: true });
      this.crystals.push(crystal);
      this.world.add(crystal);
      // Keep values above the crystal tips and collector, clear of the plants below.
      const label = this.add.text(cx, CRYSTAL_Y - 44, String(this.activeCrystals[i]), {
        fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#f2e6c0',
        backgroundColor: '#172c31', padding: { x: 4, y: 3 },
      }).setOrigin(0.5).setDepth(12).setResolution(3);
      this.valueLabels.push(label);
      this.world.add(label);
      crystal.on('pointerover', () => { if (!this.tutorial?.state.active) { crystal.setScale(1.15); label.setColor('#ffe694'); } });
      crystal.on('pointerout', () => { if (!this.tutorial?.state.active) { crystal.setScale(1); label.setColor('#f2e6c0'); } });
      crystal.on('pointerup', () => {
        if (!this.tutorial?.state.active) this.runtime.bridge.emit('game:lesson', { message: `Crystal ${i + 1} stores ${this.activeCrystals[i]} energy.` });
      });
    }
    this.collector = this.add.image(COLLECTOR_X, COLLECTOR_Y, 'gh-collector')
      .setOrigin(0, 0.5).setDisplaySize(CRYSTAL_SPACING * this.windowSize, 36)
      .setAlpha(0.88).setDepth(6).setVisible(false);
    this.world.add(this.collector);
    this.variableCollector = this.add.graphics().setDepth(7).setVisible(false);
    this.bestMarker = this.add.graphics().setDepth(8).setVisible(false);
    this.world.add(this.variableCollector);
    this.world.add(this.bestMarker);

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
    const seenTutorial = Boolean(this.runtime.progress.read(this.stage.id, 'onboarding'));
    const returning = this.restored || seenTutorial || ['draft', 'attempted'].some((id) => Boolean(this.runtime.progress.read(this.stage.id, id)));
    if (!returning && this.stage.id !== greenhouseStageIds.restore) { this.startTutorial(false); this.runtime.bridge.emit('game:ready', { gameId: this.runtime.game.id }); return; }
    if (this.isSustainStage()) {
      this.enterMission();
      this.boy.setX(-30).play('boy-walk');
      this.tweens.add({
        targets: this.boy,
        x: 42,
        duration: 850,
        ease: 'Cubic.Out',
        onComplete: () => this.boy.play('boy-idle'),
      });
      this.cameras.main.fadeIn(350, 8, 15, 18);
      this.runtime.bridge.emit('game:tutorial', { ...this.tutorial.state });
      if (!this.restored && !this.runtime.progress.read(this.stage.id, 'intro-dismissed')) {
        this.runtime.bridge.emit('game:mission-intro', {
          stageId: this.stage.id,
          title: 'Keep the Greenhouse Alive',
          message: `The greenhouse is awake! Count every group of ${this.windowSize} neighboring crystals that supplies at least ${this.target} energy.`,
        });
      }
      if (this.restored) this.emitSustainSuccess();
    } else if (this.isBurstStage()) {
      this.enterMission();
      this.boy.setX(-30).play('boy-walk');
      this.tweens.add({ targets: this.boy, x: 42, duration: 850, ease: 'Cubic.Out', onComplete: () => this.boy.play('boy-idle') });
      this.cameras.main.fadeIn(350, 8, 15, 18);
      this.runtime.bridge.emit('game:tutorial', { ...this.tutorial.state });
      if (this.restored) this.emitBurstSuccess();
      else if (!this.runtime.progress.read(this.stage.id, 'intro-dismissed')) {
        this.runtime.bridge.emit('game:mission-intro', {
          stageId: this.stage.id,
          title: 'A Short Burst',
          message: 'The flowers need a quick burst of energy. Connect enough neighboring crystals to reach the target—but use the shortest group you can.',
        });
      }
    } else if (returning) {
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
    this.restored = Boolean(this.runtime.progress.read(this.stage.id, 'greenhouse-restored'));
    this.applyAppearance(this.restored);
    this.collector.setVisible(false).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.variableCollector.setVisible(false);
    this.bestMarker.setVisible(false);
    const practice = tutorialPractice[this.stage.id];
    const row = practice ?? this.activeCrystals;
    this.valueLabels.forEach((label, index) => label.setText(String(row[index] ?? this.activeCrystals[index])).setVisible(false).setColor('#f2e6c0'));
    this.runtime.bridge.emit('game:controls', { stageId: this.stage.id, controls: [] });
    this.tutorial.start(replay, this.stage.id);
  }

  private enterMission() {
    this.applyAppearance(this.restored);
    if (this.isSustainStage() || this.isBurstStage() || this.isBudgetStage()) {
      this.core.setTexture('gh-core-powered');
      this.plants[0]?.setTexture('gh-fern-revived');
      this.plants[1]?.setTexture('gh-flower-revived');
      this.plants[2]?.setTexture('gh-vine-revived');
      if (!this.restored) this.crystals.forEach((_, index) => this.setCrystalLit(index, false));
    }
    this.collector.setVisible(false).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.variableCollector.setVisible(false);
    this.bestMarker.setVisible(false);
    this.valueLabels.forEach((label, index) => label.setText(String(this.activeCrystals[index])).setVisible(true).setColor('#f2e6c0'));
    this.boy.setX(42).play('boy-idle');
    const walkthroughLabel = this.isBurstStage() ? 'Show variable-window walkthrough' : this.isSustainStage() ? 'Show fixed-window walkthrough' : 'Show sliding-window walkthrough';
    this.runtime.bridge.emit('game:controls', { stageId: this.stage.id, controls: [{ id: 'demo', label: walkthroughLabel }] });
    this.runtime.bridge.emit('game:lesson', { message: this.isSustainStage()
      ? `Find every ${this.windowSize}-crystal window with at least ${this.target} energy. The powered core and revived plants are ready to keep growing.`
      : this.isBurstStage()
        ? `Charge the flower with the fewest neighboring crystals whose sum reaches ${Number(this.stage.config.target)}. Grow the window, then shrink it while it still has enough energy.`
        : this.isBudgetStage()
          ? `Keep the vines warm with the longest neighboring crystal group whose sum stays at or below the ${this.target}-energy budget.`
      : this.restored
        ? 'Your greenhouse is restored. You can revisit your solution or replay the tutorial.'
        : `Find the maximum energy in exactly ${this.windowSize} consecutive crystals. Write a C++ solution function, then run the examples.` });
  }

  private isSustainStage() { return this.stage.id === greenhouseStageIds.sustain; }
  private isBurstStage() { return this.stage.id === greenhouseStageIds.burst; }
  private isBudgetStage() { return this.stage.id === greenhouseStageIds.budget; }

  private drawVariableCollector(left: number, right: number, valid: boolean) {
    if (right < left - 1) {
      this.variableCollector.clear().setVisible(false);
      return;
    }
    const leftX = FIRST_CRYSTAL_X + left * CRYSTAL_SPACING - CRYSTAL_SPACING / 2;
    const rightX = FIRST_CRYSTAL_X + right * CRYSTAL_SPACING + CRYSTAL_SPACING / 2;
    const topY = CRYSTAL_Y - 33;
    const bottomY = CRYSTAL_Y + 6;
    const color = valid ? 0xe9c96f : 0x91acb2;
    this.variableCollector.clear().lineStyle(2, color, 0.96);
    this.variableCollector.lineBetween(leftX, topY + 4, rightX, topY + 4);
    this.variableCollector.lineBetween(leftX, bottomY - 4, rightX, bottomY - 4);
    this.variableCollector.lineBetween(leftX, topY + 4, leftX, bottomY - 4);
    this.variableCollector.lineBetween(rightX, topY + 4, rightX, bottomY - 4);
    this.variableCollector.lineBetween(leftX, topY + 4, leftX + 6, topY + 4);
    this.variableCollector.lineBetween(leftX, bottomY - 4, leftX + 6, bottomY - 4);
    this.variableCollector.lineBetween(rightX - 6, topY + 4, rightX, topY + 4);
    this.variableCollector.lineBetween(rightX - 6, bottomY - 4, rightX, bottomY - 4);
    this.variableCollector.fillStyle(valid ? 0xffe18b : 0xaec2c7, 1);
    this.variableCollector.fillRect(leftX - 1, topY + 1, 3, 3);
    this.variableCollector.fillRect(rightX - 1, topY + 1, 3, 3);
    this.variableCollector.setVisible(true);
  }

  private animateVariableWindow(fromLeft: number, fromRight: number, toLeft: number, toRight: number, valid: boolean, done: () => void) {
    const progress = { value: 0 };
    this.variableCollector.setVisible(true);
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: 320,
      ease: 'Cubic.InOut',
      onUpdate: () => {
        const t = progress.value;
        this.drawVariableCollector(fromLeft + (toLeft - fromLeft) * t, fromRight + (toRight - fromRight) * t, valid);
      },
      onComplete: () => {
        this.drawVariableCollector(toLeft, toRight, valid);
        done();
      },
    });
  }

  private setBestMarker(start: number, end: number) {
    const leftX = FIRST_CRYSTAL_X + start * CRYSTAL_SPACING - CRYSTAL_SPACING / 2;
    const rightX = FIRST_CRYSTAL_X + end * CRYSTAL_SPACING + CRYSTAL_SPACING / 2;
    const y = CRYSTAL_Y + 10;
    this.bestMarker.clear().lineStyle(2, 0xffd66e, 1).lineBetween(leftX, y, rightX, y);
    this.bestMarker.lineBetween(leftX, y - 4, leftX, y + 2).lineBetween(rightX, y - 4, rightX, y + 2);
    this.bestMarker.setVisible(true);
  }

  private burstStatus(phase: string, detail: string, sum: number, left: number, right: number, best: number | null) {
    const length = Math.max(0, right - left + 1);
    this.runtime.bridge.emit('game:lesson', {
      message: `Reference walkthrough · ${phase} — ${detail} | Current sum: ${sum} | Target: ${Number(this.stage.config.target)} | Current window length: ${length} | Shortest valid length: ${best ?? '—'} | Left boundary: ${left < right + 1 ? left + 1 : '—'} · Right boundary: ${right >= left ? right + 1 : '—'}`,
    });
    this.runtime.progress.checkpoint(this.stage.id, 'walkthrough-state', { started: true, phase, sum, target: Number(this.stage.config.target), windowLength: length, bestLength: best });
  }

  private playBurstWalkthrough() {
    if (this.demoRunning || this.restored) return;
    this.demoRunning = true;
    const values = this.activeCrystals;
    const target = Number(this.stage.config.target);
    let left = 0;
    let right = -1;
    let sum = 0;
    let bestLength: number | null = null;
    let bestRange: { start: number; end: number } | null = null;
    this.collector.setVisible(false);
    this.variableCollector.setVisible(false);
    this.bestMarker.setVisible(false);
    this.boy.play('boy-scan');
    this.runtime.progress.checkpoint(this.stage.id, 'walkthrough-state', { started: true, completed: false });
    this.burstStatus('READY', 'Reference explanation only; it does not run or submit your C++ code.', sum, left, right, bestLength);

    const finish = () => {
      if (!this.demoRunning || !this.scene.isActive()) return;
      this.demoRunning = false;
      this.variableCollector.setVisible(false);
      this.boy.play('boy-idle');
      this.crystals.forEach((crystal) => crystal.clearTint());
      this.valueLabels.forEach((label) => label.setColor('#f2e6c0'));
      this.runtime.progress.checkpoint(this.stage.id, 'walkthrough-state', { started: true, completed: true, bestLength: bestLength ?? 0, bestStart: bestRange?.start ?? -1 });
      this.burstStatus('COMPLETE', `Reference walkthrough finished. Minimum length: ${bestLength ?? 0}.`, sum, left, right, bestLength);
    };

    const nextExpansion = () => {
      if (!this.demoRunning || !this.scene.isActive()) return;
      if (right + 1 >= values.length) { finish(); return; }
      const oldRight = right;
      right++;
      sum += values[right]!;
      this.animateVariableWindow(left, oldRight, left, right, false, () => {
        this.crystals.forEach((crystal, index) => crystal.setTint(index >= left && index <= right ? 0xb7d0d5 : 0xffffff));
        this.valueLabels.forEach((label, index) => label.setColor(index >= left && index <= right ? '#cbdde0' : '#f2e6c0'));
        this.burstStatus('EXPAND', `Include crystal ${values[right]} at the right boundary; add ${values[right]} energy.`, sum, left, right, bestLength);
        this.time.delayedCall(430, evaluateAndShrink);
      });
    };

    const removeLeft = () => {
      if (!this.demoRunning || !this.scene.isActive()) return;
      const removed = values[left]!;
      const oldLeft = left;
      sum -= removed;
      left++;
      this.animateVariableWindow(oldLeft, right, left, right, sum >= target, () => {
        this.crystals[oldLeft]?.clearTint();
        this.valueLabels[oldLeft]?.setColor('#f2e6c0');
        this.burstStatus(sum >= target ? 'SHRINK · STILL VALID' : 'SHRINK · BELOW TARGET', `Remove leftmost crystal ${removed}; subtract ${removed} energy.`, sum, left, right, bestLength);
        this.time.delayedCall(430, evaluateAndShrink);
      });
    };

    const evaluateAndShrink = () => {
      if (!this.demoRunning || !this.scene.isActive()) return;
      if (sum < target) {
        this.drawVariableCollector(left, right, false);
        if (right >= left) this.burstStatus('BELOW TARGET', 'Resume expansion until the sum is large enough.', sum, left, right, bestLength);
        this.time.delayedCall(320, nextExpansion);
        return;
      }
      const length = right - left + 1;
      if (bestLength === null || length < bestLength) {
        bestLength = length;
        bestRange = { start: left, end: right };
        this.setBestMarker(left, right);
      }
      this.drawVariableCollector(left, right, true);
      this.crystals.forEach((crystal, index) => crystal.setTint(index >= left && index <= right ? 0xffd86f : 0xffffff));
      this.valueLabels.forEach((label, index) => label.setColor(index >= left && index <= right ? '#ffe694' : '#f2e6c0'));
      this.burstStatus('VALID · GOLD', `Sum reaches target. Compare length ${length} with the best so far.`, sum, left, right, bestLength);
      this.time.delayedCall(430, removeLeft);
    };

    nextExpansion();
  }

  private animateBurstSuccess(replay: boolean) {
    if (this.successAnimationRunning) return;
    const target = Number(this.stage.config.target);
    const range = findMinimumWindow(this.activeCrystals, target);
    this.demoRunning = false;
    this.successAnimationRunning = true;
    this.tweens.killTweensOf(this.variableCollector);
    this.variableCollector.setVisible(false);
    this.bestMarker.setVisible(false);
    if (!range) {
      this.finishBurstSuccess(0, replay);
      return;
    }
    this.setBestMarker(range.start, range.end);
    this.animateVariableWindow(range.start, range.start - 1, range.start, range.end, true, () => {
      const mote = this.add.sprite((this.crystals[range.start]!.x + this.crystals[range.end]!.x) / 2, CRYSTAL_Y - 18, 'energy-mote').setDepth(12);
      this.world.add(mote);
      for (let index = range.start; index <= range.end; index++) this.setCrystalLit(index, true);
      mote.play('energy-mote');
      this.tweens.add({
        targets: mote,
        x: this.plants[1]!.x,
        y: this.plants[1]!.y - 50,
        duration: 760,
        ease: 'Cubic.In',
        onComplete: () => {
          mote.destroy();
          const pulse = this.add.sprite(this.plants[1]!.x, this.plants[1]!.y - 30, 'pulse').setDepth(12).setScale(1.1);
          this.world.add(pulse);
          pulse.play('pulse');
          this.tweens.add({ targets: this.plants[1], scaleX: 0.84, scaleY: 0.84, duration: 260, yoyo: true, onComplete: () => this.plants[1]!.setScale(0.72) });
          this.boy.play('boy-celebrate');
          pulse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => pulse.destroy());
          this.time.delayedCall(650, () => this.finishBurstSuccess(range.length, replay));
        },
      });
    });
  }

  private finishBurstSuccess(length: number, replay: boolean) {
    this.boy.play('boy-celebrate');
    this.time.delayedCall(520, () => {
      this.boy.play('boy-idle');
      this.successAnimationRunning = false;
      if (!replay) {
        this.runtime.progress.checkpoint(this.stage.id, 'greenhouse-restored', { completed: true, minimumBurstLength: length });
        this.runtime.progress.checkpoint(this.stage.id, 'stage-complete', { completed: true, minimumBurstLength: length });
        this.runtime.completeStage(this.stage.id, length);
      }
      this.emitBurstSuccess(length);
    });
  }

  private emitBurstSuccess(length = findMinimumWindow(this.activeCrystals, this.target)?.length ?? 0) {
    this.runtime.bridge.emit('game:mission-success', {
      stageId: this.stage.id,
      count: length,
      message: length > 0 ? `Only ${length} crystals needed. The flowers have their perfect burst!` : 'Correct—this crystal row cannot supply the required burst.',
    });
  }

  private dismissMissionIntro() {
    this.runtime.progress.checkpoint(this.stage.id, 'intro-dismissed', { dismissed: true });
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
    if (step.startsWith('s2') || step.startsWith('s3') || step.startsWith('s4')) {
      const practice = tutorialPractice[this.stage.id];
      const row = practice ?? this.activeCrystals;
      if (practice) this.valueLabels.forEach((label, index) => label.setText(String(row[index] ?? '')).setVisible(index < row.length));
      const isStageIntro = step === 's2intro' || step === 's3intro' || step === 's4intro';
      if (isStageIntro) {
        this.boy.setX(-30).play('boy-walk');
        tweens.push(this.tweens.add({ targets: this.boy, x: 42, duration: 800, ease: 'Cubic.Out', onComplete: () => { this.boy.play('boy-idle'); done(); } }));
      }
      if (step === 's2scan' || step === 's2slide') {
        this.collector.setVisible(true).setPosition(COLLECTOR_X + (step === 's2slide' ? CRYSTAL_SPACING : 0), COLLECTOR_Y);
        const offset = step === 's2slide' ? 1 : 0;
        this.drawTutorialFixedWindow(offset, 3);
      }
      if (step === 's3intro' || step === 's4intro') {
        this.variableCollector.setVisible(true).clear();
        this.bestMarker.setVisible(false);
      }
      const burstRanges: Record<string, [number, number]> = { s3one: [0,0], s3two: [0,1], s3three: [0,2], s3four: [1,2], s3five: [2,2] };
      const budgetRanges: Record<string, [number, number]> = { s4one: [0,0], s4two: [0,1], s4three: [0,2], s4four: [0,3], s4five: [1,3], s4six: [2,3], s4seven: [3,3] };
      const range = burstRanges[step] ?? budgetRanges[step];
      if (practice && range) {
        const [left, right] = range;
        const valid = step !== 's4four' && step !== 's4five' && step !== 's4six';
        this.drawVariableCollector(left, right, valid);
        this.valueLabels.forEach((label, i) => label.setColor(i >= left && i <= right ? (valid ? '#ffe694' : '#ffab91') : '#f2e6c0'));
        if (step === 's3three') this.setBestMarker(0, 2);
        if (step === 's3four') this.setBestMarker(1, 2);
        if (step === 's4three') this.setBestMarker(0, 2);
      }
      if (!isStageIntro) done();
    } else if (step === 'arrival') {
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

  private drawTutorialFixedWindow(start: number, size: number) {
    const x = COLLECTOR_X + start * CRYSTAL_SPACING;
    this.collector.setPosition(x, COLLECTOR_Y);
    this.crystals.forEach((crystal, index) => crystal.setTint(index >= start && index < start + size ? 0xffd768 : 0xffffff));
    this.valueLabels.forEach((label, index) => label.setColor(index >= start && index < start + size ? '#ffe694' : '#f2e6c0'));
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
    if (input.action === 'mission:intro-dismiss') { this.dismissMissionIntro(); return; }
    if (input.action === 'mission:transition-stage2') { this.transitionToStageTwo(); return; }
    if (input.action === 'mission:transition-stage3') { this.transitionToStageThree(); return; }
    if (input.action === 'mission:transition-stage4') { this.transitionToStageFour(); return; }
    if (input.action === 'mission:chapter-exit') { this.transitionToBinarySearch(); return; }
    if (input.action === 'mission:skip-chapter-exit') {
      if (this.isBudgetStage() && this.restored) {
        this.transitionStarted = true;
        this.finishChapterDeparture();
      }
      return;
    }
    if (input.action === 'mission:replay-success' && this.isSustainStage() && this.restored && !this.successAnimationRunning) {
      this.successAnimationRunning = true;
      this.boy.play('boy-celebrate');
      this.core.setTint(0xffdc76);
      this.tweens.add({ targets: this.core, scaleX: 1.12, scaleY: 1.12, duration: 280, yoyo: true, onComplete: () => {
        this.core.clearTint().setScale(1);
        this.boy.play('boy-idle');
        this.successAnimationRunning = false;
        this.emitSustainSuccess();
      } });
      return;
    }
    if (input.action === 'mission:replay-success' && this.isBurstStage() && this.restored && !this.successAnimationRunning) {
      this.animateBurstSuccess(true);
      return;
    }
    if (input.action === 'mission:replay-success' && this.isBudgetStage() && this.restored && !this.successAnimationRunning) {
      const range = findLongestBudgetWindow(this.activeCrystals, this.budget);
      this.successAnimationRunning = true;
      if (range.length) this.setBestMarker(range.start, range.end);
      this.boy.play('boy-celebrate');
      this.core.setTint(0xffdc76);
      this.tweens.add({ targets: this.core, scaleX: 1.12, scaleY: 1.12, duration: 280, yoyo: true, onComplete: () => {
        this.core.clearTint().setScale(1);
        this.boy.play('boy-idle');
        this.successAnimationRunning = false;
        this.runtime.bridge.emit('game:mission-success', { stageId: this.stage.id, count: range.length, message: this.budgetSuccessMessage(range.length) });
      } });
      return;
    }
    if (this.tutorial.state.active) return;
    if (input.action === 'demo') {
      if (this.isBurstStage()) this.playBurstWalkthrough();
      else if (this.isSustainStage()) this.playReliableWalkthrough();
      else if (this.isBudgetStage()) this.playBudgetWalkthrough();
      else this.playWalkthrough();
    }
    if (input.action === 'mission:restore') this.restoreGreenhouse();
  };

  private transitionToStageTwo() {
    if (this.isSustainStage() || this.isBurstStage() || !this.restored || this.transitionStarted) return;
    this.transitionStarted = true;
    this.tweens.killAll();
      this.boy.play('boy-walk');
    this.tweens.add({
      targets: this.boy,
      x: WORLD_WIDTH + 50,
      duration: 1_050,
      ease: 'Linear',
      onComplete: () => {
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.runtime.bridge.emit('game:transition-ready', { stageId: this.stage.id });
        });
        this.cameras.main.fadeOut(420, 8, 15, 18);
      },
    });
  }

  private transitionToStageThree() {
    if (!this.isSustainStage() || !this.restored || this.transitionStarted) return;
    this.transitionStarted = true;
    this.tweens.killAll();
    this.boy.play('boy-walk');
    this.tweens.add({
      targets: this.boy,
      x: WORLD_WIDTH + 50,
      duration: 1_050,
      ease: 'Linear',
      onComplete: () => {
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.runtime.bridge.emit('game:transition-ready', { stageId: this.stage.id });
        });
        this.cameras.main.fadeOut(420, 8, 15, 18);
      },
    });
  }

  private transitionToStageFour() {
    if (!this.isBurstStage() || !this.restored || this.transitionStarted) return;
    this.transitionStarted = true;
    this.tweens.killAll();
    this.boy.play('boy-walk');
    this.tweens.add({ targets: this.boy, x: WORLD_WIDTH + 50, duration: 1_050, ease: 'Linear', onComplete: () => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.runtime.bridge.emit('game:transition-ready', { stageId: this.stage.id }));
      this.cameras.main.fadeOut(420, 8, 15, 18);
    } });
  }

  private powerWindows() {
    return getFixedWindowSums(this.activeCrystals, this.windowSize);
  }

  private playReliableWalkthrough() {
    if (this.demoRunning || this.restored) return;
    this.demoRunning = true;
    this.collector.setVisible(true).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.boy.play('boy-scan');
    let start = 0;
    let reliable = 0;
    const windows = this.powerWindows();
    const scan = () => {
      if (!this.demoRunning || !this.scene.isActive()) return;
      if (start >= windows.length) {
        this.runtime.bridge.emit('game:lesson', { message: `Reference walkthrough complete: ${reliable} reliable windows. This explanation does not run or submit your C++ code.` });
        this.demoRunning = false;
        this.collector.setVisible(false);
        this.boy.play('boy-idle');
        this.valueLabels.forEach((label) => label.setColor('#f2e6c0'));
        return;
      }
      const { sum } = windows[start];
      const qualifies = sum >= this.target;
      for (let index = 0; index < this.crystals.length; index++) {
        const active = index >= start && index < start + this.windowSize;
        this.crystals[index].setTint(active ? (qualifies ? 0xffd768 : 0xb8d4e5) : 0xffffff);
        this.valueLabels[index].setColor(active ? (qualifies ? '#ffe694' : '#d2e5ed') : '#f2e6c0');
      }
      this.tweens.add({
        targets: this.collector,
        x: COLLECTOR_X + start * CRYSTAL_SPACING,
        duration: start === 0 ? 280 : 420,
        ease: 'Cubic.Out',
        onComplete: () => {
          if (qualifies) {
            reliable += 1;
            const pulse = this.add.sprite(this.collector.x + 48, CRYSTAL_Y - 20, 'pulse').setDepth(11).setScale(0.65);
            this.world.add(pulse);
            pulse.play('pulse');
            pulse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => pulse.destroy());
          }
          this.runtime.bridge.emit('game:lesson', {
            message: `Reference walkthrough · window ${start + 1}/${windows.length}: sum ${sum} ${qualifies ? '≥' : '<'} target ${this.target} · Reliable windows: ${reliable}${start < windows.length - 1 ? ` · slide: subtract ${this.activeCrystals[start]}, add ${this.activeCrystals[start + this.windowSize]}` : ''}`,
          });
          start += 1;
          this.time.delayedCall(680, scan);
        },
      });
    };
    this.runtime.bridge.emit('game:lesson', { message: 'Reference explanation only: the collector scans all six fixed windows independently of your C++ execution.' });
    scan();
  }

  private playWalkthrough() {
    if (this.demoRunning || this.restored) return;
    this.demoRunning = true;
    this.collector.setVisible(true).setPosition(COLLECTOR_X, COLLECTOR_Y);
    this.boy.play('boy-scan');
    this.runtime.bridge.emit('game:lesson', { message: 'Walkthrough only: the collector compares each 3-crystal window. Your C++ code runs separately in the judge.' });
    let start = 0;
    const scanNext = () => {
      if (this.restored) { this.demoRunning = false; return; }
      if (start >= this.activeCrystals.length - this.windowSize + 1) {
        const best = Math.max(...Array.from({ length: this.activeCrystals.length - this.windowSize + 1 }, (_, i) => this.activeCrystals.slice(i, i + this.windowSize).reduce((sum, value) => sum + value, 0)));
        this.runtime.bridge.emit('game:lesson', { message: `Walkthrough complete. The best window sums to ${best}.` });
        this.demoRunning = false;
        this.collector.setVisible(false);
        this.boy.play('boy-idle');
        return;
      }
      const sum = this.activeCrystals.slice(start, start + this.windowSize).reduce((total, value) => total + value, 0);
      this.runtime.bridge.emit('game:lesson', { message: `Window ${start + 1}–${start + this.windowSize} has a sum of ${sum}.` });
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

  private playBudgetWalkthrough() {
    if (this.demoRunning || this.restored) return;
    this.demoRunning = true;
    const values = this.activeCrystals; let left = 0; let sum = 0; let best = 0; let right = 0;
    const step = () => {
      if (!this.demoRunning || !this.scene.isActive()) return;
      if (right >= values.length) { this.demoRunning = false; this.variableCollector.setVisible(false); this.boy.play('boy-idle'); return; }
      sum += values[right]!;
      while (sum > this.target && left <= right) sum -= values[left++]!;
      const length = right - left + 1;
      if (length > best) { best = length; if (length) this.setBestMarker(left, right); }
      this.drawVariableCollector(left, right, sum <= this.target);
      this.runtime.bridge.emit('game:lesson', { message: `Reference walkthrough · include ${values[right]} · sum ${sum}/${this.target} · current valid length ${length} · best length ${best}.` });
      right++;
      this.time.delayedCall(620, step);
    };
    this.boy.play('boy-scan');
    this.runtime.bridge.emit('game:lesson', { message: 'Reference demonstration only. Expand, shrink while over budget, then update the longest valid range.' });
    step();
  }

  private restoreGreenhouse() {
    if (this.restored) return;
    if (this.isBudgetStage()) {
      const range = findLongestBudgetWindow(this.activeCrystals, this.budget);
      this.restored = true;
      this.demoRunning = false;
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.successAnimationRunning = true;
      this.variableCollector.setVisible(false);
      this.applyAppearance(false);
      this.core.setTexture('gh-core-powered');
      ['fern', 'flower', 'vine'].forEach((name, index) => this.plants[index]?.setTexture(`gh-${name}-revived`));
      this.runtime.progress.checkpoint(this.stage.id, 'greenhouse-restored', { completed: true, longestWindow: range.length, start: range.start });
      this.runtime.progress.checkpoint(this.stage.id, 'stage-complete', { completed: true, longestWindow: range.length });
      this.runtime.completeStage(this.stage.id, range.length);
      this.animateBudgetSuccess(range, false);
      return;
    }
    if (this.isBurstStage()) {
      this.restored = true;
      this.demoRunning = false;
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.variableCollector.setVisible(false);
      this.animateBurstSuccess(false);
      return;
    }
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
    if (this.isSustainStage()) {
      this.restoreReliableSupply();
      return;
    }
    this.energyMote = this.add.sprite(this.core.x, this.core.y - 75, 'energy-mote').setDepth(9);
    this.world.add(this.energyMote);
    this.energyMote.play('energy-mote');
    const best = Math.max(...getFixedWindowSums(this.activeCrystals, this.windowSize).map(({ sum }) => sum));
    this.runtime.progress.checkpoint(this.stage.id, 'greenhouse-restored', { maxCrystalEnergy: best, windowSize: this.windowSize });
    this.runtime.completeStage(this.stage.id, best);
    this.runtime.bridge.emit('game:lesson', { message: 'Accepted C++ solution. The greenhouse core is powered and the plants are restored.' });
  }

  private budgetSuccessMessage(length: number) {
    if (!length) return 'The greenhouse is safe. No crystals fit the heating budget, and the vines are protected.';
    const words = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
    const quantity = words[length] ?? String(length);
    return `${quantity} ${length === 1 ? 'crystal' : 'crystals'} connected safely. The greenhouse is thriving!`;
  }

  private animateBudgetSuccess(range: { start: number; end: number; length: number }, replay: boolean) {
    this.successAnimationRunning = true;
    const celebrate = () => {
      if (!this.scene.isActive()) return;
      this.core.setTexture('gh-core-powered').clearTint();
      const corePulse = this.add.sprite(this.core.x, this.core.y - 65, 'pulse').setDepth(12).setScale(1.1);
      this.world.add(corePulse);
      corePulse.play('pulse');
      corePulse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => corePulse.destroy());
      this.boy.play('boy-celebrate');
      this.boy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.boy.play('boy-idle');
        this.successAnimationRunning = false;
        this.runtime.bridge.emit('game:mission-success', { stageId: this.stage.id, count: range.length, message: this.budgetSuccessMessage(range.length) });
      });
    };
    if (range.length <= 0) { this.variableCollector.setVisible(false); celebrate(); return; }
    this.setBestMarker(range.start, range.end);
    this.animateVariableWindow(range.start, range.start - 1, range.start, range.end, true, () => {
      for (let index = range.start; index <= range.end; index++) this.setCrystalLit(index, true);
      const mote = this.add.sprite((this.crystals[range.start]!.x + this.crystals[range.end]!.x) / 2, CRYSTAL_Y - 16, 'energy-mote').setDepth(12);
      this.energyMote = mote;
      this.world.add(mote);
      mote.setTint(0xffd86b).play('energy-mote');
      this.tweens.add({ targets: mote, x: this.plants[2]!.x, y: this.plants[2]!.y - 40, duration: 780, ease: 'Cubic.In', onComplete: () => {
        mote.destroy(); this.energyMote = undefined;
        const vinePulse = this.add.sprite(this.plants[2]!.x, this.plants[2]!.y - 32, 'pulse').setDepth(12);
        this.world.add(vinePulse); vinePulse.play('pulse');
        vinePulse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => vinePulse.destroy());
        this.time.delayedCall(220, celebrate);
      } });
    });
  }

  private transitionToBinarySearch() {
    if (!this.isBudgetStage() || !this.restored || this.transitionStarted) return;
    this.transitionStarted = true;
    this.departureRouted = false;
    this.demoRunning = false;
    this.runtime.bridge.emit('game:lesson', { message: 'The greenhouse is safe. Let’s investigate the observatory’s signal.' });
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.cameras.main.fadeOut(160, 8, 15, 18);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.finishChapterDeparture());
      return;
    }
    const distance = WORLD_WIDTH + 64 - this.boy.x;
    const duration = Math.max(1_900, Math.min(2_700, distance / 0.22));
    let exitFadeComplete = false;
    let walkComplete = false;
    const finishDeparture = () => {
      if (exitFadeComplete && walkComplete) this.finishChapterDeparture();
    };
    this.boy.play('boy-walk');
    this.tweens.add({ targets: this.boy, x: WORLD_WIDTH + 64, duration, ease: 'Linear', onUpdate: () => {
      if (this.boy.x >= WORLD_WIDTH - 44 && !this.cameras.main.fadeEffect.isRunning && !exitFadeComplete) {
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => { exitFadeComplete = true; finishDeparture(); });
        this.cameras.main.fadeOut(500, 8, 15, 18);
      }
    }, onComplete: () => {
      walkComplete = true;
      finishDeparture();
    } });
  }

  private finishChapterDeparture() {
    if (this.departureRouted) return;
    this.departureRouted = true;
        this.runtime.bridge.emit('game:departure-ready', { destination: '/game/observatory?stage=binary-search-find-the-signal' });
  }

  private restoreReliableSupply() {
    this.demoRunning = false;
    const windows = this.powerWindows().filter(({ sum }) => sum >= this.target);
    this.runtime.progress.checkpoint(this.stage.id, 'greenhouse-restored', { reliableWindows: windows.length, target: this.target });
    if (!windows.length) {
      this.completeReliableSupply(windows.length);
      return;
    }
    let delivered = 0;
    for (const { start } of windows) {
      const mote = this.add.sprite(COLLECTOR_X + start * CRYSTAL_SPACING + 48, CRYSTAL_Y - 18, 'energy-mote').setDepth(12);
      this.world.add(mote);
      mote.play('energy-mote');
      this.tweens.add({
        targets: mote,
        x: this.core.x,
        y: this.core.y - 70,
        duration: 700,
        delay: delivered * 180,
        ease: 'Cubic.In',
        onComplete: () => {
          mote.destroy();
          delivered += 1;
          if (delivered === windows.length) this.completeReliableSupply(windows.length);
        },
      });
    }
  }

  private completeReliableSupply(count: number) {
    if (this.successAnimationRunning) return;
    this.successAnimationRunning = true;
    this.core.setTint(0xffdc76);
    this.tweens.add({ targets: this.core, scaleX: 1.12, scaleY: 1.12, duration: 260, yoyo: true, onComplete: () => {
      this.core.clearTint().setScale(1);
      this.successAnimationRunning = false;
    } });
    this.boy.play('boy-celebrate');
    this.runtime.progress.checkpoint(this.stage.id, 'stage-complete', { completed: true, reliableWindows: count });
    this.runtime.completeStage(this.stage.id, count);
    this.emitSustainSuccess(count);
    this.time.delayedCall(1_100, () => this.boy.play('boy-idle'));
  }

  private emitSustainSuccess(count = this.powerWindows().filter(({ sum }) => sum >= this.target).length) {
    const quantity = count === 2 ? 'Two' : `${count}`;
    this.runtime.bridge.emit('game:mission-success', {
      stageId: this.stage.id,
      count,
      message: `${quantity} reliable energy ${count === 1 ? 'source' : 'sources'} found. Greenhouse supply stabilized!`,
    });
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
