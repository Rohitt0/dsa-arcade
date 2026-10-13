import { tutorialOrders, tutorialSteps, type TutorialState, type TutorialStep } from './content/greenhouse-tutorial';

interface TutorialHooks {
  publish(state: TutorialState): void;
  enter(step: TutorialStep, done: () => void): () => void;
  finish(skipped: boolean, replay: boolean): void;
}

/** Only this controller advances onboarding. Effects return a scoped cancellation function. */
export class GreenhouseTutorialController {
  state: TutorialState = { active: false, step: 'arrival', busy: false, replay: false };
  private cancelEffect = () => {};
  private generation = 0;
  private order: TutorialStep[] = tutorialOrders['greenhouse-maximum-crystal-energy']!;

  constructor(private readonly hooks: TutorialHooks) {}

  start(replay = false, stageId = 'greenhouse-maximum-crystal-energy') {
    this.dispose();
    this.order = tutorialOrders[stageId] ?? tutorialOrders['greenhouse-maximum-crystal-energy']!;
    const first = this.order[0]!;
    this.state = { active: true, step: first, busy: false, replay };
    this.go(first);
  }

  advance(expectedStep: string) {
    if (!this.state.active || this.state.busy || this.state.step !== expectedStep) return;
    const next = this.order[this.order.indexOf(this.state.step) + 1];
    if (next) this.go(next);
    else this.finish(false);
  }

  skip() { if (this.state.active) this.finish(true); }

  private go(step: TutorialStep) {
    this.cancelEffect();
    const generation = ++this.generation;
    const spec = tutorialSteps[step];
    this.state = { ...this.state, step, busy: 'animated' in spec && spec.animated };
    this.hooks.publish({ ...this.state });
    this.cancelEffect = this.hooks.enter(step, () => {
      if (!this.state.active || this.generation !== generation) return;
      this.state = { ...this.state, busy: false };
      this.hooks.publish({ ...this.state });
    });
  }

  private finish(skipped: boolean) {
    const replay = this.state.replay;
    this.dispose();
    this.hooks.finish(skipped, replay);
    this.hooks.publish({ ...this.state });
  }

  dispose() {
    ++this.generation;
    this.cancelEffect();
    this.cancelEffect = () => {};
    this.state = { ...this.state, active: false, busy: false };
  }
}
