import { generateBstValues } from './bst-degradation';
import { buildTreeGrowthSamples, estimateAvlStorageCosts, measureAvl } from './avl-performance';

describe('AVL performance experiment', () => {
  it('keeps chronological IoT data logarithmic', () => {
    const measurement = measureAvl(generateBstValues(1_000, 'iot'));

    expect(measurement.height).toBe(9);
    expect(measurement.rotations).toBeGreaterThan(0);
  });

  it('compares the same values in BST and AVL', () => {
    const sample = buildTreeGrowthSamples(1_000, 'chronological').at(-1);

    expect(sample?.bstHeight).toBe(999);
    expect(sample?.height).toBe(9);
    expect(sample?.projected).toBe(false);
    expect(sample?.logarithmic).toBeCloseTo(Math.log2(1_000));
    expect(sample?.height).toBeLessThanOrEqual(Math.ceil(sample?.avlUpperBound ?? 0));
  });

  it('projects large volumes without constructing every node', () => {
    const samples = buildTreeGrowthSamples(100_000_000, 'chronological');
    const final = samples.at(-1);

    expect(final?.n).toBe(100_000_000);
    expect(final?.projected).toBe(true);
    expect(final?.bstHeight).toBe(99_999_999);
    expect(final?.height).toBeLessThan(30);
    expect(samples.find(sample => sample.n === 10_000)?.projected).toBe(false);
  });

  it('converts the same AVL height into storage costs', () => {
    const estimate = estimateAvlStorageCosts(1_000_000);
    const ram = estimate.costs.find(cost => cost.medium === 'ram');
    const ssd = estimate.costs.find(cost => cost.medium === 'ssd');
    const hdd = estimate.costs.find(cost => cost.medium === 'hdd');

    expect(estimate.accesses).toBe(29);
    expect(ram?.totalCostMs).toBeCloseTo(0.0029);
    expect(ssd?.totalCostMs).toBeCloseTo(2.9);
    expect(hdd?.totalCostMs).toBeCloseTo(290);
  });
});
