/** Shared mission examples keep the scene and visible judge inputs in sync. */
export const greenhouseStageExamples = {
  maximum: { crystals: [4, 2, 7, 1, 6, 3, 8, 5], windowSize: 3 },
  reliable: { crystals: [2, 5, 1, 4, 3, 6, 2, 7], windowSize: 3, target: 12 },
  burst: { crystals: [2, 3, 1, 2, 4, 3, 2, 1], target: 7 },
  budget: { crystals: [3, 1, 2, 1, 4, 2, 1, 5], budget: 7 },
} as const;
