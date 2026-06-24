import { buildIndexStorageDemo, resolveTupleId } from './index-storage';

describe('index storage demo', () => {
  it('resolves every leaf TID to exactly one heap tuple', () => {
    const demo = buildIndexStorageDemo();
    for (const entry of demo.leafEntries) {
      const tuple = resolveTupleId(demo, entry.tid);
      expect(tuple?.capteurId).toBe(entry.key);
    }
  });

  it('returns null for an unknown physical address', () => {
    expect(resolveTupleId(buildIndexStorageDemo(), { blockNumber: 999, offsetNumber: 1 })).toBeNull();
  });
});
