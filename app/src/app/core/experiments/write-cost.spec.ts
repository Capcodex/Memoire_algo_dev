import { buildInsertBenchmark, buildSplitStoryboard, estimateTradeoff } from './write-cost';

describe('write cost experiments', () => {
  it('reproduces the notebook benchmark calibration', () => {
    const results = buildInsertBenchmark(20_000, 50);

    expect(results.map(result => result.totalTimeMs).slice(0, 4)).toEqual([1.3, 55.7, 202.3, 219.2]);
    expect(results[4].projected).toBe(true);
    expect(results[3].relativeFactor).toBeCloseTo(219.2 / 1.3);
  });

  it('makes smaller orders more expensive to maintain', () => {
    const wide = buildInsertBenchmark(20_000, 50)[3];
    const narrow = buildInsertBenchmark(20_000, 5)[3];

    expect(narrow.totalTimeMs).toBeGreaterThan(wide.totalTimeMs);
  });

  it('exposes normal, leaf split and root split page costs', () => {
    const steps = buildSplitStoryboard();

    expect(steps.map(step => step.event)).toContain('split-leaf');
    expect(steps.map(step => step.event)).toContain('split-root');
    expect(steps.at(-1)?.indexPages).toBe(7);
    expect(steps.at(-1)?.levels).toHaveLength(3);
  });

  it('changes its recommendation with the workload', () => {
    const benchmark = buildInsertBenchmark(20_000, 50)[3];

    expect(estimateTradeoff(95, 1, benchmark).verdict).toBe('favorable');
    expect(estimateTradeoff(10, 80, benchmark).verdict).toBe('unfavorable');
  });
});
