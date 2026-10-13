import type { GameDefinition, StageDefinition } from './types';

export interface StageCompletion {
  accepted: boolean;
  nextStage: StageDefinition | null;
  gameCompleted: boolean;
}

/** Owns stage order and prevents duplicate or out-of-order completion. */
export class LevelManager {
  private currentIndex = 0;
  private completed = new Set<string>();

  constructor(readonly game: GameDefinition) {
    if (!game.id || game.stages.length === 0) {
      throw new Error('A game needs an id and at least one stage.');
    }
    const ids = game.stages.map((stage) => stage.id);
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      throw new Error('Stage ids must be present and unique within a game.');
    }
    if (game.stages.some((stage) => !stage.sceneKey || !stage.title)) {
      throw new Error('Every stage needs a title and a registered scene key.');
    }
  }

  get currentStage() {
    return this.game.stages[this.currentIndex] ?? null;
  }

  get currentStageNumber() {
    return this.currentIndex + 1;
  }

  select(stageId: string) {
    const index = this.game.stages.findIndex((stage) => stage.id === stageId);
    if (index < 0) throw new Error(`Unknown stage "${stageId}".`);
    this.currentIndex = index;
    return this.currentStage;
  }

  complete(stageId: string): StageCompletion {
    const current = this.currentStage;
    if (!current || current.id !== stageId || this.completed.has(stageId)) {
      return { accepted: false, nextStage: null, gameCompleted: false };
    }

    this.completed.add(stageId);
    this.currentIndex += 1;
    const nextStage = this.currentStage;
    return {
      accepted: true,
      nextStage,
      gameCompleted: nextStage === null,
    };
  }
}
