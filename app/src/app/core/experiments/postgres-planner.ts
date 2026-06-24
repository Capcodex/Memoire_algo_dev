export type ScanType = 'Index Scan' | 'Bitmap Index Scan' | 'Seq Scan';

export interface PlannerInput {
  tableRows: number;
  selectivityPercent: number;
  randomPageCost: number;
  rowsPerPage?: number;
}

export interface PlannerDecisionEstimate {
  scanType: ScanType;
  estimatedRows: number;
  tablePages: number;
  costs: {
    index: number;
    bitmap: number;
    sequential: number;
  };
  explanation: string;
}

export interface IotColumnScenario {
  id: 'capteur_id' | 'site' | 'alerte' | 'timestamp_utc';
  label: string;
  dataType: string;
  cardinality: string;
  typicalSelectivity: string;
  query: string;
  strategy: string;
  scanType: ScanType;
  accent: 'violet' | 'cyan' | 'rose' | 'amber';
  insight: string;
}

export interface PrefixQueryScenario {
  id: 'sensor' | 'sensor-time' | 'time';
  label: string;
  sql: string;
  constrainedColumns: readonly string[];
  indexUsable: boolean;
  scanType: ScanType;
  explanation: string;
}

const CPU_TUPLE_COST = 0.01;
const SEQUENTIAL_PAGE_COST = 1;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function estimatePlannerDecision(input: PlannerInput): PlannerDecisionEstimate {
  const tableRows = Math.max(1, Math.floor(input.tableRows));
  const selectivity = Math.min(100, Math.max(0.0001, input.selectivityPercent)) / 100;
  const randomPageCost = Math.min(20, Math.max(0.1, input.randomPageCost));
  const rowsPerPage = Math.max(1, input.rowsPerPage ?? 100);
  const tablePages = Math.ceil(tableRows / rowsPerPage);
  const estimatedRows = Math.max(1, Math.round(tableRows * selectivity));
  const treeHeight = Math.max(1, Math.ceil(Math.log(Math.max(tableRows, 2)) / Math.log(200)));
  const touchedPages = tablePages * (1 - Math.exp(-estimatedRows / tablePages));

  const sequential = tablePages * SEQUENTIAL_PAGE_COST + tableRows * CPU_TUPLE_COST;
  const index = treeHeight * randomPageCost + estimatedRows * (randomPageCost + CPU_TUPLE_COST);
  const bitmapStartupCost = 25 * randomPageCost;
  const bitmap = bitmapStartupCost + treeHeight * randomPageCost + touchedPages * 1.5 + estimatedRows * CPU_TUPLE_COST;
  const minimum = Math.min(index, bitmap, sequential);

  let scanType: ScanType;
  let explanation: string;
  if (minimum === index) {
    scanType = 'Index Scan';
    explanation = 'Peu de lignes sont attendues : descendre dans le B+Tree puis lire quelques pages dispersées reste rentable.';
  } else if (minimum === bitmap) {
    scanType = 'Bitmap Index Scan';
    explanation = 'Le résultat est intermédiaire : PostgreSQL regroupe les pages trouvées par l’index avant de consulter le heap.';
  } else {
    scanType = 'Seq Scan';
    explanation = 'Une grande part de la table est attendue : la lecture séquentielle évite une multitude d’accès aléatoires.';
  }

  return {
    scanType,
    estimatedRows,
    tablePages,
    costs: { index: round(index), bitmap: round(bitmap), sequential: round(sequential) },
    explanation
  };
}

export const IOT_COLUMN_SCENARIOS: readonly IotColumnScenario[] = [
  {
    id: 'capteur_id', label: 'capteur_id', dataType: 'INTEGER', cardinality: '50 000 capteurs',
    typicalSelectivity: '0,002 %', query: 'WHERE capteur_id = 12345', strategy: 'Index B+Tree simple',
    scanType: 'Index Scan', accent: 'violet',
    insight: 'Une valeur identifie très peu de relevés : la haute cardinalité rend la recherche ponctuelle idéale pour un index.'
  },
  {
    id: 'site', label: 'site', dataType: 'TEXT / FK', cardinality: '8 sites',
    typicalSelectivity: '≈ 12,5 %', query: "WHERE site = 'Paris'", strategy: 'Index selon la distribution',
    scanType: 'Bitmap Index Scan', accent: 'cyan',
    insight: 'La faible cardinalité ne condamne pas l’index, mais chaque valeur retourne beaucoup de lignes : le planner arbitre.'
  },
  {
    id: 'alerte', label: 'alerte', dataType: 'BOOLEAN', cardinality: '2 valeurs',
    typicalSelectivity: '≈ 2 % TRUE', query: 'WHERE alerte = TRUE', strategy: 'Index partiel WHERE alerte',
    scanType: 'Index Scan', accent: 'rose',
    insight: 'Malgré une cardinalité minimale, la valeur rare est très sélective. Un petit index partiel cible uniquement les alertes.'
  },
  {
    id: 'timestamp_utc', label: 'timestamp_utc', dataType: 'TIMESTAMPTZ', cardinality: 'Quasi unique',
    typicalSelectivity: 'Variable par intervalle', query: 'WHERE timestamp_utc BETWEEN t₁ AND t₂', strategy: 'B+Tree pour les plages',
    scanType: 'Index Scan', accent: 'amber',
    insight: 'L’ordre des feuilles du B+Tree permet de localiser la borne basse puis de parcourir les relevés chronologiquement.'
  }
];

export const PREFIX_QUERY_SCENARIOS: readonly PrefixQueryScenario[] = [
  {
    id: 'sensor', label: 'Première colonne seule', sql: 'WHERE capteur_id = 42',
    constrainedColumns: ['capteur_id'], indexUsable: true, scanType: 'Index Scan',
    explanation: 'Le tri global commence par capteur_id : PostgreSQL peut directement localiser le groupe du capteur 42.'
  },
  {
    id: 'sensor-time', label: 'Les deux colonnes', sql: "WHERE capteur_id = 42\n  AND timestamp_utc > '2024-01-01'",
    constrainedColumns: ['capteur_id', 'timestamp_utc'], indexUsable: true, scanType: 'Index Scan',
    explanation: 'Après avoir trouvé le capteur, l’ordre local sur timestamp_utc permet une recherche de plage efficace.'
  },
  {
    id: 'time', label: 'Deuxième colonne seule', sql: "WHERE timestamp_utc\n  BETWEEN '2024-01-01' AND '2024-06-30'",
    constrainedColumns: ['timestamp_utc'], indexUsable: false, scanType: 'Seq Scan',
    explanation: 'Les timestamps sont triés séparément dans chaque groupe de capteur : aucun ordre global sur la seconde colonne n’existe.'
  }
];
