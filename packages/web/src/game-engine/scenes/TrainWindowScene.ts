import Phaser from 'phaser';
import { InputManager } from '../InputManager';
import type { GameControl, GameInput, GameRuntime, StageDefinition } from '../types';

type Lesson =
  'find-window' | 'move-window' | 'track-value' | 'variable-window' | 'hidden-pattern' | 'boss';
interface SceneData {
  stage?: StageDefinition;
}

const actions: Record<Lesson, GameControl[]> = {
  'find-window': [
    { id: 'narrow', label: '− Narrow' },
    { id: 'widen', label: '+ Widen' },
    { id: 'confirm', label: 'That’s 3 cars' },
  ],
  'move-window': [
    { id: 'previous', label: '← Previous' },
    { id: 'next', label: 'Next →' },
  ],
  'track-value': [
    { id: 'previous', label: '← Previous' },
    { id: 'next', label: 'Next →' },
  ],
  'variable-window': [
    { id: 'expand', label: 'Expand right +' },
    { id: 'shrink', label: 'Shrink left −' },
    { id: 'finish', label: 'Check my answer' },
  ],
  'hidden-pattern': [
    { id: 'choose-window', label: 'Track a consecutive group' },
    { id: 'choose-pointers', label: 'Compare both ends' },
    { id: 'choose-map', label: 'Remember seen values' },
  ],
  boss: [
    { id: 'expand', label: 'Explore next car →' },
    { id: 'finish', label: 'Finish crossing' },
  ],
};

/** One responsive, data-configured Phaser scene for all six Train Window stages. */
export class TrainWindowScene extends Phaser.Scene {
  private stage: StageDefinition;
  private lesson: Lesson = 'find-window';
  private values: number[] = [];
  private left = 0;
  private right = 0;
  private windowSize = 1;
  private windowSum = 0;
  private bestValue = Number.NEGATIVE_INFINITY;
  private bestLength = Number.POSITIVE_INFINITY;
  private lastTransition = 'Choose an action below to begin.';
  private finished = false;
  private graphics?: Phaser.GameObjects.Graphics;
  private title?: Phaser.GameObjects.Text;
  private prompt?: Phaser.GameObjects.Text;
  private detail?: Phaser.GameObjects.Text;
  private summary?: Phaser.GameObjects.Text;
  private valueLabels: Phaser.GameObjects.Text[] = [];
  private unsubscribeInput?: () => void;
  private inputManager?: InputManager;

  constructor(
    private readonly runtime: GameRuntime,
    initialStage: StageDefinition,
  ) {
    super({ key: 'TrainWindowScene' });
    this.stage = initialStage;
  }

  init(data?: SceneData) {
    if (data?.stage) this.stage = data.stage;
    this.lesson = String(this.stage.config.lesson) as Lesson;
    const values = this.stage.config.values;
    this.values =
      Array.isArray(values) && values.every((value) => typeof value === 'number')
        ? values
        : [4, 2, 7, 1, 5, 3, 6];
    this.left = 0;
    this.right = this.lesson === 'variable-window' || this.lesson === 'boss' ? -1 : 0;
    this.windowSize = 1;
    this.windowSum =
      this.lesson === 'track-value' || this.lesson === 'move-window'
        ? this.values.slice(0, 3).reduce((sum, value) => sum + value, 0)
        : 0;
    this.bestValue = this.lesson === 'track-value' ? this.windowSum : Number.NEGATIVE_INFINITY;
    this.bestLength = this.lesson === 'boss' ? 0 : Number.POSITIVE_INFINITY;
    this.lastTransition = 'Choose an action below to begin.';
    this.finished = false;
  }

