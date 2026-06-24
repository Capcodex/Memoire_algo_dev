import { MultiKeyTreeNode, TreeMetrics } from '../models/tree.models';
import { AnimationSequence, AnimationStep, TreeState } from '../models/animation.models';
import { enrichMultiKeyTreeMetrics } from '../metrics/tree-metrics';

export class BPlusTree {
  protected root: MultiKeyTreeNode;
  protected metrics: TreeMetrics = { height: 0, nodeCount: 1, comparisons: 0, splits: 0, diskAccessesEst: 0 };
  protected nodeCounter = 0;
  protected firstLeaf: MultiKeyTreeNode;
  protected lastRangeResults: number[] = [];

  constructor(public readonly m: number = 5) {
    if (m < 3) throw new Error("L'ordre m doit être au moins 3");
    this.root = this.createNode(true);
    this.firstLeaf = this.root;
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

  protected get minKeysInternal(): number {
    return Math.ceil(this.m / 2) - 1;
  }

  protected cloneNode(node: MultiKeyTreeNode | null): MultiKeyTreeNode | null {
    if (!node) return null;
    return {
      id: node.id,
      isLeaf: node.isLeaf,
      keys: [...node.keys],
      children: node.children?.map(c => this.cloneNode(c)!) ?? [],
      nextLeaf: node.nextLeaf ? {
        id: node.nextLeaf.id,
        isLeaf: true,
        children: [],
        keys: [...node.nextLeaf.keys]
      } : undefined
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

  public getLeafChain(): number[][] {
    const leaves: number[][] = [];
    let leaf: MultiKeyTreeNode | undefined = this.firstLeaf;
    while (leaf) {
      leaves.push([...leaf.keys]);
      leaf = leaf.nextLeaf;
    }
    return leaves;
  }

  public getLastRangeResults(): number[] {
    return [...this.lastRangeResults];
  }

  public insert(value: number): AnimationSequence<MultiKeyTreeNode> {
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    
    steps.push({
      type: 'insert',
      description: `Début de l'insertion de ${value}.`,
      state: this.getState()
    });

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
        description: `Split de la racine. Nouvelle racine créée avec la clé de routage ${splitResult.promotedKey}.`,
        state: this.getState(),
        highlightNodeIds: [this.root.id]
      });
    }

    return { steps };
  }

  protected _insertRecursive(node: MultiKeyTreeNode, value: number, steps: AnimationStep<MultiKeyTreeNode>[]): { promotedKey: number, rightNode: MultiKeyTreeNode } | null {
    if (node.isLeaf) {
      return this._insertLeaf(node, value, steps);
    } else {
      return this._insertInternal(node, value, steps);
    }
  }

  protected _insertLeaf(leaf: MultiKeyTreeNode, value: number, steps: AnimationStep<MultiKeyTreeNode>[]) {
    let i = 0;
    while (i < leaf.keys.length && value > leaf.keys[i]) {
      this.metrics.comparisons++;
      i++;
    }
    this.metrics.comparisons++;
    
    leaf.keys.splice(i, 0, value);
    steps.push({
      type: 'insert',
      description: `Insertion de ${value} dans la feuille.`,
      state: this.getState(),
      highlightNodeIds: [leaf.id]
    });

    if (leaf.keys.length > this.maxKeys) {
      return this._splitLeaf(leaf, steps);
    }
    return null;
  }

  protected _splitLeaf(leaf: MultiKeyTreeNode, steps: AnimationStep<MultiKeyTreeNode>[]) {
    this.metrics.splits = (this.metrics.splits ?? 0) + 1;
    const midIndex = Math.ceil(leaf.keys.length / 2);
    const rightLeaf = this.createNode(true);
    this.metrics.nodeCount++;

    rightLeaf.keys = leaf.keys.splice(midIndex);
    
    // Chaînage
    rightLeaf.nextLeaf = leaf.nextLeaf;
    leaf.nextLeaf = rightLeaf;

    // La clé montante est COPIÉE (reste dans la feuille droite et monte)
    const promotedKey = rightLeaf.keys[0];

    steps.push({
      type: 'split',
      description: `La feuille est pleine. Split ! La clé ${promotedKey} monte comme clé de routage (copie).`,
      state: this.getState(),
      highlightNodeIds: [leaf.id, rightLeaf.id]
    });

    return { promotedKey, rightNode: rightLeaf };
  }

