export interface VariableWindowRange {
  start: number;
  end: number;
  sum: number;
  length: number;
}

/** Positive values allow a left boundary to advance whenever the current sum reaches target. */
export function findMinimumWindow(values: readonly number[], target: number): VariableWindowRange | null {
  let left = 0;
  let sum = 0;
  let best: VariableWindowRange | null = null;

  for (let right = 0; right < values.length; right++) {
    sum += values[right]!;
    while (sum >= target) {
      const length = right - left + 1;
      if (!best || length < best.length) best = { start: left, end: right, sum, length };
      sum -= values[left]!;
      left++;
    }
  }

  return best;
}
