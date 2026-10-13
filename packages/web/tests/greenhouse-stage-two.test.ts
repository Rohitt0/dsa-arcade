import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findLongestBudgetWindow, greenhouseCrystals, greenhouseGame, greenhouseReliableTarget, greenhouseStageIds, stageBudget, stageCrystals } from '../src/game-engine/content/greenhouse';
import { countQualifyingFixedWindows, getFixedWindowSums } from '../src/game-engine/content/fixed-windows';
import { findMinimumWindow } from '../src/game-engine/content/variable-windows';
import { LevelManager } from '../src/game-engine/LevelManager';
import { ProgressManager } from '../src/game-engine/ProgressManager';
import { getGreenhouseStageStatus, stageHref } from '../src/game-engine/content/greenhouse-progress';

test('Stage 2 example reports all six sums and counts the two reliable windows', () => {
  const stage = greenhouseGame.stages[1]!;
  const values = stageCrystals(stage);
  assert.deepEqual(getFixedWindowSums(values, Number(stage.config.windowSize)).map(({ sum }) => sum), [8, 10, 8, 13, 11, 15]);
  assert.equal(countQualifyingFixedWindows(values, 3, greenhouseReliableTarget), 2);
});

test('four stage-owned examples are distinct and produce their documented answers', () => {
  const [one, two, three, four] = greenhouseGame.stages;
  const values = greenhouseGame.stages.map(stageCrystals);
  assert.deepEqual(values, [[4,2,7,1,6,3,8,5], [2,5,1,4,3,6,2,7], [2,3,1,2,4,3,2,1], [3,1,2,1,4,2,1,5]]);
  assert.equal(Math.max(...getFixedWindowSums(values[0]!, 3).map(({sum})=>sum)), 17);
  assert.equal(countQualifyingFixedWindows(values[1]!, 3, 12), 2);
  assert.equal(findMinimumWindow(values[2]!, 7)?.length, 2);
  assert.equal(findLongestBudgetWindow(values[3]!, 7).length, 4);
  assert.deepEqual(values[3]!.slice(findLongestBudgetWindow(values[3]!, 7).start, findLongestBudgetWindow(values[3]!, 7).end + 1), [3,1,2,1]);
  assert.equal(new Set(values.map((row) => row.join(','))).size, 4);
  assert.deepEqual([one?.config.windowSize, two?.config.target, three?.config.target, stageBudget(four!)], [3,12,7,7]);
});

test('Stage 4 budget windows handle zeroes, empty results, ties, and shrinking', () => {
  assert.deepEqual(findLongestBudgetWindow([0,0,0,0], 0), { start: 0, end: 3, length: 4 });
  assert.deepEqual(findLongestBudgetWindow([0,0,2,0,1,0], 1), { start: 3, end: 5, length: 3 });
  assert.deepEqual(findLongestBudgetWindow([2,2,2], 1), { start: 0, end: -1, length: 0 });
  assert.deepEqual(findLongestBudgetWindow([2,3,4,5], 20), { start: 0, end: 3, length: 4 });
  assert.deepEqual(findLongestBudgetWindow([1,2,3], 6), { start: 0, end: 2, length: 3 });
  assert.deepEqual(findLongestBudgetWindow([1,1,1,10], 3), { start: 0, end: 2, length: 3 });
  assert.deepEqual(findLongestBudgetWindow([10,1,1,1], 3), { start: 1, end: 3, length: 3 });
  assert.deepEqual(findLongestBudgetWindow([9,2,1,1,2,9], 4), { start: 1, end: 3, length: 3 });
  assert.deepEqual(findLongestBudgetWindow([1,2,1,3,2,1,4], 6), { start: 0, end: 2, length: 3 });
  assert.deepEqual(findLongestBudgetWindow([1_000_000_000,1_000_000_000,1_000_000_000], 2_000_000_000), { start: 0, end: 1, length: 2 });
  assert.equal(findLongestBudgetWindow(Array(100_000).fill(1), 1_000).length, 1_000);
});

test('fixed-window counting handles singleton, full-width, zero, and long-long-sized sums', () => {
  assert.equal(countQualifyingFixedWindows([0, 5, 8, 2], 1, 5), 2);
  assert.equal(countQualifyingFixedWindows([3, 4, 5, 6], 4, 15), 1);
  assert.equal(countQualifyingFixedWindows([0, 0, 0, 0], 2, 0), 3);
  assert.equal(countQualifyingFixedWindows([1_000_000_000, 1_000_000_000, 1_000_000_000], 2, 2_000_000_000), 2);
  assert.equal(countQualifyingFixedWindows([1, 2, 3, 4], 2, 20), 0);
  assert.equal(countQualifyingFixedWindows([3, 4, 5, 6, 7], 2, 7), 4);
  assert.equal(countQualifyingFixedWindows([5, 5, 5, 1], 2, 10), 2);
  assert.equal(countQualifyingFixedWindows(Array(100_000).fill(1), 50_000, 50_000), 50_001);
});