  create() {
    this.cameras.main.setBackgroundColor('#182348');
    this.graphics = this.add.graphics();
    this.title = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffcf4e',
        align: 'center',
      })
      .setOrigin(0.5);
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f4e9d0',
        align: 'center',
        wordWrap: { width: Math.max(160, this.scale.width - 36) },
      })
      .setOrigin(0.5);
    this.detail = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#a9c9f4',
        align: 'center',
        wordWrap: { width: Math.max(160, this.scale.width - 36) },
      })
      .setOrigin(0.5);
    this.summary = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffcf4e',
        align: 'center',
      })
      .setOrigin(0.5);
    this.valueLabels = this.values.map((value) =>
      this.add
        .text(0, 0, String(value), {
          fontFamily: 'monospace',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#f4e9d0',
          align: 'center',
        })
        .setOrigin(0.5),
    );

    this.inputManager = new InputManager(this, this.runtime.bridge);
    this.unsubscribeInput = this.runtime.bridge.on('game:input', this.handleInput);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.unsubscribeInput?.();
      this.inputManager?.destroy();
      this.valueLabels.forEach((label) => label.destroy());
    });

    this.runtime.bridge.emit('game:controls', {
      stageId: this.stage.id,
      controls: actions[this.lesson],
    });
    this.layout();
    this.renderBoard();
    this.runtime.bridge.emit('game:ready', { gameId: this.runtime.game.id });
    this.runtime.bridge.emit('game:lesson', { message: this.stage.title });
  }

  private handleInput = (input: GameInput) => {
    if (this.finished) return;
    if (input.source === 'pointer' || (input.source === 'keyboard' && input.key === 'Space')) {
      this.advance();
      return;
    }
    if (input.source !== 'control' && input.source !== 'keyboard') return;
    const action = input.source === 'control' ? input.action : 'advance';
    if (action === 'advance') {
      this.advance();
      return;
    }

    switch (this.lesson) {
      case 'find-window':
        this.handleFindWindow(action);
        break;
      case 'move-window':
        this.handleFixedMove(action, false);
        break;
      case 'track-value':
        this.handleFixedMove(action, true);
        break;
      case 'variable-window':
        this.handleVariable(action);
        break;
      case 'hidden-pattern':
        this.handleChoice(action);
        break;
      case 'boss':
        this.handleBoss(action);
        break;
    }
    this.renderBoard();
  };

  private advance() {
    const defaultAction: Record<Lesson, string> = {
      'find-window': 'widen',
      'move-window': 'next',
      'track-value': 'next',
      'variable-window': 'expand',
      'hidden-pattern': 'choose-window',
      boss: 'expand',
    };
    this.handleInput({ source: 'control', action: defaultAction[this.lesson] });
  }

  private handleFindWindow(action: string) {
    if (action === 'widen') this.windowSize = Math.min(this.values.length, this.windowSize + 1);
    if (action === 'narrow') this.windowSize = Math.max(1, this.windowSize - 1);
    if (action === 'confirm') {
      if (this.windowSize === 3) this.complete('You found it: a window is 3 neighboring cars.');
      else
        this.say(
          `This window covers ${this.windowSize} car${this.windowSize === 1 ? '' : 's'}. Try a width of 3.`,
        );
    }
    if (action === 'widen' || action === 'narrow') {
      this.say(
        `${this.windowSize} neighboring car${this.windowSize === 1 ? '' : 's'} are inside the window.`,
      );
    }
  }

  private handleFixedMove(action: string, track: boolean) {
    if (action !== 'next' && action !== 'previous') return;
    const nextLeft = Phaser.Math.Clamp(
      this.left + (action === 'next' ? 1 : -1),
      0,
      this.values.length - 3,
    );
    if (nextLeft === this.left) {
      this.say(
        action === 'next'
          ? 'The window is at the end of the train.'
          : 'The window is already at the start.',
      );
      return;
    }
    const movingRight = nextLeft > this.left;
    const outgoing = this.values[movingRight ? this.left : this.left + 2]!;
    const incoming = this.values[movingRight ? nextLeft + 2 : nextLeft]!;
    this.left = nextLeft;
    this.right = this.left + 2;
    const currentSum = this.values
      .slice(this.left, this.right + 1)
      .reduce((sum, value) => sum + value, 0);
    this.windowSum = currentSum;
    if (track) {
      this.bestValue = Math.max(this.bestValue, currentSum);
      const previousSum = currentSum - incoming + outgoing;
      this.say(`Update the total: ${previousSum} − ${outgoing} + ${incoming} = ${currentSum}.`);
      if (this.left === 1)
        this.runtime.progress.checkpoint(this.stage.id, 'first-window-shift', {
          left: this.left,
          sum: currentSum,
        });
    } else {
      this.say(`${outgoing} leaves the window; ${incoming} enters. Only one car changed.`);
    }
    if (this.left === this.values.length - 3) {
      const score = track ? this.bestValue : this.left;
      this.complete(
        track
          ? `Best 3-car total: ${this.bestValue}. Reuse the old total and update only the two edges.`
          : 'You moved the window across the train. One car leaves as one enters.',
        score,
      );
    }
  }

  private handleVariable(action: string) {
    if (action === 'expand') {
      if (this.right + 1 >= this.values.length) {
        this.say('The window has reached the last car. Check your result.');
        return;
      }
      this.right += 1;
      this.windowSum += this.values[this.right]!;
      if (this.windowSum >= this.target)
        this.bestLength = Math.min(this.bestLength, this.right - this.left + 1);
      this.say(`Added ${this.values[this.right]}. Current total: ${this.windowSum}.`);
    } else if (action === 'shrink') {
      if (this.left > this.right) {
        this.say('The window is empty. Expand it to include a car first.');
        return;
      }
      const leaving = this.values[this.left]!;
      this.windowSum -= leaving;
      this.left += 1;
      if (this.windowSum >= this.target)
        this.bestLength = Math.min(this.bestLength, this.right - this.left + 1);
      this.say(`${leaving} leaves from the left. Current total: ${this.windowSum}.`);
    } else if (action === 'finish') {
      if (this.bestLength === 3)
        this.complete(
          'Shortest qualifying stretch: 3 cars. Expand to reach the target, then shrink to improve it.',
        );
      else
        this.say(
          'Keep exploring. A valid stretch totals at least 10; shrink it while it stays valid.',
        );
    }
  }

  private handleChoice(action: string) {
    if (action === 'choose-window')
      this.complete(
        'Correct. Neighboring values form a continuous segment, so a moving window fits.',
      );
    else if (action === 'choose-pointers' || action === 'choose-map') {
      this.say(
        'That tool can help in other problems. Here, the key clue is a continuous run of neighbors.',
      );
    }
  }

  private handleBoss(action: string) {
    if (action === 'expand') {
      if (this.right + 1 >= this.values.length) {
        this.say('You reached the end. Check the longest safe stretch.');
        return;
      }
      this.right += 1;
      this.windowSum += this.values[this.right]!;
      let removed = 0;
      while (this.windowSum > this.limit && this.left <= this.right) {
        this.windowSum -= this.values[this.left]!;
        this.left += 1;
        removed += 1;
      }
      this.bestLength = Math.max(this.bestLength, this.right - this.left + 1);
      this.say(
        removed
          ? `Total passed 12, so move the left edge ${removed} car${removed === 1 ? '' : 's'} to restore the rule. Current total: ${this.windowSum}.`
          : `Added ${this.values[this.right]}. Current safe total: ${this.windowSum}.`,
      );
    } else if (action === 'finish') {
      if (this.right === this.values.length - 1 && this.bestLength >= 3) {
        this.complete(`Crossing complete. Your longest safe stretch was ${this.bestLength} cars.`);
      } else this.say('Explore through the last car. Keep each window total at 12 or below.');
    }
  }

  private get target() {
    return Number(this.stage.config.target) || 10;
  }
  private get limit() {
    return Number(this.stage.config.limit) || 12;
  }

  private say(message: string) {
    this.lastTransition = message;
    this.detail?.setText(message);
    this.runtime.bridge.emit('game:lesson', { message });
  }

  private complete(message: string, score = 1) {
    if (this.finished) return;
    this.finished = true;
    this.say(message);
    this.runtime.progress.checkpoint(this.stage.id, 'stage-complete', {
      score,
      lesson: this.lesson,
    });
    this.runtime.completeStage(this.stage.id, score);
  }

  private layout = () => {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    this.title
      ?.setPosition(centerX, Math.max(26, height * 0.11))
      .setFontSize(width < 480 ? '15px' : '20px')
      .setText(this.stage.title.toUpperCase());
    this.prompt
      ?.setPosition(centerX, height * 0.27)
      .setWordWrapWidth(Math.max(180, width - 36))
      .setFontSize(width < 480 ? '12px' : '14px')
      .setText(String(this.stage.config.prompt ?? ''));
    this.detail
      ?.setPosition(centerX, height * 0.41)
      .setWordWrapWidth(Math.max(180, width - 36))
      .setFontSize(width < 480 ? '11px' : '13px')
      .setText(this.lastTransition);
    this.summary
      ?.setPosition(centerX, height * 0.82)
      .setFontSize(width < 480 ? '12px' : '14px')
      .setText(this.getSummary());
    this.renderBoard();
  };

  private renderBoard() {
    if (!this.graphics || this.valueLabels.length === 0) return;
    const width = this.scale.width;
    const height = this.scale.height;
    const gap = width < 480 ? 4 : 8;
    const cellWidth = Math.min(
      74,
      (width - 36 - gap * (this.values.length - 1)) / this.values.length,
    );
    const cellHeight = Math.min(62, Math.max(42, height * 0.17));
    const totalWidth = cellWidth * this.values.length + gap * (this.values.length - 1);
    const x0 = (width - totalWidth) / 2;
    const y = height * 0.57;
    const windowStart = this.left;
    const windowEnd = this.lesson === 'find-window' ? this.left + this.windowSize - 1 : this.right;

    this.graphics.clear();
    this.graphics
      .fillStyle(0x10162f, 0.96)
      .fillRoundedRect(x0 - 10, y - 13, totalWidth + 20, cellHeight + 46, 10);
    for (let i = 0; i < this.values.length; i += 1) {
      const x = x0 + i * (cellWidth + gap);
      const inside = i >= windowStart && i <= windowEnd;
      this.graphics
        .fillStyle(inside ? 0x8e5ac7 : 0x29365f, 1)
        .fillRoundedRect(x, y, cellWidth, cellHeight, 7);
      this.graphics
        .lineStyle(inside ? 3 : 2, inside ? 0xffcf4e : 0x53668f, 1)
        .strokeRoundedRect(x, y, cellWidth, cellHeight, 7);
      this.valueLabels[i]
        ?.setPosition(x + cellWidth / 2, y + cellHeight / 2)
        .setFontSize(width < 480 ? '15px' : '18px');
      this.valueLabels[i]?.setColor(inside ? '#fff2bb' : '#c5d2ec');
    }
    this.graphics
      .fillStyle(0x10162f, 1)
      .fillRoundedRect(
        width / 2 - Math.min(totalWidth / 2, 130),
        y + cellHeight + 9,
        Math.min(totalWidth, 260),
        28,
        6,
      );
    this.summary?.setText(this.getSummary());
  }

  private getSummary() {
    if (this.lesson === 'find-window') return `Window width: ${this.windowSize}`;
    if (this.lesson === 'move-window')
      return `Cars in window: ${this.left + 1}–${this.left + 3} of ${this.values.length}`;
    if (this.lesson === 'track-value')
      return `Current sum: ${this.windowSum}   ·   Best: ${Number.isFinite(this.bestValue) ? this.bestValue : '—'}`;
    if (this.lesson === 'variable-window')
      return `Target ≥ ${this.target}   ·   Shortest: ${Number.isFinite(this.bestLength) ? `${this.bestLength} cars` : 'not found yet'}`;
    if (this.lesson === 'boss')
      return `Limit ≤ ${this.limit}   ·   Longest safe stretch: ${Number.isFinite(this.bestLength) ? this.bestLength : 0}`;
    return 'Choose the mechanic that fits the clue';
  }
}
