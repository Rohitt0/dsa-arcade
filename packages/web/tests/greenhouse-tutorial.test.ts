import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GreenhouseTutorialController } from '../src/game-engine/GreenhouseTutorialController';
import { tutorialCrystals, tutorialSteps, type TutorialStep } from '../src/game-engine/content/greenhouse-tutorial';
import { ProgressManager } from '../src/game-engine/ProgressManager';

function harness() {
  let done = () => {};
  let cancellations = 0;
  const entered: TutorialStep[] = [];
  const finishes: Array<{ skipped: boolean; replay: boolean }> = [];
  const controller = new GreenhouseTutorialController({
    publish: () => {},
    enter: (step, complete) => { entered.push(step); done = complete; return () => { cancellations++; }; },
    finish: (skipped, replay) => { finishes.push({ skipped, replay }); },
  });
  return { controller, entered, finishes, complete: () => done(), callback: () => done, cancellations: () => cancellations };
}

test('new player must explicitly scan and slide; arithmetic is 13 then 10', () => {
  const h = harness();
  h.controller.start();
  for (const step of ['arrival', 'introduction', 'discover', 'collector'] as const) {
    assert.equal(h.controller.state.step, step);
    h.complete();
    h.controller.advance(step);
  }
  assert.equal(h.controller.state.step, 'scan');
  h.complete();
  assert.equal(h.controller.state.step, 'scan', 'effect completion must never advance readable dialogue');
  h.controller.advance('scan');
  h.complete();
  assert.equal(h.controller.state.step, 'scanned');
  const first = tutorialCrystals.slice(0, 3).reduce((sum, value) => sum + value, 0);
  assert.equal(first, 13);
  assert.equal(tutorialSteps.scanned.calculation, '4 + 2 + 7 = 13');
  h.controller.advance('scanned');
  h.complete();
  assert.equal(h.controller.state.step, 'remove');
  h.controller.advance('remove');
  assert.equal(first - tutorialCrystals[0] + tutorialCrystals[3], 10);
  assert.equal(tutorialSteps.add.calculation, '13 − 4 + 1 = 10');
  h.controller.advance('add');
  assert.equal(h.finishes.length, 0);
  h.controller.advance('stage');
  assert.deepEqual(h.finishes, [{ skipped: false, replay: false }]);
});

test('rapid duplicate clicks and stale actions cannot skip steps or duplicate effects', () => {
  const h = harness();
  h.controller.start();
  h.controller.advance('arrival');
  assert.equal(h.entered.length, 1);
  h.complete();
  h.controller.advance('arrival');
  for (let i = 0; i < 10; i++) h.controller.advance('arrival');
  assert.deepEqual(h.entered, ['arrival', 'introduction']);
});

test('skip at every step cancels effects and rejects late animation callbacks', () => {
  for (const target of Object.keys(tutorialSteps) as TutorialStep[]) {
    const h = harness();
    h.controller.start();
    while (h.controller.state.step !== target) {
      h.complete();
      h.controller.advance(h.controller.state.step);
    }
    const late = h.callback();
    const previous = h.cancellations();
    h.controller.skip();
    late();
    h.controller.skip();
    assert.equal(h.controller.state.active, false);
    assert.equal(h.cancellations(), previous + 1);
    assert.deepEqual(h.finishes, [{ skipped: true, replay: false }]);
  }
});

test('dispose and restart invalidate callbacks from the previous scene/session', () => {
  const h = harness();
  h.controller.start();
  const previous = h.callback();
  h.controller.dispose();
  assert.equal(h.finishes.length, 0, 'leaving a scene is not completing onboarding');
  h.controller.start(true);
  previous();
  assert.equal(h.controller.state.busy, true);
  assert.equal(h.controller.state.replay, true);
  h.complete();
  assert.equal(h.controller.state.busy, false);
});

test('progress survives new manager instances and isolates users and checkpoints', () => {
  const values = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  try {
    const saved = new ProgressManager('greenhouse-test', undefined, 'player-a');
    saved.checkpoint('stage1', 'draft', { code: '' });
    saved.checkpoint('stage1', 'greenhouse-restored', { completed: true });
    saved.checkpoint('stage1', 'onboarding', { seen: true, skipped: true });
    const resumed = new ProgressManager('greenhouse-test', undefined, 'player-a');
    assert.deepEqual(resumed.read('stage1', 'draft'), { code: '' });
    assert.deepEqual(resumed.read('stage1', 'greenhouse-restored'), { completed: true });
    assert.deepEqual(resumed.read('stage1', 'onboarding'), { seen: true, skipped: true });
    assert.equal(new ProgressManager('greenhouse-test', undefined, 'player-b').read('stage1', 'draft'), undefined);
    const before = [...values];
    const h = harness();
    h.controller.start(true);
    h.controller.skip();
    assert.deepEqual(h.finishes, [{ skipped: true, replay: true }]);
    assert.deepEqual([...values], before, 'replay itself must never mutate persisted missions');
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('corrupt or unavailable storage does not block gameplay', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => '{invalid', setItem: () => { throw new Error('quota'); },
  } });
  try {
    const progress = new ProgressManager('storage-fallback-test');
    assert.equal(progress.read('stage1', 'onboarding'), undefined);
    progress.checkpoint('stage1', 'onboarding', { seen: true });
    assert.deepEqual(progress.read('stage1', 'onboarding'), { seen: true });
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
