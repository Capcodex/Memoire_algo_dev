import { measureAvl } from './avl-performance';
import { BstInsertionOrder, generateBstValues } from './bst-degradation';

export interface BTreeMeasurement {
  height: number;
  splits: number;
  nodeCount: number;
  leafCount: number;
  internalNodeCount: number;
  fillRate: number;
}

export interface AvlBTreeSample {
  n: number;
  avlHeight: number;
  btreeHeight: number;
  avlPageAccesses: number;
  btreePageAccesses: number;
  btreeSplits: number;
}

export interface PageSimulation {
  order: number;
  maxKeys: number;
  leafCapacity: number;
  effectiveFanout: number;
  estimatedHeight: number;
  estimatedPageAccesses: number;
}

interface MeasureBTreeNode {
  keys: number[];
  children: MeasureBTreeNode[];
  isLeaf: boolean;
}

export function measureBTree(values: readonly number[], order: number): BTreeMeasurement {
  const normalizedOrder = Math.max(3, Math.floor(order));
  const maxKeys = normalizedOrder - 1;
  let root: MeasureBTreeNode = { keys: [], children: [], isLeaf: true };
  let height = 0;
  let splits = 0;

  const splitOverflow = (node: MeasureBTreeNode) => {
    splits++;
    const middleIndex = Math.floor(node.keys.length / 2);
    const promotedKey = node.keys[middleIndex];
    const rightNode: MeasureBTreeNode = {
      keys: node.keys.splice(middleIndex + 1),
      children: node.isLeaf ? [] : node.children.splice(middleIndex + 1),
      isLeaf: node.isLeaf
    };
    node.keys.splice(middleIndex, 1);
    return { promotedKey, rightNode };
  };

  const insert = (node: MeasureBTreeNode, value: number): ReturnType<typeof splitOverflow> | null => {
    let index = 0;
    while (index < node.keys.length && value > node.keys[index]) index++;

    if (node.isLeaf) {
      node.keys.splice(index, 0, value);
    } else {
      const childSplit = insert(node.children[index], value);
      if (childSplit) {
        node.keys.splice(index, 0, childSplit.promotedKey);
        node.children.splice(index + 1, 0, childSplit.rightNode);
      }
    }
    return node.keys.length > maxKeys ? splitOverflow(node) : null;
  };

  for (const value of values) {
    const rootSplit = insert(root, value);
    if (rootSplit) {
      root = { keys: [rootSplit.promotedKey], children: [root, rootSplit.rightNode], isLeaf: false };
      height++;
    }
  }

  const stats = collectStats(root);
  return {
    height,
    splits,
    nodeCount: stats.nodeCount,
    leafCount: stats.leafCount,
    internalNodeCount: stats.nodeCount - stats.leafCount,
    fillRate: stats.nodeCount === 0 ? 0 : stats.keyCount / (stats.nodeCount * maxKeys)
  };
}

export function buildAvlBTreeSamples(
  maxSize: number,
  order: number,
  insertionOrder: BstInsertionOrder = 'iot'
): AvlBTreeSample[] {
  const normalizedMax = Math.max(50, Math.floor(maxSize));
  const candidates = [50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, normalizedMax];
  const sizes = Array.from(new Set(candidates.filter(size => size <= normalizedMax))).sort((left, right) => left - right);

  return sizes.map(n => {
    const values = generateBstValues(n, insertionOrder);
    const avl = measureAvl(values);
    const btree = measureBTree(values, order);
    return {
      n,
      avlHeight: avl.height,
      btreeHeight: btree.height,
      avlPageAccesses: avl.height + 1,
      btreePageAccesses: btree.height + 1,
      btreeSplits: btree.splits
    };
  });
}

export function simulateBTreePage(
  pageSize: number,
  keySize: number,
  pointerSize: number,
  recordCount: number,
  headerSize = 32,
  rowPointerSize = 8
): PageSimulation {
  const usableBytes = Math.max(1, Math.floor(pageSize) - Math.max(0, Math.floor(headerSize)));
  const normalizedKeySize = Math.max(1, Math.floor(keySize));
  const normalizedPointerSize = Math.max(1, Math.floor(pointerSize));
  const order = Math.max(3, Math.floor((usableBytes + normalizedKeySize) / (normalizedKeySize + normalizedPointerSize)));
  const maxKeys = order - 1;
  const leafCapacity = Math.max(1, Math.floor(usableBytes / (normalizedKeySize + Math.max(1, Math.floor(rowPointerSize)))));
  const effectiveFanout = Math.max(2, Math.floor(order * 0.69));
  const estimatedHeight = Math.max(0, Math.ceil(Math.log(Math.max(1, recordCount) + 1) / Math.log(effectiveFanout)) - 1);

  return {
    order,
    maxKeys,
    leafCapacity,
    effectiveFanout,
    estimatedHeight,
    estimatedPageAccesses: estimatedHeight + 1
  };
}

function collectStats(node: MeasureBTreeNode): { nodeCount: number; leafCount: number; keyCount: number } {
  const children = node.children.map(collectStats);
  return {
    nodeCount: 1 + children.reduce((sum, stats) => sum + stats.nodeCount, 0),
    leafCount: (node.isLeaf ? 1 : 0) + children.reduce((sum, stats) => sum + stats.leafCount, 0),
    keyCount: node.keys.length + children.reduce((sum, stats) => sum + stats.keyCount, 0)
  };
}
