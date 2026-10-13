export interface FixedWindowSum {
  start: number;
  sum: number;
}

/** Return every contiguous k-sized sum using O(n) time and O(n) result storage. */
export function getFixedWindowSums(values: readonly number[], k: number): FixedWindowSum[] {
  if (!Number.isInteger(k) || k < 1 || k > values.length) return [];
  let sum = 0;
  for (let index = 0; index < k; index++) sum += values[index];
  const windows: FixedWindowSum[] = [{ start: 0, sum }];
  for (let start = 1; start <= values.length - k; start++) {
    sum += values[start + k - 1] - values[start - 1];
    windows.push({ start, sum });
  }
  return windows;
}

export function countQualifyingFixedWindows(values: readonly number[], k: number, target: number): number {
  return getFixedWindowSums(values, k).reduce((count, window) => count + Number(window.sum >= target), 0);
}
