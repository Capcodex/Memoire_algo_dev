export interface TupleId {
  blockNumber: number;
  offsetNumber: number;
}

export interface IndexLeafEntry {
  key: number;
  tid: TupleId;
}

export interface HeapTuple {
  tid: TupleId;
  capteurId: number;
  timestampUtc: number;
  valeur: number;
  alerte: boolean;
}

export interface IndexHeapDemo {
  internalSeparators: readonly { key: number; childBlock: number }[];
  leafBlock: number;
  leafEntries: readonly IndexLeafEntry[];
  heapBlock: number;
  heapTuples: readonly HeapTuple[];
}

export function buildIndexHeapDemo(): IndexHeapDemo {
  const heapBlock = 128;
  const heapTuples: HeapTuple[] = [
    { tid: { blockNumber: heapBlock, offsetNumber: 1 }, capteurId: 42, timestampUtc: 1704, valeur: 18.7, alerte: false },
    { tid: { blockNumber: heapBlock, offsetNumber: 2 }, capteurId: 42, timestampUtc: 1705, valeur: 19.1, alerte: false },
    { tid: { blockNumber: heapBlock, offsetNumber: 3 }, capteurId: 17, timestampUtc: 1706, valeur: 31.4, alerte: true },
    { tid: { blockNumber: heapBlock, offsetNumber: 4 }, capteurId: 42, timestampUtc: 1707, valeur: 19.4, alerte: false }
  ];
  return {
    internalSeparators: [{ key: 1704, childBlock: 41 }, { key: 1708, childBlock: 42 }],
    leafBlock: 41,
    leafEntries: heapTuples.map(tuple => ({ key: tuple.timestampUtc, tid: tuple.tid })),
    heapBlock,
    heapTuples
  };
}

export function resolveTupleId(tuples: readonly HeapTuple[], tid: TupleId): HeapTuple | null {
  return tuples.find(tuple => tuple.tid.blockNumber === tid.blockNumber && tuple.tid.offsetNumber === tid.offsetNumber) ?? null;
}

export function formatTupleId(tid: TupleId): string {
  return `(${tid.blockNumber}, ${tid.offsetNumber})`;
}
