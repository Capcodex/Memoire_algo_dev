import { BinaryTreeNode } from '../models/tree.models';
import { AVLTree } from './avl';

describe('AVLTree', () => {
  it('captures a newly attached node in the insertion snapshot', () => {
    const tree = new AVLTree();
    tree.insert(30);

    const sequence = tree.insert(20);
    const insertionStep = sequence.steps.find(step => step.type === 'insert');

    expect(insertionStep).toBeDefined();
    expect(findValue(insertionStep?.state.root ?? null, 20)).toBe(true);
  });

  it.each([
    { values: [30, 20, 10], expectedRoot: 20 },
    { values: [10, 20, 30], expectedRoot: 20 },
    { values: [30, 10, 20], expectedRoot: 20 },
    { values: [10, 30, 20], expectedRoot: 20 }
  ])('keeps a coherent final snapshot for $values', ({ values, expectedRoot }) => {
    const tree = new AVLTree();
    let finalRoot: BinaryTreeNode | null = null;

    for (const value of values) {
      const sequence = tree.insert(value);
      finalRoot = sequence.steps.at(-1)?.state.root ?? null;
    }

    expect(finalRoot).not.toBeNull();
    expect(finalRoot!.value).toBe(expectedRoot);
    expect(finalRoot!.left?.value).toBe(10);
    expect(finalRoot!.right?.value).toBe(30);
    expect(finalRoot!.height).toBe(1);
    expect(finalRoot!.balanceFactor).toBe(0);
  });
});

function findValue(node: BinaryTreeNode | null, value: number): boolean {
  if (!node) return false;
  return node.value === value || findValue(node.left ?? null, value) || findValue(node.right ?? null, value);
}
