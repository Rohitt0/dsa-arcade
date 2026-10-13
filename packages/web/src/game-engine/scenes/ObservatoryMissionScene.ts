import Phaser from 'phaser';
import type { GameInput, GameRuntime, StageDefinition } from '../types';
import { binarySearchStage } from '../content/binary-search-game';

const root = '/images/observatory/';
const boyRoot = '/images/greenhouse/';
const readings = [...binarySearchStage.example.readings];
const practice = [...binarySearchStage.practice.readings];

/** Observatory visuals and guided algorithm reference are independent from submitted code execution. */
export class ObservatoryMissionScene extends Phaser.Scene {
  private stage: StageDefinition;
  private unsubscribe?: () => void;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private tiles: Phaser.GameObjects.Image[] = [];
  private values: Phaser.GameObjects.Text[] = [];
  private indices: Phaser.GameObjects.Text[] = [];
  private lens!: Phaser.GameObjects.Image;
  private boy!: Phaser.GameObjects.Sprite;
  private bounds!: Phaser.GameObjects.Graphics;
  private rangeLabel!: Phaser.GameObjects.Text;
  private guide = false;
  private phase = 'welcome';
  private step = 0;
  private left = 0;
  private right = 6;
  private target = 41;
  private midpoint = 3;
  private lensVisible = false;
  private practiceRow = true;
  private restored = false;
  private dialogueIndex = 0;
  private finished = false;

  constructor(private readonly runtime: GameRuntime, initialStage: StageDefinition) {
    super({ key: 'ObservatoryMissionScene' });
    this.stage = initialStage;
  }

  preload() {
    const imgs = [
      ['obs-bg', 'observatory-background-v2-native.png'], ['obs-walkway', 'observatory-walkway-native.png'],
      ['obs-rail', 'frequency-console-rail-middle-native.png'], ['obs-caps', 'frequency-console-caps-native.png'],
      ['obs-cap-l', 'frequency-console-cap-left.png'], ['obs-cap-r', 'frequency-console-cap-right.png'],
      ['obs-tile', 'observatory-data-tile.png'], ['obs-lens', 'observatory-scanning-lens.png'],
      ['obs-left', 'binary-boundary-left.png'], ['obs-right', 'binary-boundary-right.png'], ['obs-telescope', 'observatory-telescope-dormant.png'],
    ];
    imgs.forEach(([key, file]) => this.load.image(key!, `${root}${file}`));
    this.load.spritesheet('obs-boy-idle', `${boyRoot}hooded-boy-idle-4frames.png`, { frameWidth: 96, frameHeight: 112 });
    this.load.spritesheet('obs-boy-walk', `${boyRoot}hooded-boy-walk-8frames.png`, { frameWidth: 96, frameHeight: 112 });
    this.load.spritesheet('obs-boy-scan', `${boyRoot}hooded-boy-scan-6frames.png`, { frameWidth: 96, frameHeight: 112 });
    this.load.spritesheet('obs-boy-celebrate', `${boyRoot}hooded-boy-celebrate-6frames.png`, { frameWidth: 96, frameHeight: 112 });
    this.load.spritesheet('obs-pulse', `${root}golden-pulse-6frames.png`, { frameWidth: 33, frameHeight: 33 });
    this.load.spritesheet('obs-mote', `${root}energy-mote-4frames.png`, { frameWidth: 24, frameHeight: 16 });
  }

