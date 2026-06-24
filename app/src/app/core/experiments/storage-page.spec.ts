import { calculateDiskPageLayout, estimatePageTreeHeight } from './storage-page';

describe('disk page experiment', () => {
  it('accounts for every byte in an 8 KiB leaf page', () => {
    const page = calculateDiskPageLayout({ pageSizeBytes: 8192, headerBytes: 32, linePointerBytes: 4, keyBytes: 8, childPointerBytes: 8, tidBytes: 6, fillFactorPercent: 90, pageType: 'leaf' });
    expect(page.headerBytes + page.linePointersTotalBytes + page.entriesTotalBytes + page.freeBytes).toBe(8192);
    expect(page.capacity).toBeGreaterThan(300);
  });

  it('reduces capacity when keys or TIDs grow', () => {
    const compact = calculateDiskPageLayout({ pageSizeBytes: 8192, headerBytes: 32, linePointerBytes: 4, keyBytes: 8, childPointerBytes: 8, tidBytes: 6, fillFactorPercent: 90, pageType: 'leaf' });
    const wide = calculateDiskPageLayout({ pageSizeBytes: 8192, headerBytes: 32, linePointerBytes: 4, keyBytes: 64, childPointerBytes: 8, tidBytes: 12, fillFactorPercent: 90, pageType: 'leaf' });
    expect(wide.capacity).toBeLessThan(compact.capacity);
    expect(estimatePageTreeHeight(1_000_000, compact.capacity)).toBeLessThan(estimatePageTreeHeight(1_000_000, wide.capacity));
  });
});
