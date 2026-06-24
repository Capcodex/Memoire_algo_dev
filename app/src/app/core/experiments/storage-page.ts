export type IndexPageType = 'internal' | 'leaf';

export interface DiskPageInput {
  pageSizeBytes: number;
  headerBytes: number;
  linePointerBytes: number;
  keyBytes: number;
  childPointerBytes: number;
  tidBytes: number;
  fillFactorPercent: number;
  pageType: IndexPageType;
}

export interface DiskPageLayout extends DiskPageInput {
  entryPayloadBytes: number;
  entryBytes: number;
  capacity: number;
  linePointersTotalBytes: number;
  entriesTotalBytes: number;
  freeBytes: number;
  usedPercent: number;
  order: number;
}

export function calculateDiskPageLayout(input: DiskPageInput): DiskPageLayout {
  const pageSizeBytes = Math.max(512, Math.floor(input.pageSizeBytes));
  const headerBytes = Math.min(pageSizeBytes, Math.max(0, Math.floor(input.headerBytes)));
  const linePointerBytes = Math.max(1, Math.floor(input.linePointerBytes));
  const keyBytes = Math.max(1, Math.floor(input.keyBytes));
  const childPointerBytes = Math.max(1, Math.floor(input.childPointerBytes));
  const tidBytes = Math.max(1, Math.floor(input.tidBytes));
  const fillFactorPercent = Math.min(100, Math.max(10, input.fillFactorPercent));
  const entryPayloadBytes = keyBytes + (input.pageType === 'internal' ? childPointerBytes : tidBytes);
  const entryBytes = entryPayloadBytes + linePointerBytes;
  const usableBytes = Math.max(0, pageSizeBytes - headerBytes);
  const targetBytes = Math.floor(usableBytes * fillFactorPercent / 100);
  const capacity = Math.max(0, Math.floor(targetBytes / entryBytes));
  const linePointersTotalBytes = capacity * linePointerBytes;
  const entriesTotalBytes = capacity * entryPayloadBytes;
  const freeBytes = pageSizeBytes - headerBytes - linePointersTotalBytes - entriesTotalBytes;
  const usedPercent = pageSizeBytes === 0 ? 0 : ((pageSizeBytes - freeBytes) / pageSizeBytes) * 100;

  return {
    ...input,
    pageSizeBytes,
    headerBytes,
    linePointerBytes,
    keyBytes,
    childPointerBytes,
    tidBytes,
    fillFactorPercent,
    entryPayloadBytes,
    entryBytes,
    capacity,
    linePointersTotalBytes,
    entriesTotalBytes,
    freeBytes,
    usedPercent,
    order: input.pageType === 'internal' ? capacity + 1 : capacity
  };
}

export function estimatePageTreeHeight(recordCount: number, branchingFactor: number): number {
  const records = Math.max(1, Math.floor(recordCount));
  const branching = Math.max(2, Math.floor(branchingFactor));
  return Math.max(1, Math.ceil(Math.log(records) / Math.log(branching)));
}