  create() {
    this.anims.create({ key: 'obs-idle', frames: this.anims.generateFrameNumbers('obs-boy-idle'), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'obs-walk', frames: this.anims.generateFrameNumbers('obs-boy-walk'), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'obs-scan', frames: this.anims.generateFrameNumbers('obs-boy-scan'), frameRate: 6, repeat: 0 });
    this.anims.create({ key: 'obs-celebrate', frames: this.anims.generateFrameNumbers('obs-boy-celebrate'), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'obs-gold-pulse', frames: this.anims.generateFrameNumbers('obs-pulse'), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'obs-mote-fly', frames: this.anims.generateFrameNumbers('obs-mote'), frameRate: 8, repeat: -1 });
    this.build();
    this.unsubscribe = this.runtime.bridge.on('game:input', this.onInput);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.layout();
    this.restored = Boolean(this.runtime.progress.read(this.stage.id, 'completed'));
    const seen = Boolean(this.runtime.progress.read(this.stage.id, 'onboarding'));
    const returning = seen || this.restored || Boolean(this.runtime.progress.read(this.stage.id, 'draft')) || Boolean(this.runtime.progress.read(this.stage.id, 'attempted'));
    if (!returning) this.startWelcome();
    else this.enterChallenge();
    this.runtime.bridge.emit('game:ready', { gameId: this.runtime.game.id });
  }

