import { BinaryTreeNode, MultiKeyTreeNode } from '../models/tree.models';
import { enrichBinaryTreeMetrics, enrichMultiKeyTreeMetrics } from './tree-metrics';

describe('tree metrics', () => {
  it('computes structural and theoretical binary metrics', () => {
    const root: BinaryTreeNode = {
      id: 'root',
      value: 2,
      isLeaf: false,
      left: { id: 'left', value: 1, isLeaf: true },
      right: { id: 'right', value: 3, isLeaf: true }
    };

    const metrics = enrichBinaryTreeMetrics(root, { height: 1, nodeCount: 3, comparisons: 0 });

    expect(metrics.leafCount).toBe(2);
    expect(metrics.internalNodeCount).toBe(1);
    expect(metrics.fillRate).toBe(1);
    expect(metrics.theoreticalHeightEst).toBe(1);
    expect(metrics.avgSearchCostEst).toBeCloseTo(5 / 3);
  });

  it('computes occupancy and page costs for a multi-key tree', () => {
    const root: MultiKeyTreeNode = {
      id: 'root',
      isLeaf: false,
      keys: [20],
      children: [
        { id: 'left', isLeaf: true, keys: [5, 10] },
        { id: 'right', isLeaf: true, keys: [20, 30] }
      ]
    };

    const metrics = enrichMultiKeyTreeMetrics(root, { height: 1, nodeCount: 3, comparisons: 0, splits: 1 }, 4);

    expect(metrics.leafCount).toBe(2);
    expect(metrics.internalNodeCount).toBe(1);
    expect(metrics.fillRate).toBeCloseTo(5 / 9);
    expect(metrics.verticalAccesses).toBe(2);
    expect(metrics.writeCostEst).toBe(4);
  });
});
