import type { StageDefinition } from '../types';
import type { ProgressManager } from '../ProgressManager';

export type GreenhouseStageStatus = 'Not started' | 'In progress' | 'Completed';

export function getGreenhouseStageStatus(
  stage: StageDefinition,
  progress: ProgressManager,
  serverCompleted = false,
  hasSavedSolution = false,
): GreenhouseStageStatus {
  const completed = serverCompleted || Boolean(
    progress.read(stage.id, 'greenhouse-restored') || progress.read(stage.id, 'stage-complete'),
  );
  if (completed) return 'Completed';
  const attempted = Boolean(progress.read(stage.id, 'attempted') || progress.read(stage.id, 'draft') || hasSavedSolution);
  return attempted ? 'In progress' : 'Not started';
}

export function stageHref(stageId: string, options?: { replayTutorial?: boolean }) {
  const query = new URLSearchParams({ stage: stageId });
  if (options?.replayTutorial) query.set('tutorial', 'replay');
  return `/game/greenhouse?${query.toString()}`;
}
