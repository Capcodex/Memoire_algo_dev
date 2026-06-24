import { BPlusTree } from './bplustree';

describe('BPlusTree', () => {
  it.each([3, 4, 5, 6, 8])('keeps every key in the ordered leaf chain for order %i', order => {
    const tree = new BPlusTree(order);
    const values = Array.from({ length: 100 }, (_, index) => index + 1);
    values.forEach(value => tree.insert(value));
    const chain = tree.getLeafChain();

    expect(chain.flat()).toEqual(values);
    expect(tree.snapshot().metrics.leafCount).toBe(chain.length);
    expect(chain.every((leaf, index) => index === 0 || chain[index - 1].at(-1)! < leaf[0])).toBe(true);
  });

  it('returns range results and physical access metrics', () => {
    const tree = new BPlusTree(5);
    Array.from({ length: 40 }, (_, index) => index + 1).forEach(value => tree.insert(value));
    const sequence = tree.rangeQuery(12, 27);
    const metrics = sequence.steps.at(-1)?.state.metrics;

    expect(tree.getLastRangeResults()).toEqual(Array.from({ length: 16 }, (_, index) => index + 12));
    expect(metrics?.verticalAccesses).toBeGreaterThan(0);
    expect(metrics?.lateralLeafScans).toBeGreaterThan(1);
    expect(metrics?.diskAccessesEst).toBe((metrics?.verticalAccesses ?? 0) + (metrics?.lateralLeafScans ?? 0) - 1);
  });
});
