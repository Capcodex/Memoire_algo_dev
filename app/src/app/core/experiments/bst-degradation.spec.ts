import { buildBstHeightSamples, generateBstValues, measureBstHeight } from './bst-degradation';

describe('BST degradation experiment', () => {
  it('reproduces the pathological chronological case', () => {
    expect(measureBstHeight(generateBstValues(50, 'chronological'))).toBe(49);
    expect(measureBstHeight(generateBstValues(50, 'iot'))).toBe(49);
  });

  it('creates a deterministic shuffled control group', () => {
    const first = generateBstValues(30, 'shuffled', 42);
    const second = generateBstValues(30, 'shuffled', 42);

    expect(first).toEqual(second);
    expect(first).not.toEqual(generateBstValues(30, 'chronological'));
    expect([...first].sort((left, right) => left - right)).toEqual(generateBstValues(30, 'chronological'));
  });

  it('exposes the notebook comparison and theoretical references', () => {
    const finalSample = buildBstHeightSamples(50).at(-1);

    expect(finalSample).toMatchObject({ n: 50, chronological: 49, worstCase: 49 });
    expect(finalSample?.shuffled).toBeLessThan(49);
    expect(finalSample?.logarithmic).toBeCloseTo(Math.log2(50));
  });
});