  private build() {
    const bg = this.add.image(0, 0, 'obs-bg').setOrigin(0).setDepth(-10); this.objects.push(bg);
    const floor = this.add.image(0, 0, 'obs-walkway').setOrigin(0).setDepth(-3); this.objects.push(floor);
    const rail = this.add.image(0, 0, 'obs-rail').setOrigin(0.5).setDepth(1); this.objects.push(rail);
    const capL = this.add.image(0, 0, 'obs-left').setDepth(4); const capR = this.add.image(0, 0, 'obs-right').setDepth(4); this.objects.push(capL, capR);
    const consoleCaps = this.add.image(0, 0, 'obs-caps').setDepth(2); this.objects.push(consoleCaps);
    this.bounds = this.add.graphics().setDepth(4); this.objects.push(this.bounds);
    this.rangeLabel = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#bfe4ae', fontStyle: 'bold' }).setOrigin(0.5).setDepth(8).setResolution(2); this.objects.push(this.rangeLabel);
    for (let i = 0; i < readings.length; i++) {
      const tile = this.add.image(0, 0, 'obs-tile').setDepth(3);
      const value = this.add.text(0, 0, String(readings[i]), { fontFamily: 'monospace', fontSize: '18px', color: '#f3df9c', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5).setResolution(2);
      const index = this.add.text(0, 0, String(i), { fontFamily: 'monospace', fontSize: '13px', color: '#d4e6df' }).setOrigin(0.5).setDepth(5).setResolution(2);
      this.tiles.push(tile); this.values.push(value); this.indices.push(index); this.objects.push(tile, value, index);
    }
    this.lens = this.add.image(0, 0, 'obs-lens').setDepth(6); this.objects.push(this.lens);
    const telescope = this.add.image(0, 0, 'obs-telescope').setOrigin(0.5, 1).setDepth(2); this.objects.push(telescope);
    this.boy = this.add.sprite(0, 0, 'obs-boy-walk').setOrigin(0.5, 1).setScale(0.64).setDepth(7); this.objects.push(this.boy);
    const target = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffe49a', fontStyle: 'bold' }).setOrigin(0.5).setDepth(8).setResolution(2); this.objects.push(target); this.data.set('targetText', target);
    target.setPadding(8, 5, 8, 5).setBackgroundColor('#152820');
    this.data.set('bg', bg); this.data.set('floor', floor); this.data.set('rail', rail); this.data.set('caps', consoleCaps); this.data.set('capL', capL); this.data.set('capR', capR); this.data.set('telescope', telescope);
  }

  private layout = () => {
    const w = this.scale.width; const h = this.scale.height;
    if (!w || !h) return;
    const fit = (image: Phaser.GameObjects.Image, width: number, height: number) => {
      const source = image.texture.getSourceImage() as HTMLImageElement;
      image.setScale(Math.min(width / source.width, height / source.height));
    };
    const bg = this.data.get('bg') as Phaser.GameObjects.Image;
    const bgSource = bg.texture.getSourceImage() as HTMLImageElement;
    const bgScale = Math.max(w / bgSource.width, h / bgSource.height);
    bg.setOrigin(0.5).setPosition(Math.round(w / 2), Math.round(h / 2)).setScale(bgScale);
    const groundY = Math.round(h * 0.94);
    const floor = this.data.get('floor') as Phaser.GameObjects.Image;
    const floorSource = floor.texture.getSourceImage() as HTMLImageElement;
    floor.setOrigin(0, 1).setScale(w / floorSource.width).setPosition(0, groundY);
    const rowY = Math.round(h * 0.56);
    const centerX = Math.round(w * 0.5);
    const rowWidth = Math.min(w * 0.78, 760);
    const gap = rowWidth / readings.length;
    const rail = this.data.get('rail') as Phaser.GameObjects.Image;
    const railSource = rail.texture.getSourceImage() as HTMLImageElement;
    rail.setPosition(centerX, rowY + 13).setScale((rowWidth + gap * 0.55) / railSource.width);
    const consoleCaps = this.data.get('caps') as Phaser.GameObjects.Image;
    const capsSource = consoleCaps.texture.getSourceImage() as HTMLImageElement;
    consoleCaps.setPosition(centerX, rowY + 13).setScale((rowWidth + gap * 0.55) / capsSource.width);
    const leftCap = this.data.get('capL') as Phaser.GameObjects.Image;
    const rightCap = this.data.get('capR') as Phaser.GameObjects.Image;
    fit(leftCap, Math.max(12, gap * 0.32), 30); fit(rightCap, Math.max(12, gap * 0.32), 30);
    leftCap.setPosition(centerX - rowWidth / 2 - gap * 0.3, rowY + 13);
    rightCap.setPosition(centerX + rowWidth / 2 + gap * 0.3, rowY + 13);
    const activeValues = this.practiceRow ? practice : readings;
    const left = Math.max(0, Math.min(activeValues.length - 1, this.left)); const right = Math.max(-1, Math.min(activeValues.length - 1, this.right));
    const centerIndex = Math.floor(activeValues.length / 2);
    for (let i = 0; i < readings.length; i++) {
      const x = centerX + (i - centerIndex) * gap;
      const visible = i < activeValues.length;
      fit(this.tiles[i]!, Math.min(64, gap * 0.76), 58);
      this.tiles[i]!.setPosition(Math.round(x), rowY);
      this.tiles[i]!.setVisible(visible); this.values[i]!.setVisible(visible); this.indices[i]!.setVisible(visible);
      if (!visible) continue;
      const val = activeValues[i]!;
      this.values[i]!.setText(String(val)).setPosition(Math.round(x), rowY);
      this.indices[i]!.setText(String(i)).setPosition(Math.round(x), rowY + 43);
      const dim = this.guide && (i < left || i > right);
      this.tiles[i]!.setAlpha(dim ? 0.28 : 1); this.values[i]!.setAlpha(dim ? 0.35 : 1); this.indices[i]!.setAlpha(dim ? 0.38 : 1);
    }
    fit(this.lens, Math.min(62, gap * 0.75), 48);
    this.lens.setPosition(Math.round(centerX + (this.midpoint - centerIndex) * gap), rowY - 54).setVisible(this.lensVisible || this.restored);
    this.bounds.clear();
    if (this.guide && this.step >= 1 && left <= right) {
      const startX = centerX + (left - centerIndex) * gap; const endX = centerX + (right - centerIndex) * gap;
      this.bounds.lineStyle(3, 0x9bd69b, 0.95).strokeLineShape(new Phaser.Geom.Line(startX, rowY + 38, endX, rowY + 38));
      leftCap.setPosition(Math.round(startX - gap * 0.42), rowY + 13).setVisible(true);
      rightCap.setPosition(Math.round(endX + gap * 0.42), rowY + 13).setVisible(true);
    } else {
      leftCap.setVisible(false);
      rightCap.setVisible(false);
    }
    this.rangeLabel.setPosition(centerX, rowY + 65).setVisible(this.guide && this.step >= 1);
    this.rangeLabel.setColor(left > right ? '#f2a890' : this.step === 5 ? '#ffe49a' : '#bfe4ae');
    this.rangeLabel.setText(left > right ? 'RULED OUT · NO CANDIDATES' : this.step === 5 ? `FOUND · INDEX ${this.midpoint}` : `STILL POSSIBLE · LEFT ${left} · RIGHT ${right}`);
    const t = this.data.get('targetText') as Phaser.GameObjects.Text;
    t.setText(`TARGET FREQUENCY  ${this.target}`).setPosition(centerX, rowY - 89);
    const telescope = this.data.get('telescope') as Phaser.GameObjects.Image;
    const telescopeSource = telescope.texture.getSourceImage() as HTMLImageElement;
    const telescopeScale = Math.min(1.2, 128 / Math.max(telescopeSource.width, telescopeSource.height));
    telescope.setScale(telescopeScale).setPosition(Math.round(w * 0.88), groundY + Math.round(8 * telescopeScale));
    const boyScale = Math.min(1.28, Math.max(0.88, (h * 0.18) / 112));
    this.boy.setScale(boyScale).setPosition(Math.round(w * 0.13), Math.round(groundY + 9 * boyScale));
  };

  private publish(title: string, message: string, step: string, choices?: { id: string; label: string }[]) {
    this.runtime.bridge.emit('game:binary-tutorial', { active: true, title, message, step, choices });
  }
  private startWelcome() {
    this.guide = false; this.phase = 'welcome'; this.dialogueIndex = 0;
    this.runtime.progress.checkpoint(this.stage.id, 'onboarding', { seen: true });
    this.boy.setX(-35).play('obs-walk');
    this.tweens.add({ targets: this.boy, x: this.scale.width * 0.11, duration: 900, ease: 'Cubic.Out', onComplete: () => this.boy.play('obs-idle') });
    this.publish('Welcome to the Observatory', 'We’ve reached the observatory. Somewhere out there, a signal is waiting.', 'welcome', [{ id: 'welcome-next', label: 'Continue' }, { id: 'skip-intro', label: 'Skip intro' }]);
  }
  private enterTutorial() {
    this.time.removeAllEvents(); this.tiles.forEach((tile) => tile.clearTint());
    this.guide = true; this.practiceRow = true; this.target = 41; this.left = 0; this.right = 6; this.midpoint = 3; this.lensVisible = false; this.step = -1; this.phase = 'tutorial'; this.layout();
    this.publish('Practice example', 'An index is a tile’s position. Counting starts at 0. The answer is the target’s position, not its value.', 'explain-index', [{ id: 'tutorial-next', label: 'Continue' }]);
  }
  private showStep() {
    const messages = [
      ['Sorted order', 'Every value to the right is larger. We can use that to rule out whole sections.'],
      ['Search boundaries', 'These markers show where the target could still be.'],
      ['Inspect the middle', `mid = left + (right - left) / 2 = ${this.midpoint}. The middle reading is ${practice[this.midpoint]}.`],
      ['Choose a half', `Which side could contain ${this.target}?`],
      ['Keep the right half', 'We can discard 22 and everything before it. Only three candidates remain. Left becomes mid + 1 because 22 was already checked and is too small.'],
      ['Check again', `The new middle is index ${this.midpoint}, with reading ${practice[this.midpoint]}. Found it! The signal is at index 5.`],
      ['Missing targets', 'If the markers cross, there are no candidates left. Return -1.'],
      ['Try a missing signal', 'Target 16: the middle is index 3, reading 22. Since 22 is larger, right becomes 2.'],
      ['Missing signal', 'Now check index 1: reading 9 is smaller than 16, so left becomes 2.'],
      ['Missing signal', 'Check index 2: reading 15 is smaller than 16, so left becomes 3.'],
      ['No candidates remain', 'Now left = 3 and right = 2. The interval is empty, so return -1 without scanning another tile.'],
      ['Binary search', 'Check the middle. Keep the half that could contain the target. Repeat until you find it or run out of candidates.'],
    ];
    const [title, message] = messages[this.step]!;
    const choices = this.step === 3 ? [{ id: 'keep-left', label: 'Keep left half' }, { id: 'keep-right', label: 'Keep right half' }] : [{ id: this.step === 2 ? 'check-middle' : this.step === 4 ? 'check-again' : this.step === 11 ? 'start-coding' : 'tutorial-next', label: this.step === 2 ? 'Check middle' : this.step === 4 ? 'Check again' : this.step === 11 ? 'Start coding' : this.step === 6 ? 'Try it' : 'Continue' }];
    this.publish(title!, message!, `step-${this.step}`, choices);
  }
  private advanceTutorial() {
    if (this.phase === 'welcome') {
      const lines = ['These readings are arranged from smallest to largest.', 'That order lets us search much faster. Let me show you.'];
      if (this.dialogueIndex < lines.length) { this.publish('Welcome to the Observatory', lines[this.dialogueIndex++]!, 'welcome', [{ id: 'welcome-next', label: 'Continue' }, { id: 'skip-intro', label: 'Skip intro' }]); return; }
      this.enterTutorial(); return;
    }
    if (this.phase === 'tutorial') {
      if (this.step === -1) { this.step = 0; this.showStep(); return; }
      const oldLensX = this.lens.x;
      const oldLeftX = (this.data.get('capL') as Phaser.GameObjects.Image).x;
      const oldRightX = (this.data.get('capR') as Phaser.GameObjects.Image).x;
      if (this.step === 0) this.highlightSortedRow();
      if (this.step === 2) { this.midpoint = this.left + Math.floor((this.right - this.left) / 2); this.lensVisible = true; this.boy.play('obs-scan'); }
      if (this.step === 4) this.boy.play('obs-scan');
      if (this.step === 5) { this.target = 16; this.left = 0; this.right = 6; this.midpoint = 3; }
      if (this.step === 7) { this.right = 2; this.midpoint = 1; }
      if (this.step === 8) { this.left = 2; this.right = 2; this.midpoint = 2; }
      if (this.step === 9) { this.left = 3; this.right = 2; }
      this.step++;
      this.layout();
      this.animateGuides(oldLensX, oldLeftX, oldRightX);
      this.showStep();
    }
  }
  private animateGuides(oldLensX: number, oldLeftX: number, oldRightX: number) {
    const nextLensX = this.lens.x;
    if (this.lens.visible && oldLensX !== nextLensX) {
      this.lens.setX(oldLensX);
      this.tweens.add({ targets: this.lens, x: nextLensX, duration: 420, ease: 'Cubic.Out' });
    }
    if (this.left <= this.right) {
      const left = this.data.get('capL') as Phaser.GameObjects.Image;
      const right = this.data.get('capR') as Phaser.GameObjects.Image;
      const nextLeftX = left.x; const nextRightX = right.x;
      if (oldLeftX !== nextLeftX) { left.setX(oldLeftX); this.tweens.add({ targets: left, x: nextLeftX, duration: 420, ease: 'Cubic.Out' }); }
      if (oldRightX !== nextRightX) { right.setX(oldRightX); this.tweens.add({ targets: right, x: nextRightX, duration: 420, ease: 'Cubic.Out' }); }
    }
  }
  private highlightSortedRow() {
    this.tiles.slice(0, practice.length).forEach((tile, index) => {
      this.time.delayedCall(index * 100, () => {
        tile.setTint(0xe6efbd);
        this.time.delayedCall(220, () => tile.clearTint());
      });
    });
  }
  private enterChallenge() {
    this.time.removeAllEvents(); this.tiles.forEach((tile) => tile.clearTint());
    this.guide = false; this.practiceRow = false; this.target = binarySearchStage.example.target; this.left = 0; this.right = readings.length - 1; this.midpoint = Math.floor(readings.length / 2); this.lensVisible = this.restored; this.phase = 'challenge'; this.layout();
    this.runtime.bridge.emit('game:binary-tutorial', { active: false, title: '', message: '', step: '' });
    this.boy.play('obs-idle');
  }
  private onInput = (input: GameInput) => { if (input.source === 'control') this.action(input.action); };
  private action(action: string) {
    if (action === 'tutorial:replay') { this.phase = 'welcome'; this.dialogueIndex = 3; this.enterTutorial(); return; }
    if (action === 'tutorial:skip-intro') { this.runtime.progress.checkpoint(this.stage.id, 'onboarding', { seen: true, skipped: true }); this.enterTutorial(); return; }
    if (action === 'tutorial:welcome-next') { this.advanceTutorial(); return; }
    if (action === 'tutorial:tutorial-next') { this.advanceTutorial(); return; }
    if (action === 'tutorial:check-middle' || action === 'tutorial:check-again') { this.advanceTutorial(); return; }
    if (action === 'tutorial:keep-left') { this.publish('Try again', '41 is larger than 22, so the left side cannot contain it. Keep the right half.', 'step-3', [{ id: 'keep-left', label: 'Keep left half' }, { id: 'keep-right', label: 'Keep right half' }]); return; }
    if (action === 'tutorial:keep-right') {
      const oldLensX = this.lens.x;
      const oldLeftX = (this.data.get('capL') as Phaser.GameObjects.Image).x;
      const oldRightX = (this.data.get('capR') as Phaser.GameObjects.Image).x;
      this.left = this.midpoint + 1; this.midpoint = this.left + Math.floor((this.right - this.left) / 2); this.step = 4; this.layout();
      this.animateGuides(oldLensX, oldLeftX, oldRightX); this.showStep(); return;
    }
    if (action === 'tutorial:start-coding') { this.runtime.progress.checkpoint(this.stage.id, 'onboarding', { seen: true }); this.practiceRow = false; this.guide = false; this.layout(); this.enterChallenge(); return; }
    if (action === 'mission:restore' && !this.finished) { this.success(); return; }
    if (action === 'mission:restore-state' && !this.finished) {
      this.restored = true;
      this.runtime.progress.checkpoint(this.stage.id, 'completed', { completed: true });
      this.enterChallenge();
      return;
    }
    if (action === 'mission:preview-missing') {
      this.guide = false; this.practiceRow = false; this.target = binarySearchStage.visibleExamples[1]!.target;
      this.left = 0; this.right = readings.length - 1; this.midpoint = -1;
      while (this.left <= this.right) {
        this.midpoint = this.left + Math.floor((this.right - this.left) / 2);
        if (readings[this.midpoint] === this.target) break;
        if (readings[this.midpoint]! < this.target) this.left = this.midpoint + 1;
        else this.right = this.midpoint - 1;
      }
      this.lensVisible = false; this.lens.setVisible(false); this.layout();
      this.runtime.bridge.emit('game:binary-tutorial', { active: false, title: 'Search complete', message: 'Search complete — this signal is not present.', step: 'absent-preview', found: false });
      return;
    }
    if (action === 'mission:replay') { this.finished = false; this.enterChallenge(); return; }
  }
  private success() {
    if (this.finished) return; this.finished = true; this.restored = true; this.runtime.progress.checkpoint(this.stage.id, 'completed', { completed: true });
    let left = 0; let right = readings.length - 1; let found = -1;
    while (left <= right) { const mid = left + Math.floor((right - left) / 2); if (readings[mid] === binarySearchStage.example.target) { found = mid; break; } if (readings[mid]! < binarySearchStage.example.target) left = mid + 1; else right = mid - 1; }
    this.midpoint = found; this.lensVisible = found >= 0; this.layout();
    if (found >= 0) { this.add.sprite(this.lens.x, this.lens.y, 'obs-pulse').play('obs-gold-pulse'); const mote = this.add.sprite(this.scale.width * 0.6, this.scale.height * 0.76, 'obs-mote').play('obs-mote-fly'); this.tweens.add({ targets: mote, x: this.scale.width * 0.89, y: this.scale.height * 0.59, duration: 900, onComplete: () => mote.destroy() }); }
    this.boy.play('obs-celebrate'); this.boy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.boy.play('obs-idle'));
    this.runtime.bridge.emit('game:binary-tutorial', { active: false, title: 'Signal located at index 5!', message: 'Signal located at index 5!', step: 'success', found: true });
  }
  private shutdown() { this.unsubscribe?.(); this.unsubscribe = undefined; this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this); this.tweens.killAll(); this.objects = []; this.tiles = []; this.values = []; this.indices = []; }
}
