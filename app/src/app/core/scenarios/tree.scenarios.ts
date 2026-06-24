export type AvlRotationCase = 'LL' | 'RR' | 'LR' | 'RL';

export interface TreeScenario {
  id: string;
  label: string;
  description: string;
  values: readonly number[];
}

export const BST_SCENARIOS = {
  chronological: {
    id: 'bst-chronological',
    label: 'Insertion chronologique',
    description: 'Une suite triée qui transforme le BST en liste chaînée.',
    values: [1, 2, 3, 4, 5]
  },
  balanced: {
    id: 'bst-balanced',
    label: 'Insertion équilibrée',
    description: 'Les mêmes valeurs insérées dans un ordre favorable.',
    values: [3, 2, 4, 1, 5]
  },
  iotTimestamps: {
    id: 'bst-iot-timestamps',
    label: 'Timestamps IoT',
    description: 'Des écritures naturellement ordonnées dans le temps.',
    values: [1700, 1701, 1702, 1703, 1704, 1705, 1706]
  }
} as const satisfies Record<string, TreeScenario>;

export const AVL_ROTATION_SCENARIOS: Record<AvlRotationCase, TreeScenario> = {
  LL: {
    id: 'avl-ll',
    label: 'Rotation LL',
    description: 'Une rotation droite corrige le déséquilibre gauche-gauche.',
    values: [30, 20, 10]
  },
  RR: {
    id: 'avl-rr',
    label: 'Rotation RR',
    description: 'Une rotation gauche corrige le déséquilibre droite-droite.',
    values: [10, 20, 30]
  },
  LR: {
    id: 'avl-lr',
    label: 'Rotation LR',
    description: 'Une double rotation corrige le zig-zag gauche-droite.',
    values: [30, 10, 20]
  },
  RL: {
    id: 'avl-rl',
    label: 'Rotation RL',
    description: 'Une double rotation corrige le zig-zag droite-gauche.',
    values: [10, 30, 20]
  }
};

export const BTREE_SCENARIOS = {
  splitCascade: {
    id: 'btree-split-cascade',
    label: 'Cascade de splits',
    description: 'Un lot déterministe qui provoque plusieurs divisions de pages.',
    values: [45, 12, 72, 8, 31, 60, 90, 18, 39, 66]
  }
} as const satisfies Record<string, TreeScenario>;

export const BPLUS_TREE_SCENARIOS = {
  rangeQuery: {
    id: 'bplus-range-query',
    label: 'Index pour requête de plage',
    description: 'Des clés espacées régulièrement pour rendre le scan latéral lisible.',
    values: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]
  }
} as const satisfies Record<string, TreeScenario>;