  protected _insertInternal(node: MultiKeyTreeNode, value: number, steps: AnimationStep<MultiKeyTreeNode>[]) {
    let i = 0;
    while (i < node.keys.length && value >= node.keys[i]) {
      this.metrics.comparisons++;
      i++;
    }
    this.metrics.comparisons++;

    steps.push({
      type: 'search',
      description: `Descente vers l'enfant ${i}.`,
      state: this.getState(),
      highlightNodeIds: [node.children![i].id]
    });

    const splitResult = this._insertRecursive(node.children![i], value, steps);

    if (!splitResult) return null;

    // L'enfant a été split, on intègre la clé montante
    node.keys.splice(i, 0, splitResult.promotedKey);
    node.children!.splice(i + 1, 0, splitResult.rightNode);

    steps.push({
      type: 'insert',
      description: `Intégration de la clé montante ${splitResult.promotedKey} dans le nœud interne.`,
      state: this.getState(),
      highlightNodeIds: [node.id]
    });

    if (node.keys.length > this.maxKeys) {
      return this._splitInternal(node, steps);
    }
    return null;
  }

  protected _splitInternal(node: MultiKeyTreeNode, steps: AnimationStep<MultiKeyTreeNode>[]) {
    this.metrics.splits = (this.metrics.splits ?? 0) + 1;
    const midIndex = Math.floor(this.maxKeys / 2);
    const promotedKey = node.keys[midIndex];

    const rightNode = this.createNode(false);
    this.metrics.nodeCount++;

    rightNode.keys = node.keys.splice(midIndex + 1);
    rightNode.children = node.children!.splice(midIndex + 1);
    
    // La clé médiane est DÉPLACÉE (retirée de ce nœud)
    node.keys.splice(midIndex, 1);

    steps.push({
      type: 'split',
      description: `Le nœud interne est plein. Split ! La clé de routage ${promotedKey} monte.`,
      state: this.getState(),
      highlightNodeIds: [node.id, rightNode.id]
    });

    return { promotedKey, rightNode };
  }

  public rangeQuery(start: number, end: number): AnimationSequence<MultiKeyTreeNode> {
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    this.lastRangeResults = [];
    this.metrics.diskAccessesEst = 0;
    this.metrics.verticalAccesses = 0;
    this.metrics.lateralLeafScans = 0;
    
    // 1. Descente pour trouver la première feuille
    let node = this.root;
    while (!node.isLeaf) {
      this.metrics.diskAccessesEst = (this.metrics.diskAccessesEst ?? 0) + 1;
      this.metrics.verticalAccesses = (this.metrics.verticalAccesses ?? 0) + 1;
      let i = 0;
      while (i < node.keys.length && start >= node.keys[i]) i++;
      
      steps.push({
        type: 'traverse',
        description: `Recherche de la plage : Descente verticale...`,
        state: this.getState(),
        highlightNodeIds: [node.id]
      });
      node = node.children![i];
    }
    this.metrics.diskAccessesEst = (this.metrics.diskAccessesEst ?? 0) + 1;
    this.metrics.verticalAccesses = (this.metrics.verticalAccesses ?? 0) + 1;

    // 2. Parcours latéral via le chaînage
    let currentLeaf: MultiKeyTreeNode | undefined = node;
    const results: number[] = [];
    
    while (currentLeaf) {
      this.metrics.lateralLeafScans = (this.metrics.lateralLeafScans ?? 0) + 1;
      steps.push({
        type: 'traverse',
        description: `Scan latéral de la feuille.`,
        state: this.getState(),
        highlightNodeIds: [currentLeaf.id]
      });

      for (const key of currentLeaf.keys) {
        if (key > end) {
          this.lastRangeResults = [...results];
          steps.push({
            type: 'search',
            description: `Clé ${key} > ${end}. Fin de plage : ${results.length} résultat(s).`,
            state: this.getState()
          });
          return { steps };
        }
        if (key >= start) {
          results.push(key);
        }
      }
      currentLeaf = currentLeaf.nextLeaf;
      if (currentLeaf) this.metrics.diskAccessesEst = (this.metrics.diskAccessesEst ?? 0) + 1; // Simule un accès disque pour charger la feuille suivante
    }

    this.lastRangeResults = [...results];
    steps.push({
      type: 'search',
      description: `Fin de la chaîne : ${results.length} résultat(s) trouvés.`,
      state: this.getState()
    });
    return { steps };
  }
}
