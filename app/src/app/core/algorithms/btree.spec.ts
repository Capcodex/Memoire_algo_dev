import { MultiKeyTreeNode } from '../models/tree.models';
import { BTree } from './btree';

describe('BTree', () => {
  it.each([3, 4, 5, 6, 7, 8])('preserves B-Tree invariants for order %i', order => {
    const tree = new BTree(order);
    const values = Array.from({ length: 100 }, (_, index) => index + 1);
    values.forEach(value => tree.insert(value));
    const snapshot = tree.snapshot();
    const leafDepths: number[] = [];

    validateNode(snapshot.root!, order, true, 0, leafDepths);
    expect(new Set(leafDepths).size).toBe(1);
    expect(inorder(snapshot.root!)).toEqual(values);
    expect(snapshot.metrics.fillRate).toBeGreaterThan(0);
    expect(snapshot.metrics.leafCount).toBe(leafDepths.length);
  });
});

function validateNode(
  node: MultiKeyTreeNode,
  order: number,
  isRoot: boolean,
  depth: number,
  leafDepths: number[]
): void {
  const minimumKeys = Math.ceil(order / 2) - 1;
  expect(node.keys).toEqual([...node.keys].sort((left, right) => left - right));
  expect(node.keys.length).toBeLessThanOrEqual(order - 1);
  if (!isRoot) expect(node.keys.length).toBeGreaterThanOrEqual(minimumKeys);

  if (node.isLeaf) {
    leafDepths.push(depth);
    expect(node.children ?? []).toHaveLength(0);
    return;
  }

  expect(node.children).toHaveLength(node.keys.length + 1);
  node.children?.forEach(child => validateNode(child, order, false, depth + 1, leafDepths));
}

function inorder(node: MultiKeyTreeNode): number[] {
  if (node.isLeaf) return [...node.keys];
  const values: number[] = [];
  node.keys.forEach((key, index) => {
    values.push(...inorder(node.children![index]), key);
  });
  values.push(...inorder(node.children![node.keys.length]));
  return values;
}
