import { BstInsertionOrder, generateBstValues, measureBstHeight } from './bst-degradation';

export type StorageMedium = 'ram' | 'ssd' | 'hdd';

export interface AvlMeasurement {
  height: number;
  rotations: number;
}

export interface TreeGrowthSample extends AvlMeasurement {
  n: number;
  bstHeight: number;
  logarithmic: number;
  avlUpperBound: number;
  projected: boolean;
}

export interface StorageCost {
  medium: StorageMedium;
  label: string;
  unitCostMs: number;
  totalCostMs: number;
}

interface AvlMeasureNode {
  value: number;
  height: number;
  left: AvlMeasureNode | null;
  right: AvlMeasureNode | null;
}

const STORAGE_MEDIA: readonly Omit<StorageCost, 'totalCostMs'>[] = [
  { medium: 'ram', label: 'RAM · ~100 ns/nœud', unitCostMs: 0.0001 },
  { medium: 'ssd', label: 'SSD · ~100 µs/nœud', unitCostMs: 0.1 },
  { medium: 'hdd', label: 'HDD · ~10 ms/nœud', unitCostMs: 10 }
];

export const EXACT_GROWTH_LIMIT = 10_000;

export function measureAvl(values: readonly number[]): AvlMeasurement {
  let root: AvlMeasureNode | null = null;
  let rotations = 0;

  const height = (node: AvlMeasureNode | null) => node?.height ?? -1;
  const update = (node: AvlMeasureNode) => {
    node.height = 1 + Math.max(height(node.left), height(node.right));
  };
  const rotateRight = (node: AvlMeasureNode): AvlMeasureNode => {
    const pivot = node.left!;
    node.left = pivot.right;
    pivot.right = node;
    update(node);
    update(pivot);
    rotations++;
    return pivot;
  };
  const rotateLeft = (node: AvlMeasureNode): AvlMeasureNode => {
    const pivot = node.right!;
    node.right = pivot.left;
    pivot.left = node;
    update(node);
    update(pivot);
    rotations++;
    return pivot;
  };
  const insert = (node: AvlMeasureNode | null, value: number): AvlMeasureNode => {
    if (!node) return { value, height: 0, left: null, right: null };

    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    update(node);

    const balance = height(node.left) - height(node.right);
    if (balance > 1) {
      if (value > node.left!.value) node.left = rotateLeft(node.left!);
      return rotateRight(node);
    }
    if (balance < -1) {
      if (value < node.right!.value) node.right = rotateRight(node.right!);
      return rotateLeft(node);
    }
    return node;
  };

  for (const value of values) root = insert(root, value);
  return { height: height(root), rotations };
}

export function buildTreeGrowthSamples(
  maxSize: number,
  order: BstInsertionOrder,
  seed = 42
): TreeGrowthSample[] {
  const normalizedMax = Math.max(10, Math.floor(maxSize));
  const candidates = [10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, normalizedMax];
  const sizes = Array.from(new Set(candidates.filter(size => size <= normalizedMax))).sort((left, right) => left - right);

  return sizes.map(n => {
    const projected = n > EXACT_GROWTH_LIMIT;
    if (projected) {
      const chronological = order === 'chronological' || order === 'descending' || order === 'iot';
      return {
        n,
        bstHeight: chronological ? n - 1 : Math.ceil(3 * Math.log2(n)),
        height: Math.ceil(Math.log2(n + 1)) - 1,
        rotations: chronological ? Math.max(0, n - Math.ceil(Math.log2(n + 1))) : Math.round(n * 0.7),
        logarithmic: Math.log2(n),
        avlUpperBound: 1.44 * Math.log2(n),
        projected: true
      };
    }

    const values = generateBstValues(n, order, seed);
    const avl = measureAvl(values);
    const chronological = order === 'chronological' || order === 'descending' || order === 'iot';
    return {
      n,
      bstHeight: chronological ? n - 1 : measureBstHeight(values),
      height: avl.height,
      rotations: avl.rotations,
      logarithmic: Math.log2(n),
      avlUpperBound: 1.44 * Math.log2(n),
      projected: false
    };
  });
}

export function estimateAvlStorageCosts(size: number): {
  estimatedHeight: number;
  accesses: number;
  costs: StorageCost[];
} {
  const normalizedSize = Math.max(2, Math.floor(size));
  const estimatedHeight = 1.44 * Math.log2(normalizedSize);
  const accesses = Math.ceil(estimatedHeight);
  return {
    estimatedHeight,
    accesses,
    costs: STORAGE_MEDIA.map(medium => ({
      ...medium,
      totalCostMs: accesses * medium.unitCostMs
    }))
  };
}
