export type IndexPageKind = 'internal' | 'leaf';

export interface DiskPageInput {
  pageSizeBytes: number;
  keySizeBytes: number;
  pointerSizeBytes: number;
  tidSizeBytes: number;
  fillFactorPercent: number;
  pageKind: IndexPageKind;
  recordCount: number;
}

export interface DiskPageLayout {
  pageSizeBytes: number;
  headerBytes: number;
  linePointersBytes: number;
  entriesBytes: number;
  freeBytes: number;
  entrySizeBytes: number;
  capacity: number;
  order: number;
  estimatedHeight: number;
  estimatedPageAccesses: number;
  pageKind: IndexPageKind;
}

const PAGE_HEADER_BYTES = 24;
const LINE_POINTER_BYTES = 4;

export function calculateDiskPageLayout(input: DiskPageInput): DiskPageLayout {
  const pageSizeBytes = Math.max(512, Math.floor(input.pageSizeBytes));
  const keySizeBytes = Math.max(1, Math.floor(input.keySizeBytes));
  const pointerSizeBytes = Math.max(1, Math.floor(input.pointerSizeBytes));
  const tidSizeBytes = Math.max(1, Math.floor(input.tidSizeBytes));
  const fillFactor = Math.min(1, Math.max(0.1, input.fillFactorPercent / 100));
  const entrySizeBytes = keySizeBytes + (input.pageKind === 'internal' ? pointerSizeBytes : tidSizeBytes);
  const usableBytes = pageSizeBytes - PAGE_HEADER_BYTES;
  const targetedBytes = Math.floor(usableBytes * fillFactor);
  const capacity = Math.max(1, Math.floor(targetedBytes / (entrySizeBytes + LINE_POINTER_BYTES)));
  const linePointersBytes = capacity * LINE_POINTER_BYTES;
  const entriesBytes = capacity * entrySizeBytes;
  const freeBytes = pageSizeBytes - PAGE_HEADER_BYTES - linePointersBytes - entriesBytes;
  const order = input.pageKind === 'internal' ? capacity + 1 : capacity;
  const recordCount = Math.max(1, Math.floor(input.recordCount));
  const estimatedHeight = Math.max(0, Math.ceil(Math.log(recordCount) / Math.log(Math.max(2, order))) - 1);

  return {
    pageSizeBytes,
    headerBytes: PAGE_HEADER_BYTES,
    linePointersBytes,
    entriesBytes,
    freeBytes,
    entrySizeBytes,
    capacity,
    order,
    estimatedHeight,
    estimatedPageAccesses: estimatedHeight + 1,
    pageKind: input.pageKind
  };
}

export function pageZonePercentage(bytes: number, pageSizeBytes: number): number {
  return Math.max(0, Math.min(100, (bytes / pageSizeBytes) * 100));
}
