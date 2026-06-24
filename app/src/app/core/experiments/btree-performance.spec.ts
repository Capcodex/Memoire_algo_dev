import { buildAvlBTreeSamples, measureBTree, simulateBTreePage } from './btree-performance';
import { generateBstValues } from './bst-degradation';

describe('B-Tree performance experiment', () => {
  it.each([3, 4, 5, 6, 9])('measures a balanced B-Tree of order %i', order => {
    const measurement = measureBTree(generateBstValues(1_000, 'iot'), order);

    expect(measurement.height).toBeGreaterThan(0);
    expect(measurement.leafCount).toBeGreaterThan(0);
    expect(measurement.fillRate).toBeGreaterThan(0);
    expect(measurement.fillRate).toBeLessThanOrEqual(1);
  });

  it('shows fewer page accesses than an AVL', () => {
    const sample = buildAvlBTreeSamples(1_000, 50).at(-1);

    expect(sample?.avlHeight).toBe(9);
    expect(sample?.btreeHeight).toBeLessThan(sample?.avlHeight ?? 0);
    expect(sample?.btreePageAccesses).toBeLessThan(sample?.avlPageAccesses ?? 0);
  });

  it('derives the order from physical page dimensions', () => {
    const simulation = simulateBTreePage(8_192, 8, 8, 1_000_000);

    expect(simulation.order).toBe(510);
    expect(simulation.maxKeys).toBe(509);
    expect(simulation.leafCapacity).toBe(510);
    expect(simulation.estimatedPageAccesses).toBeLessThanOrEqual(3);
  });

  it('estimates height for 100 million records without constructing any node', () => {
    const start = performance.now();
    const simulation = simulateBTreePage(8_192, 8, 8, 100_000_000);
    const elapsed = performance.now() - start;

    expect(simulation.estimatedPageAccesses).toBeLessThanOrEqual(4);
    expect(elapsed).toBeLessThan(50);
  });

  it('estimates height for one billion records without constructing any node', () => {
    const start = performance.now();
    const simulation = simulateBTreePage(8_192, 8, 8, 1_000_000_000);
    const elapsed = performance.now() - start;

    expect(simulation.estimatedPageAccesses).toBeLessThanOrEqual(5);
    expect(elapsed).toBeLessThan(50);
  });

  it('produces deterministic projections for the same inputs', () => {
    const first = simulateBTreePage(8_192, 8, 8, 100_000_000);
    const second = simulateBTreePage(8_192, 8, 8, 100_000_000);

    expect(first.estimatedHeight).toBe(second.estimatedHeight);
    expect(first.order).toBe(second.order);
    expect(first.estimatedPageAccesses).toBe(second.estimatedPageAccesses);
  });
});
