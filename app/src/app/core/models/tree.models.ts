export interface TreeNode<T = number> {
  id: string;
  isLeaf: boolean;
}

export interface BinaryTreeNode<T = number> extends TreeNode<T> {
  value: T;
  left?: BinaryTreeNode<T>;
  right?: BinaryTreeNode<T>;
  height?: number; // Useful for AVL
  balanceFactor?: number; // Useful for AVL
}

export interface MultiKeyTreeNode<T = number> extends TreeNode<T> {
  keys: T[];
  children?: MultiKeyTreeNode<T>[];
  nextLeaf?: MultiKeyTreeNode<T>; // Useful for B+Tree leaf chaining
}

export interface TreeMetrics {
  height: number;
  nodeCount: number;
  comparisons: number;
  leafCount?: number;
  internalNodeCount?: number;
  fillRate?: number;
  theoreticalHeightEst?: number;
  avgSearchCostEst?: number;
  rotations?: number;
  splits?: number;
  diskAccessesEst?: number;
  verticalAccesses?: number;
  lateralLeafScans?: number;
  writeCostEst?: number;
}
