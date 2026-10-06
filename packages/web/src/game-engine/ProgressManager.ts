import { GameBridge } from './GameBridge';
import type { CheckpointPayload, ProgressValue } from './types';

/** Reports deliberate checkpoints; gameplay frames and transient input are never persisted. */
export class ProgressManager {
  constructor(
    private readonly gameId: string,
    private readonly bridge: GameBridge,
  ) {}

  checkpoint(
    stageId: string,
    checkpointId: string,
    progress: Record<string, ProgressValue>,
  ) {
    const payload: CheckpointPayload = {
      gameId: this.gameId,
      stageId,
      checkpointId,
      progress,
    };
    this.bridge.emit('checkpoint:reached', payload);
  }
}
