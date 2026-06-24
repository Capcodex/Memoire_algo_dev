import { BPlusTree } from '../algorithms/bplustree';
import { BTree } from '../algorithms/btree';
import { COMPARABLE_QUERIES, evaluateBPlusTreeQuery, evaluateBTreeQuery } from './tree-query-comparison';

describe('same query comparison', () => {
  const values = Array.from({ length: 20 }, (_, index) => (index + 1) * 5);

  it.each(COMPARABLE_QUERIES)('returns identical results for $label', query => {
    const btree = new BTree(5);
    const bplus = new BPlusTree(5);
    values.forEach(value => { btree.insert(value); bplus.insert(value); });
    const left = evaluateBTreeQuery(btree.snapshot().root!, query);
    const right = evaluateBPlusTreeQuery(bplus.snapshot().root!, query);
    expect(right.results).toEqual(left.results);
  });

  it('avoids parent returns for a B+Tree range', () => {
    const btree = new BTree(5);
    const bplus = new BPlusTree(5);
    values.forEach(value => { btree.insert(value); bplus.insert(value); });
    const query = COMPARABLE_QUERIES.find(item => item.id === 'range-wide')!;
    const left = evaluateBTreeQuery(btree.snapshot().root!, query);
    const right = evaluateBPlusTreeQuery(bplus.snapshot().root!, query);
    expect(left.parentReturns).toBeGreaterThan(0);
    expect(right.parentReturns).toBe(0);
    expect(right.totalPageAccesses).toBeLessThanOrEqual(left.totalPageAccesses);
  });
});
