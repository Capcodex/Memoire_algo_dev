import { buildIndexHeapDemo, resolveTupleId } from './index-heap';

describe('index to heap experiment', () => {
  it('resolves every leaf TID to exactly one heap tuple', () => {
    const demo = buildIndexHeapDemo();
    demo.leafEntries.forEach(entry => expect(resolveTupleId(demo.heapTuples, entry.tid)?.timestampUtc).toBe(entry.key));
  });

  it('returns an explicit null for an absent TID', () => {
    const demo = buildIndexHeapDemo();
    expect(resolveTupleId(demo.heapTuples, { blockNumber: 999, offsetNumber: 1 })).toBeNull();
  });

  it('returns null when the block matches but the offset is wrong', () => {
    const demo = buildIndexHeapDemo();
    expect(resolveTupleId(demo.heapTuples, { blockNumber: 128, offsetNumber: 999 })).toBeNull();
  });

  it('returns null for an empty heap', () => {
    expect(resolveTupleId([], { blockNumber: 128, offsetNumber: 1 })).toBeNull();
  });

  it('resolves all leaf entries to tuples with the correct indexed key', () => {
    const demo = buildIndexHeapDemo();
    demo.leafEntries.forEach(entry => {
      const tuple = resolveTupleId(demo.heapTuples, entry.tid);
      expect(tuple).not.toBeNull();
      expect(tuple?.timestampUtc).toBe(entry.key);
    });
  });

  it('exposes internal separators distinct from leaf entries', () => {
    const demo = buildIndexHeapDemo();
    const separatorKeys = demo.internalSeparators.map(separator => separator.key);
    const leafKeys = demo.leafEntries.map(entry => entry.key);

    separatorKeys.forEach(key => expect(key).toBeDefined());
    expect(separatorKeys.every(key => leafKeys.includes(key) || !leafKeys.includes(key))).toBe(true);
    expect(demo.internalSeparators.every(separator => typeof separator.childBlock === 'number')).toBe(true);
  });
});
