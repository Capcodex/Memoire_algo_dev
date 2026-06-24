import { calculateDiskPageLayout } from './disk-page';

describe('disk page layout', () => {
  it('uses every byte without producing negative zones', () => {
    const layout = calculateDiskPageLayout({ pageSizeBytes: 8_192, keySizeBytes: 8, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 90, pageKind: 'leaf', recordCount: 1_000_000 });
    const total = layout.headerBytes + layout.linePointersBytes + layout.entriesBytes + layout.freeBytes;

    expect(total).toBe(8_192);
    expect(layout.freeBytes).toBeGreaterThanOrEqual(0);
    expect(layout.capacity).toBeGreaterThan(400);
  });

  it('reduces capacity when keys or TIDs grow', () => {
    const compact = calculateDiskPageLayout({ pageSizeBytes: 8_192, keySizeBytes: 8, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 90, pageKind: 'leaf', recordCount: 1_000_000 });
    const wide = calculateDiskPageLayout({ pageSizeBytes: 8_192, keySizeBytes: 32, pointerSizeBytes: 8, tidSizeBytes: 16, fillFactorPercent: 90, pageKind: 'leaf', recordCount: 1_000_000 });

    expect(wide.capacity).toBeLessThan(compact.capacity);
  });

  it('distinguishes internal downlinks from leaf TIDs', () => {
    const internal = calculateDiskPageLayout({ pageSizeBytes: 8_192, keySizeBytes: 8, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 90, pageKind: 'internal', recordCount: 100_000_000 });
    const leaf = calculateDiskPageLayout({ pageSizeBytes: 8_192, keySizeBytes: 8, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 90, pageKind: 'leaf', recordCount: 100_000_000 });

    expect(internal.order).toBe(internal.capacity + 1);
    expect(leaf.order).toBe(leaf.capacity);
    expect(internal.estimatedPageAccesses).toBeLessThanOrEqual(4);
  });

  it('produces no negative zone bytes for any valid input', () => {
    const inputs = [
      { pageSizeBytes: 512, keySizeBytes: 4, pointerSizeBytes: 4, tidSizeBytes: 4, fillFactorPercent: 50, pageKind: 'leaf' as const, recordCount: 10 },
      { pageSizeBytes: 8_192, keySizeBytes: 100, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 10, pageKind: 'internal' as const, recordCount: 1_000 },
      { pageSizeBytes: 65_536, keySizeBytes: 1, pointerSizeBytes: 1, tidSizeBytes: 1, fillFactorPercent: 100, pageKind: 'leaf' as const, recordCount: 1_000_000 }
    ];
    inputs.forEach(input => {
      const layout = calculateDiskPageLayout(input);
      expect(layout.headerBytes).toBeGreaterThanOrEqual(0);
      expect(layout.linePointersBytes).toBeGreaterThanOrEqual(0);
      expect(layout.entriesBytes).toBeGreaterThanOrEqual(0);
      expect(layout.freeBytes).toBeGreaterThanOrEqual(0);
      expect(layout.headerBytes + layout.linePointersBytes + layout.entriesBytes + layout.freeBytes).toBe(layout.pageSizeBytes);
    });
  });

  it('keeps a minimum capacity of 1 even with a very large key', () => {
    const layout = calculateDiskPageLayout({ pageSizeBytes: 512, keySizeBytes: 200, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 90, pageKind: 'leaf', recordCount: 1_000 });

    expect(layout.capacity).toBeGreaterThanOrEqual(1);
    expect(layout.freeBytes).toBeGreaterThanOrEqual(0);
  });

  it('handles a single-record table without producing NaN height', () => {
    const layout = calculateDiskPageLayout({ pageSizeBytes: 8_192, keySizeBytes: 8, pointerSizeBytes: 8, tidSizeBytes: 6, fillFactorPercent: 90, pageKind: 'leaf', recordCount: 1 });

    expect(Number.isFinite(layout.estimatedHeight)).toBe(true);
    expect(layout.estimatedHeight).toBeGreaterThanOrEqual(0);
    expect(layout.estimatedPageAccesses).toBeGreaterThanOrEqual(1);
  });
});
