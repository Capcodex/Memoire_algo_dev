import { buildBTreeBPlusAccessSamples, estimateIndexOrders, estimateRangeAccesses } from './bplus-performance';

describe('B+Tree performance experiment', () => {
  it('derives denser internal nodes from an 8 KiB page', () => {
    const orders = estimateIndexOrders();

    expect(orders.btreeOrder).toBe(70);
    expect(orders.bplusOrder).toBe(510);
    expect(orders.ratio).toBeGreaterThan(7);
  });

  it('quantifies saved point accesses', () => {
    const sample = buildBTreeBPlusAccessSamples(100_000_000, 10, 25).at(-1);

    expect(sample?.bplusAccesses).toBeLessThan(sample?.btreeAccesses ?? 0);
    expect(sample?.savedAccesses).toBeGreaterThan(0);
  });

  it('separates vertical descent from lateral leaf scans', () => {
    const estimate = estimateRangeAccesses(1_000_000, 510, 1_000);

    expect(estimate.verticalAccesses).toBeGreaterThan(0);
    expect(estimate.lateralLeafScans).toBe(2);
    expect(estimate.totalAccesses).toBe(estimate.verticalAccesses + 1);
  });
});
