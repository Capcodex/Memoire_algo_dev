export interface TupleId {
  blockNumber: number;
  offsetNumber: number;
}

export interface InternalIndexEntry {
  separator: number;
  childBlock: number;
}

export interface LeafIndexEntry {
  key: number;
  tid: TupleId;
}

export interface HeapTuple {
  tid: TupleId;
  capteurId: number;
  timestampUtc: string;
  valeur: number;
  alerte: boolean;
}

export interface IndexStorageDemo {
  internalBlock: number;
  internalEntries: readonly InternalIndexEntry[];
  leafBlock: number;
  leafEntries: readonly LeafIndexEntry[];
  heapBlock: number;
  heapTuples: readonly HeapTuple[];
}

export function buildIndexStorageDemo(): IndexStorageDemo {
  const heapBlock = 128;
  const heapTuples = Array.from({ length: 6 }, (_, index): HeapTuple => ({
    tid: { blockNumber: heapBlock, offsetNumber: index + 1 },
    capteurId: 40 + index,
    timestampUtc: `2024-01-${String(index + 10).padStart(2, '0')} 10:00`,
    valeur: 18.5 + index * 0.7,
    alerte: index === 4
  }));
  return {
    internalBlock: 12,
    internalEntries: [{ separator: 42, childBlock: 37 }, { separator: 45, childBlock: 38 }],
    leafBlock: 37,
    leafEntries: heapTuples.slice(0, 4).map(tuple => ({ key: tuple.capteurId, tid: { ...tuple.tid } })),
    heapBlock,
    heapTuples
  };
}

export function resolveTupleId(demo: IndexStorageDemo, tid: TupleId): HeapTuple | null {
  return demo.heapTuples.find(tuple => tuple.tid.blockNumber === tid.blockNumber && tuple.tid.offsetNumber === tid.offsetNumber) ?? null;
}

export function formatTupleId(tid: TupleId): string {
  return `(${tid.blockNumber}, ${tid.offsetNumber})`;
}
