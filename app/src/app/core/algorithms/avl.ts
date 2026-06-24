import { BinaryTreeNode } from '../models/tree.models';
import { AnimationSequence, AnimationStep } from '../models/animation.models';
import { BinarySearchTree } from './bst';

export class AVLTree extends BinarySearchTree {
  
  // Remplacer l'insertion pour inclure le rééquilibrage récursif
  public override insert(value: number): AnimationSequence<BinaryTreeNode> {
    const steps: AnimationStep<BinaryTreeNode>[] = [];
    const insertion = { node: null as BinaryTreeNode | null, captured: false };
    this.nodeCounter++;

    this.root = this._insertAVL(this.root, value, steps, insertion);
    if (!insertion.captured && insertion.node) {
      steps.push({
        type: 'insert',
        description: `Création du nœud ${value}.`,
        state: this.getState(),
        highlightNodeIds: [insertion.node.id]
      });
    }

    this.metrics.height = this._h(this.root);
    if (steps.length > 0) {
      steps[steps.length - 1] = {
        ...steps[steps.length - 1],
        state: this.getState()
      };
    }
    return { steps };
  }

  private _insertAVL(
    node: BinaryTreeNode | null,
    value: number,
    steps: AnimationStep<BinaryTreeNode>[],
    insertion: { node: BinaryTreeNode | null; captured: boolean }
  ): BinaryTreeNode {
    if (!node) {
      this.metrics.nodeCount++;
      const newNode: BinaryTreeNode = { 
        id: `node-${this.nodeCounter}`, 
        value, 
        isLeaf: true, 
        height: 0, 
        balanceFactor: 0 
      };
      insertion.node = newNode;
      return newNode;
    }

    this.metrics.comparisons++;
    steps.push({
      type: 'search',
      description: `Descente : Comparaison avec ${node.value}`,
      state: this.getState(),
      highlightNodeIds: [node.id]
    });

    if (value < node.value) {
      node.left = this._insertAVL(node.left ?? null, value, steps, insertion);
      node.isLeaf = false;
    } else {
      node.right = this._insertAVL(node.right ?? null, value, steps, insertion);
      node.isLeaf = false;
    }

    if (!insertion.captured && insertion.node) {
      insertion.captured = true;
      steps.push({
        type: 'insert',
        description: `Création du nœud ${value}.`,
        state: this.getState(),
        highlightNodeIds: [insertion.node.id]
      });
    }

    return this._rebalance(node, steps);
  }

  private _h(node: BinaryTreeNode | null): number {
    return node ? (node.height ?? 0) : -1;
  }

  private _updateHeight(node: BinaryTreeNode) {
    node.height = 1 + Math.max(this._h(node.left ?? null), this._h(node.right ?? null));
    node.balanceFactor = this._h(node.left ?? null) - this._h(node.right ?? null);
  }

  private _rotateRight(y: BinaryTreeNode, steps: AnimationStep<BinaryTreeNode>[]): BinaryTreeNode {
    steps.push({
      type: 'rotate',
      description: `Rotation droite autour de ${y.value} : le sous-arbre gauche remonte.`,
      state: this.getState(),
      highlightNodeIds: [y.id, y.left?.id ?? '']
    });

    const x = y.left!;
    y.left = x.right;
    x.right = y;
    this.replaceSubtreeRoot(y, x);

    this._updateHeight(y);
    this._updateHeight(x);
    this.metrics.rotations = (this.metrics.rotations ?? 0) + 1;

    steps.push({
      type: 'rotate',
      description: `Rotation droite terminée. Nouvelle racine locale : ${x.value}.`,
      state: this.getState(),
      highlightNodeIds: [x.id]
    });

    return x;
  }

  private _rotateLeft(x: BinaryTreeNode, steps: AnimationStep<BinaryTreeNode>[]): BinaryTreeNode {
    steps.push({
      type: 'rotate',
      description: `Rotation gauche autour de ${x.value} : le sous-arbre droit remonte.`,
      state: this.getState(),
      highlightNodeIds: [x.id, x.right?.id ?? '']
    });

    const y = x.right!;
    x.right = y.left;
    y.left = x;
    this.replaceSubtreeRoot(x, y);

    this._updateHeight(x);
    this._updateHeight(y);
    this.metrics.rotations = (this.metrics.rotations ?? 0) + 1;

    steps.push({
      type: 'rotate',
      description: `Rotation gauche terminée. Nouvelle racine locale : ${y.value}.`,
      state: this.getState(),
      highlightNodeIds: [y.id]
    });

    return y;
  }

  private _rebalance(node: BinaryTreeNode, steps: AnimationStep<BinaryTreeNode>[]): BinaryTreeNode {
    this._updateHeight(node);
    const bf = node.balanceFactor ?? 0;

    // Cas Gauche trop profond
    if (bf > 1) {
      const leftBf = (node.left?.balanceFactor) ?? 0;
      if (leftBf < 0) {
        steps.push({
          type: 'rotate',
          description: `Cas LR détecté sous ${node.value}. Rotation gauche préparatoire sur ${node.left?.value}.`,
          state: this.getState()
        });
        node.left = this._rotateLeft(node.left!, steps);
      }
      return this._rotateRight(node, steps);
    }

    // Cas Droit trop profond
    if (bf < -1) {
      const rightBf = (node.right?.balanceFactor) ?? 0;
      if (rightBf > 0) {
        steps.push({
          type: 'rotate',
          description: `Cas RL détecté sous ${node.value}. Rotation droite préparatoire sur ${node.right?.value}.`,
          state: this.getState()
        });
        node.right = this._rotateRight(node.right!, steps);
      }
      return this._rotateLeft(node, steps);
    }

    return node;
  }
}