test('direct Stage 2 selection does not complete Stage 1', () => {
  const levels = new LevelManager(greenhouseGame);
  levels.select(greenhouseStageIds.sustain);
  assert.equal(levels.currentStage?.id, greenhouseStageIds.sustain);
  assert.equal(levels.complete(greenhouseStageIds.restore).accepted, false);
  assert.equal(levels.complete(greenhouseStageIds.sustain).accepted, true);
});

test('variable windows return the shortest range and keep the earliest equal-length range', () => {
  assert.deepEqual(findMinimumWindow(greenhouseCrystals, 14), { start: 2, end: 4, sum: 14, length: 3 });
  assert.equal(findMinimumWindow([2, 3, 1, 2, 4, 3], 7)?.length, 2);
  assert.equal(findMinimumWindow([1, 2, 3], 10), null);
  assert.deepEqual(findMinimumWindow([2, 5, 2, 5], 7), { start: 0, end: 1, sum: 7, length: 2 });
});

test('variable windows cover boundaries, repeated shrink, exact and long-long-sized sums', () => {
  assert.equal(findMinimumWindow([7], 7)?.length, 1);
  assert.equal(findMinimumWindow([7], 8), null);
  assert.equal(findMinimumWindow([2, 2, 2], 6)?.length, 3);
  assert.equal(findMinimumWindow([5, 1, 1, 1], 5)?.start, 0);
  assert.equal(findMinimumWindow([1, 1, 1, 5], 5)?.start, 3);
  assert.equal(findMinimumWindow([4, 2, 7, 1], 14)?.length, 4);
  assert.equal(findMinimumWindow([2, 3, 1, 2, 4, 3], 7)?.start, 4);
  assert.equal(findMinimumWindow([1_000_000_000, 1_000_000_000], 2_000_000_000)?.length, 2);
  assert.equal(findMinimumWindow(Array(100_000).fill(1), 100_000)?.length, 100_000);
});

test('direct Stage 3 selection initializes only Stage 3 completion', () => {
  const levels = new LevelManager(greenhouseGame);
  levels.select(greenhouseStageIds.burst);
  assert.equal(levels.currentStage?.id, greenhouseStageIds.burst);
  assert.equal(levels.complete(greenhouseStageIds.restore).accepted, false);
  assert.equal(levels.complete(greenhouseStageIds.sustain).accepted, false);
  assert.equal(levels.complete(greenhouseStageIds.burst).accepted, true);
});

test('direct Stage 4 selection does not mark any earlier stage complete', () => {
  const levels = new LevelManager(greenhouseGame);
  levels.select(greenhouseStageIds.budget);
  assert.equal(levels.currentStage?.id, greenhouseStageIds.budget);
  for (const earlier of [greenhouseStageIds.restore, greenhouseStageIds.sustain, greenhouseStageIds.burst]) {
    assert.equal(levels.complete(earlier).accepted, false);
  }
  assert.equal(levels.complete(greenhouseStageIds.budget).accepted, true);
});

test('adventure registry includes only implemented stages and derives resume links from stable ids', () => {
  assert.equal(greenhouseGame.stages.length, 4);
  assert.equal(greenhouseGame.stages[0]?.title, 'Restart the Greenhouse');
  assert.equal(greenhouseGame.stages[1]?.title, 'Keep the Greenhouse Alive');
  assert.equal(greenhouseGame.stages[2]?.title, 'A Short Burst');
  assert.equal(greenhouseGame.stages[3]?.title, 'Keep the Vines Warm');
  assert.match(stageHref(greenhouseStageIds.sustain), new RegExp(`stage=${greenhouseStageIds.sustain}`));
  assert.match(stageHref(greenhouseStageIds.restore, { replayTutorial: true }), /tutorial=replay/);
});

test('adventure status reflects this player’s stage checkpoints', () => {
  const scope = 'overview-status-test';
  const progress = new ProgressManager(greenhouseGame.id, undefined, scope);
  const stage = greenhouseGame.stages[0]!;
  assert.equal(getGreenhouseStageStatus(stage, progress), 'Not started');
  progress.checkpoint(stage.id, 'attempted', { attempted: true });
  assert.equal(getGreenhouseStageStatus(stage, progress), 'In progress');
  progress.checkpoint(stage.id, 'greenhouse-restored', { completed: true });
  assert.equal(getGreenhouseStageStatus(stage, progress), 'Completed');
});
