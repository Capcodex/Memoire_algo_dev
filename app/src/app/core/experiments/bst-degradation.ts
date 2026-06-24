export type BstInsertionOrder = 'chronological' | 'shuffled' | 'descending' | 'iot';

export interface BstHeightSample {
  n: number;
  chronological: number;
  shuffled: number;
  logarithmic: number;
  worstCase: number;
}

interface MeasureNode {
  value: number;
  left: MeasureNode | null;
  right: MeasureNode | null;
}

export function generateBstValues(
  size: number,
  order: BstInsertionOrder,
  seed = 42
): number[] {
  const normalizedSize = Math.max(0, Math.floor(size));
  const chronological = Array.from({ length: normalizedSize }, (_, index) => index + 1);

  if (order === 'descending') return chronological.reverse();
  if (order === 'shuffled') return seededShuffle(chronological, seed);
  if (order === 'iot') return chronological.map(index => 1_700 + index);
  return chronological;
}

export function measureBstHeight(values: readonly number[]): number {
  let root: MeasureNode | null = null;
  let height = -1;

  for (const value of values) {
    if (!root) {
      root = { value, left: null, right: null };
      height = 0;
      continue;
    }

    let current = root;
    let depth = 0;
    while (true) {
      depth++;
      const direction = value < current.value ? 'left' : 'right';
      const child = current[direction];
      if (!child) {
        current[direction] = { value, left: null, right: null };
        height = Math.max(height, depth);
        break;
      }
      current = child;
    }
  }

  return height;
}

export function buildBstHeightSamples(maxSize: number, seed = 42): BstHeightSample[] {
  const normalizedMax = Math.max(5, Math.floor(maxSize));
  const step = normalizedMax <= 30 ? 5 : 10;
  const sizes = Array.from(
    new Set([
      ...Array.from({ length: Math.floor(normalizedMax / step) }, (_, index) => (index + 1) * step),
      normalizedMax
    ])
  ).sort((left, right) => left - right);

  return sizes.map(n => ({
    n,
    chronological: n - 1,
    shuffled: measureBstHeight(generateBstValues(n, 'shuffled', seed)),
    logarithmic: Math.log2(n),
    worstCase: n - 1
  }));
}

function seededShuffle(values: number[], seed: number): number[] {
  const shuffled = [...values];
  let state = seed >>> 0;

  for (let index = shuffled.length - 1; index > 0; index--) {
    state = (1_664_525 * state + 1_013_904_223) >>> 0;
    const target = state % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}
