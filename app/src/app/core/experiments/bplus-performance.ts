export type AccessScenario = 'illustrative' | 'postgres';

export interface IndexOrders {
  btreeOrder: number;
  bplusOrder: number;
  ratio: number;
}

export interface BTreeBPlusAccessSample {
  n: number;
  btreeAccesses: number;
  bplusAccesses: number;
  savedAccesses: number;
}

export function estimateIndexOrders(
  pageSize = 8_192,
  keySize = 8,
  pointerSize = 8,
  payloadSize = 100,
  headerSize = 32
): IndexOrders {
  const usable = Math.max(1, pageSize - headerSize);
  const btreeOrder = Math.max(3, Math.floor(usable / (keySize + payloadSize + pointerSize)));
  const bplusOrder = Math.max(3, Math.floor(usable / (keySize + pointerSize)));
  return { btreeOrder, bplusOrder, ratio: bplusOrder / btreeOrder };
}

export function buildBTreeBPlusAccessSamples(
  maxSize: number,
  btreeOrder: number,
  bplusOrder: number
): BTreeBPlusAccessSample[] {
  const normalizedMax = Math.max(100, Math.floor(maxSize));
  const candidates = [100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, normalizedMax];
  const sizes = Array.from(new Set(candidates.filter(size => size <= normalizedMax))).sort((left, right) => left - right);

  return sizes.map(n => {
    const btreeAccesses = estimatePointAccesses(n, btreeOrder);
    const bplusAccesses = estimatePointAccesses(n, bplusOrder);
    return { n, btreeAccesses, bplusAccesses, savedAccesses: btreeAccesses - bplusAccesses };
  });
}

export function estimatePointAccesses(size: number, order: number): number {
  return Math.max(1, Math.ceil(Math.log(Math.max(2, size)) / Math.log(Math.max(3, order))));
}

export function estimateRangeAccesses(size: number, order: number, resultCount: number): {
  verticalAccesses: number;
  lateralLeafScans: number;
  totalAccesses: number;
} {
  const verticalAccesses = estimatePointAccesses(size, order);
  const leafCapacity = Math.max(1, order - 1);
  const lateralLeafScans = Math.max(1, Math.ceil(Math.max(0, resultCount) / leafCapacity));
  return { verticalAccesses, lateralLeafScans, totalAccesses: verticalAccesses + lateralLeafScans - 1 };
}
