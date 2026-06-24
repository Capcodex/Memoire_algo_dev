import { BinaryTreeNode, TreeMetrics } from '../models/tree.models';
import { AnimationSequence, AnimationStep, TreeState } from '../models/animation.models';
import { enrichBinaryTreeMetrics } from '../metrics/tree-metrics';

export class BinarySearchTree {
  protected root: BinaryTreeNode | null = null;
  protected metrics: TreeMetrics = { height: -1, nodeCount: 0, comparisons: 0 };
  protected nodeCounter = 0; // Pour générer des IDs uniques

  // Clone complet de l'arbre pour figer un état dans l'animation
  protected cloneNode(node: BinaryTreeNode | null): BinaryTreeNode | null {
    if (!node) return null;
    return {
      id: node.id,
      isLeaf: node.isLeaf,
      value: node.value,
      left: this.cloneNode(node.left ?? null) ?? undefined,
      right: this.cloneNode(node.right ?? null) ?? undefined,
      height: node.height,
      balanceFactor: node.balanceFactor
    };
  }

  protected getState(): TreeState<BinaryTreeNode> {
    return {
      root: this.cloneNode(this.root),
      metrics: enrichBinaryTreeMetrics(this.root, this.metrics)
    };
  }

  public snapshot(): TreeState<BinaryTreeNode> {
    return this.getState();
  }

  protected replaceSubtreeRoot(previousRoot: BinaryTreeNode, nextRoot: BinaryTreeNode): void {
    if (this.root === previousRoot) {
      this.root = nextRoot;
      return;
    }

    const parent = this.findParent(this.root, previousRoot);
    if (parent?.left === previousRoot) parent.left = nextRoot;
    if (parent?.right === previousRoot) parent.right = nextRoot;
  }

  private findParent(
    node: BinaryTreeNode | null,
    target: BinaryTreeNode
  ): BinaryTreeNode | null {
    if (!node) return null;
    if (node.left === target || node.right === target) return node;
    return this.findParent(node.left ?? null, target) ?? this.findParent(node.right ?? null, target);
  }

  /**
   * Insertion itérative avec capture des états intermédiaires
   */
  public insert(value: number): AnimationSequence<BinaryTreeNode> {
    const steps: AnimationStep<BinaryTreeNode>[] = [];
    this.nodeCounter++;
    const newNode: BinaryTreeNode = { id: `node-${this.nodeCounter}`, value, isLeaf: true };

    if (!this.root) {
      this.root = newNode;
      this.metrics.nodeCount++;
      this.metrics.height = 0;
      steps.push({
        type: 'insert',
        description: `L'arbre est vide. Insertion de ${value} à la racine.`,
        state: this.getState(),
        highlightNodeIds: [newNode.id]
      });
      return { steps };
    }

    let current = this.root;
    let depth = 0;

    while (true) {
      depth++;
      this.metrics.comparisons++;
      steps.push({
        type: 'search',
        description: `Descente : Comparaison de ${value} avec ${current.value}`,
        state: this.getState(),
        highlightNodeIds: [current.id]
      });

      if (value < current.value) {
        if (!current.left) {
          current.isLeaf = false;
          current.left = newNode;
          this.metrics.nodeCount++;
          this.metrics.height = Math.max(this.metrics.height, depth);
          steps.push({
            type: 'insert',
            description: `${value} < ${current.value} : Insertion de ${value} à gauche.`,
            state: this.getState(),
            highlightNodeIds: [newNode.id]
          });
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.isLeaf = false;
          current.right = newNode;
          this.metrics.nodeCount++;
          this.metrics.height = Math.max(this.metrics.height, depth);
          steps.push({
            type: 'insert',
            description: `${value} >= ${current.value} : Insertion de ${value} à droite.`,
            state: this.getState(),
            highlightNodeIds: [newNode.id]
          });
          break;
        }
        current = current.right;
      }
    }

    return { steps };
  }

  /**
   * Recherche avec capture des états intermédiaires
   */
  public search(value: number): AnimationSequence<BinaryTreeNode> {
    const steps: AnimationStep<BinaryTreeNode>[] = [];
    let current = this.root;
    
    while (current) {
      this.metrics.comparisons++;
      steps.push({
        type: 'search',
        description: `Recherche de ${value} : comparaison avec ${current.value}`,
        state: this.getState(),
        highlightNodeIds: [current.id]
      });
      
      if (value === current.value) {
        steps.push({
          type: 'search',
          description: `Valeur ${value} trouvée !`,
          state: this.getState(),
          highlightNodeIds: [current.id]
        });
        return { steps };
      }
      
      if (value < current.value) {
        current = current.left ?? null;
      } else {
        current = current.right ?? null;
      }
    }
    
    steps.push({
      type: 'search',
      description: `Fin de branche atteinte : valeur ${value} non trouvée.`,
      state: this.getState(),
    });
    return { steps };
  }

  /**
   * Parcours in-order (récursif classique) sans animation détaillée,
   * utilisé principalement pour afficher les données triées en un bloc.
   */
  public inorderTraversal(): number[] {
    const result: number[] = [];
    this._inorder(this.root, result);
    return result;
  }

  private _inorder(node: BinaryTreeNode | null, result: number[]) {
    if (!node) return;
    this._inorder(node.left ?? null, result);
    result.push(node.value);
    this._inorder(node.right ?? null, result);
  }
}
