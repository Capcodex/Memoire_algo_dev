import { MultiKeyTreeNode, TreeMetrics } from '../models/tree.models';
import { AnimationSequence, AnimationStep, TreeState } from '../models/animation.models';
import { enrichMultiKeyTreeMetrics } from '../metrics/tree-metrics';

export class BTree {
  protected root: MultiKeyTreeNode;
  protected metrics: TreeMetrics = { height: 0, nodeCount: 1, comparisons: 0, splits: 0 };
  protected nodeCounter = 0;

  constructor(public readonly m: number = 5) {
    if (m < 3) throw new Error("L'ordre m doit être au moins 3");
    this.root = this.createNode(true);
  }

  protected createNode(isLeaf: boolean): MultiKeyTreeNode {
    this.nodeCounter++;
    return {
      id: `node-${this.nodeCounter}`,
      isLeaf,
      keys: [],
      children: []
    };
  }

  protected get maxKeys(): number {
    return this.m - 1;
  }

  protected get minKeys(): number {
    return Math.ceil(this.m / 2) - 1;
  }

  protected cloneNode(node: MultiKeyTreeNode | null): MultiKeyTreeNode | null {
    if (!node) return null;
    return {
      id: node.id,
      isLeaf: node.isLeaf,
      keys: [...node.keys],
      children: node.children?.map(c => this.cloneNode(c)!) ?? [],
      nextLeaf: node.nextLeaf ? { ...node.nextLeaf, children: [], keys: [] } : undefined // shallow copy of nextLeaf link
    };
  }

  protected getState(): TreeState<MultiKeyTreeNode> {
    return {
      root: this.cloneNode(this.root),
      metrics: enrichMultiKeyTreeMetrics(this.root, this.metrics, this.m)
    };
  }

  public snapshot(): TreeState<MultiKeyTreeNode> {
    return this.getState();
  }

  public insert(value: number): AnimationSequence<MultiKeyTreeNode> {
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    const splitResult = this._insertRecursive(this.root, value, steps);

    if (splitResult) {
      const oldRoot = this.root;
      this.root = this.createNode(false);
      this.root.keys = [splitResult.promotedKey];
      this.root.children = [oldRoot, splitResult.rightNode];
      this.metrics.nodeCount++;
      this.metrics.height++;

      steps.push({
        type: 'split',
        description: `Split de la racine : la clé médiane ${splitResult.promotedKey} crée un nouveau niveau.`,
        state: this.getState(),
        highlightNodeIds: [this.root.id, oldRoot.id, splitResult.rightNode.id]
      });
    }
    return { steps };
  }

  protected _insertRecursive(
    node: MultiKeyTreeNode,
    value: number,
    steps: AnimationStep<MultiKeyTreeNode>[]
  ): { promotedKey: number; rightNode: MultiKeyTreeNode } | null {
    if (node.isLeaf) {
      let index = node.keys.length;
      while (index > 0 && value < node.keys[index - 1]) {
        this.metrics.comparisons++;
        index--;
      }
      this.metrics.comparisons++;
      node.keys.splice(index, 0, value);

      steps.push({
        type: 'insert',
        description: `Insertion de ${value} dans la page feuille (${node.keys.length}/${this.maxKeys} clés avant éventuel split).`,
        state: this.getState(),
        highlightNodeIds: [node.id]
      });
      return node.keys.length > this.maxKeys ? this._splitOverflow(node) : null;
    }

    let childIndex = 0;
    while (childIndex < node.keys.length && value > node.keys[childIndex]) {
      this.metrics.comparisons++;
      childIndex++;
    }
    this.metrics.comparisons++;

    steps.push({
      type: 'search',
      description: `La clé ${value} est routée vers l'enfant ${childIndex}.`,
      state: this.getState(),
      highlightNodeIds: [node.children![childIndex].id]
    });

    const child = node.children![childIndex];
    const splitResult = this._insertRecursive(child, value, steps);
    if (splitResult) {
      node.keys.splice(childIndex, 0, splitResult.promotedKey);
      node.children!.splice(childIndex + 1, 0, splitResult.rightNode);
      steps.push({
        type: 'split',
        description: `Split intégré : la médiane ${splitResult.promotedKey} monte dans le parent.`,
        state: this.getState(),
        highlightNodeIds: [node.id, child.id, splitResult.rightNode.id]
      });
    }

    return node.keys.length > this.maxKeys ? this._splitOverflow(node) : null;
  }

  protected _splitOverflow(
    node: MultiKeyTreeNode
  ): { promotedKey: number; rightNode: MultiKeyTreeNode } {
    this.metrics.splits = (this.metrics.splits ?? 0) + 1;
    const middleIndex = Math.floor(node.keys.length / 2);
    const promotedKey = node.keys[middleIndex];
    const rightNode = this.createNode(node.isLeaf);
    this.metrics.nodeCount++;

    rightNode.keys = node.keys.splice(middleIndex + 1);
    node.keys.splice(middleIndex, 1);
    if (!node.isLeaf) {
      rightNode.children = node.children!.splice(middleIndex + 1);
    }

    return { promotedKey, rightNode };
  }

  public search(value: number): AnimationSequence<MultiKeyTreeNode> {
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    this._searchRecursive(this.root, value, steps);
    return { steps };
  }

  protected _searchRecursive(node: MultiKeyTreeNode, value: number, steps: AnimationStep<MultiKeyTreeNode>[]): boolean {
    steps.push({
      type: 'search',
      description: `Recherche de ${value} dans ce nœud.`,
      state: this.getState(),
      highlightNodeIds: [node.id]
    });

    let i = 0;
    while (i < node.keys.length && value > node.keys[i]) {
      this.metrics.comparisons++;
      i++;
    }
    this.metrics.comparisons++;

    if (i < node.keys.length && value === node.keys[i]) {
      steps.push({
        type: 'search',
        description: `Valeur ${value} trouvée !`,
        state: this.getState(),
        highlightNodeIds: [node.id]
      });
      return true;
    }

    if (node.isLeaf) {
      steps.push({
        type: 'search',
        description: `Valeur ${value} non trouvée dans la feuille.`,
        state: this.getState(),
        highlightNodeIds: [node.id]
      });
      return false;
    }

    steps.push({
      type: 'search',
      description: `Descente vers l'enfant ${i}.`,
      state: this.getState(),
      highlightNodeIds: [node.children![i].id]
    });

    return this._searchRecursive(node.children![i], value, steps);
  }
}
