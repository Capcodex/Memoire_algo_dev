import { BinaryTreeNode, MultiKeyTreeNode, TreeMetrics } from '../models/tree.models';

interface BinaryStats {
  nodeCount: number;
  leafCount: number;
  depthSum: number;
}

interface MultiKeyStats extends BinaryStats {
  keyCount: number;
}

export function enrichBinaryTreeMetrics(
  root: BinaryTreeNode | null,
  metrics: TreeMetrics
): TreeMetrics {
  const stats = collectBinaryStats(root, 0);
  const capacity = metrics.height < 0 ? 0 : 2 ** (metrics.height + 1) - 1;

  return {
    ...metrics,
    leafCount: stats.leafCount,
    internalNodeCount: Math.max(0, stats.nodeCount - stats.leafCount),
    fillRate: capacity === 0 ? 0 : stats.nodeCount / capacity,
    theoreticalHeightEst: stats.nodeCount === 0 ? -1 : Math.ceil(Math.log2(stats.nodeCount + 1)) - 1,
    avgSearchCostEst: stats.nodeCount === 0 ? 0 : stats.depthSum / stats.nodeCount + 1,
    writeCostEst: metrics.rotations === undefined ? 1 : 1 + (metrics.rotations ?? 0)
  };
}

export function enrichMultiKeyTreeMetrics(
  root: MultiKeyTreeNode | null,
  metrics: TreeMetrics,
  order: number
): TreeMetrics {
  const stats = collectMultiKeyStats(root, 0);
  const keyCapacity = stats.nodeCount * Math.max(1, order - 1);

  return {
    ...metrics,
    leafCount: stats.leafCount,
    internalNodeCount: Math.max(0, stats.nodeCount - stats.leafCount),
    fillRate: keyCapacity === 0 ? 0 : stats.keyCount / keyCapacity,
    theoreticalHeightEst: stats.keyCount === 0 ? 0 : Math.max(0, Math.ceil(Math.log(stats.keyCount + 1) / Math.log(order)) - 1),
    avgSearchCostEst: metrics.height + 1,
    verticalAccesses: metrics.verticalAccesses ?? metrics.height + 1,
    lateralLeafScans: metrics.lateralLeafScans ?? 0,
    writeCostEst: metrics.height + 1 + (metrics.splits ?? 0) * 2
  };
}

function collectBinaryStats(node: BinaryTreeNode | null, depth: number): BinaryStats {
  if (!node) return { nodeCount: 0, leafCount: 0, depthSum: 0 };

  const left = collectBinaryStats(node.left ?? null, depth + 1);
  const right = collectBinaryStats(node.right ?? null, depth + 1);
  const isLeaf = !node.left && !node.right;

  return {
    nodeCount: 1 + left.nodeCount + right.nodeCount,
    leafCount: (isLeaf ? 1 : 0) + left.leafCount + right.leafCount,
    depthSum: depth + left.depthSum + right.depthSum
  };
}

function collectMultiKeyStats(node: MultiKeyTreeNode | null, depth: number): MultiKeyStats {
  if (!node) return { nodeCount: 0, leafCount: 0, keyCount: 0, depthSum: 0 };

  const children = node.children ?? [];
  const childStats = children.map(child => collectMultiKeyStats(child, depth + 1));

  return {
    nodeCount: 1 + childStats.reduce((sum, stats) => sum + stats.nodeCount, 0),
    leafCount: (node.isLeaf ? 1 : 0) + childStats.reduce((sum, stats) => sum + stats.leafCount, 0),
    keyCount: node.keys.length + childStats.reduce((sum, stats) => sum + stats.keyCount, 0),
    depthSum: depth + childStats.reduce((sum, stats) => sum + stats.depthSum, 0)
  };
}
