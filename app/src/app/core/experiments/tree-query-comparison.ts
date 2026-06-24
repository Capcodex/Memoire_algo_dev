import { MultiKeyTreeNode } from '../models/tree.models';

export type ComparableQueryType = 'point' | 'range-short' | 'range-wide' | 'order-limit' | 'missing';

export interface ComparableQuery {
  id: ComparableQueryType;
  label: string;
  sql: string;
  start?: number;
  end?: number;
  value?: number;
  limit?: number;
}

export interface ComparableQueryResult {
  structure: 'btree' | 'bplustree';
  internalPages: number;
  leafPages: number;
  parentReturns: number;
  resultCount: number;
  results: readonly number[];
  visitedNodeIds: readonly string[];
  totalPageAccesses: number;
}

export const COMPARABLE_QUERIES: readonly ComparableQuery[] = [
  { id: 'point', label: 'Recherche ponctuelle', sql: 'WHERE key = 35', value: 35 },
  { id: 'range-short', label: 'Plage courte', sql: 'WHERE key BETWEEN 30 AND 45', start: 30, end: 45 },
  { id: 'range-wide', label: 'Plage large', sql: 'WHERE key BETWEEN 20 AND 85', start: 20, end: 85 },
  { id: 'order-limit', label: 'Premières clés', sql: 'ORDER BY key LIMIT 12', limit: 12 },
  { id: 'missing', label: 'Clé absente', sql: 'WHERE key = 999', value: 999 }
];

export function evaluateBTreeQuery(root: MultiKeyTreeNode, query: ComparableQuery): ComparableQueryResult {
  const visited = new Set<string>();
  const results: number[] = [];
  let internalPages = 0;
  let leafPages = 0;
  let parentReturns = 0;

  const visit = (node: MultiKeyTreeNode) => {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      if (node.isLeaf) leafPages++;
      else internalPages++;
    }
  };

  if (query.id === 'point' || query.id === 'missing') {
    let node = root;
    const value = query.value!;
    while (true) {
      visit(node);
      let index = 0;
      while (index < node.keys.length && value > node.keys[index]) index++;
      if (index < node.keys.length && node.keys[index] === value) {
        results.push(value);
        break;
      }
      if (node.isLeaf) break;
      node = node.children![index];
    }
  } else {
    const start = query.id === 'order-limit' ? Number.NEGATIVE_INFINITY : query.start!;
    const end = query.id === 'order-limit' ? Number.POSITIVE_INFINITY : query.end!;
    const limit = query.limit ?? Number.POSITIVE_INFINITY;
    const traverse = (node: MultiKeyTreeNode): boolean => {
      visit(node);
      for (let index = 0; index < node.keys.length; index++) {
        if (!node.isLeaf && start <= node.keys[index]) {
          if (traverse(node.children![index])) return true;
          parentReturns++;
        }
        const key = node.keys[index];
        if (key >= start && key <= end) results.push(key);
        if (results.length >= limit || key > end) return true;
      }
      if (!node.isLeaf) {
        if (traverse(node.children![node.keys.length])) return true;
        parentReturns++;
      }
      return results.length >= limit;
    };
    traverse(root);
  }

  return finish('btree', internalPages, leafPages, parentReturns, results, [...visited]);
}

export function evaluateBPlusTreeQuery(root: MultiKeyTreeNode, query: ComparableQuery): ComparableQueryResult {
  const leaves = collectLeaves(root);
  const visited: string[] = [];
  let internalPages = 0;
  let leafPages = 0;
  const results: number[] = [];

  const descend = (value: number): MultiKeyTreeNode => {
    let node = root;
    while (!node.isLeaf) {
      visited.push(node.id);
      internalPages++;
      let index = 0;
      while (index < node.keys.length && value >= node.keys[index]) index++;
      node = node.children![index];
    }
    return node;
  };

  if (query.id === 'point' || query.id === 'missing') {
    const leaf = descend(query.value!);
    visited.push(leaf.id);
    leafPages = 1;
    if (leaf.keys.includes(query.value!)) results.push(query.value!);
  } else {
    const start = query.id === 'order-limit' ? Number.NEGATIVE_INFINITY : query.start!;
    const end = query.id === 'order-limit' ? Number.POSITIVE_INFINITY : query.end!;
    const limit = query.limit ?? Number.POSITIVE_INFINITY;
    const firstLeaf = query.id === 'order-limit' ? leaves[0] : descend(start);
    if (query.id === 'order-limit' && !firstLeaf.isLeaf) throw new Error('La chaîne de feuilles est invalide.');
    let leafIndex = leaves.findIndex(leaf => leaf.id === firstLeaf.id);
    while (leafIndex >= 0 && leafIndex < leaves.length && results.length < limit) {
      const leaf = leaves[leafIndex++];
      visited.push(leaf.id);
      leafPages++;
      for (const key of leaf.keys) {
        if (key > end) return finish('bplustree', internalPages, leafPages, 0, results, visited);
        if (key >= start) results.push(key);
        if (results.length >= limit) break;
      }
    }
  }

  return finish('bplustree', internalPages, leafPages, 0, results, visited);
}

function collectLeaves(root: MultiKeyTreeNode): MultiKeyTreeNode[] {
  if (root.isLeaf) return [root];
  return root.children?.flatMap(collectLeaves) ?? [];
}

function finish(structure: 'btree' | 'bplustree', internalPages: number, leafPages: number, parentReturns: number, results: number[], visitedNodeIds: string[]): ComparableQueryResult {
  return { structure, internalPages, leafPages, parentReturns, resultCount: results.length, results, visitedNodeIds, totalPageAccesses: internalPages + leafPages };
}
