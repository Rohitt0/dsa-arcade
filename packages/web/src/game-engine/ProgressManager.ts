import { GameBridge } from './GameBridge';
import type { CheckpointPayload, ProgressValue } from './types';

/** Stores deliberate checkpoints; gameplay frames and transient input are never persisted. */
export class ProgressManager {
  private static memory = new Map<string, Record<string, ProgressValue>>();
  constructor(
    private readonly gameId: string,
    private readonly bridge?: GameBridge,
    private readonly scope = 'guest',
  ) {}

  private key(stageId: string, checkpointId: string) {
    return `dsa:progress:v1:${encodeURIComponent(this.scope)}:${this.gameId}:${stageId}:${checkpointId}`;
  }

  read(stageId: string, checkpointId: string): Record<string, ProgressValue> | undefined {
    const key = this.key(stageId, checkpointId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data: unknown = JSON.parse(raw);
        if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, ProgressValue>;
      }
    } catch { /* Storage can be unavailable or contain an invalid old value. */ }
    return ProgressManager.memory.get(key);
  }

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
    const key = this.key(stageId, checkpointId);
    ProgressManager.memory.set(key, progress);
    try { localStorage.setItem(key, JSON.stringify(progress)); } catch { /* Retain session progress if storage is unavailable. */ }
    this.bridge?.emit('checkpoint:reached', payload);
  }
}
