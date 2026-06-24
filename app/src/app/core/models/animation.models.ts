import { TreeMetrics } from './tree.models';

export type AnimationType = 'insert' | 'search' | 'rotate' | 'split' | 'traverse';

export interface TreeState<TNode> {
  root: TNode | null;
  metrics: TreeMetrics;
}

export interface AnimationStep<TNode> {
  type: AnimationType;
  description: string;
  state: TreeState<TNode>;
  highlightNodeIds?: string[];
  highlightEdgeIds?: string[];
}

export interface AnimationSequence<TNode> {
  steps: AnimationStep<TNode>[];
}
