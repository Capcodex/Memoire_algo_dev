export interface InsertBenchmarkResult {
  indexCount: number;
  label: string;
  indexedColumns: readonly string[];
  totalTimeMs: number;
  relativeFactor: number;
  millisecondsPerInsert: number;
  projected: boolean;
}

export type SplitEvent = 'normal' | 'full' | 'split-leaf' | 'propagation' | 'split-root';
export type SplitPageStatus = 'normal' | 'full' | 'new';

export interface SplitPageView {
  id: string;
  type: 'internal' | 'leaf';
  keys: readonly number[];
  status: SplitPageStatus;
}

export interface SplitStoryboardStep {
  id: string;
  title: string;
  event: SplitEvent;
  narration: string;
  levels: readonly (readonly SplitPageView[])[];
  heapPages: number;
  indexPages: number;
  costLabel: string;
}

export interface TradeoffEstimate {
  readGain: number;
  writePenalty: number;
  score: number;
  verdict: 'favorable' | 'balanced' | 'unfavorable';
  recommendation: string;
}

const BASELINE_INSERTIONS = 20_000;
const BASELINE_ORDER = 50;
const BASE_TIME_MS = 1.3;
const INDEX_PROFILES = [
  { column: 'capteur_id', incrementalMs: 54.4 },
  { column: 'timestamp_utc', incrementalMs: 146.6 },
  { column: 'valeur', incrementalMs: 16.9 },
  { column: 'alerte', incrementalMs: 13.5 }
] as const;

function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function buildInsertBenchmark(insertCount: number, order = BASELINE_ORDER): InsertBenchmarkResult[] {
  const normalizedCount = Math.max(1, Math.floor(insertCount));
  const scale = normalizedCount / BASELINE_INSERTIONS;
  const splitFactor = Math.sqrt(BASELINE_ORDER / Math.max(3, order));
  const baseTime = BASE_TIME_MS * scale;

  return Array.from({ length: 5 }, (_, indexCount) => {
    const profiles = INDEX_PROFILES.slice(0, indexCount);
    const maintenanceTime = profiles.reduce((sum, profile) => sum + profile.incrementalMs, 0) * scale * splitFactor;
    const totalTimeMs = round(baseTime + maintenanceTime);
    return {
      indexCount,
      label: indexCount === 0 ? 'Table seule' : `${indexCount} index`,
      indexedColumns: profiles.map(profile => profile.column),
      totalTimeMs,
      relativeFactor: round(totalTimeMs / baseTime, 4),
      millisecondsPerInsert: round(totalTimeMs / normalizedCount, 8),
      projected: indexCount === 4
    };
  });
}

export function buildSplitStoryboard(): SplitStoryboardStep[] {
  const page = (id: string, type: 'internal' | 'leaf', keys: number[], status: SplitPageStatus = 'normal'): SplitPageView => ({ id, type, keys, status });
  return [
    {
      id: 'normal', title: 'Insertion normale', event: 'normal',
      narration: 'La clé 20 rejoint une feuille qui dispose encore de place. Une page heap et une page d’index sont écrites.',
      levels: [[page('l0', 'leaf', [10, 20])]], heapPages: 1, indexPages: 1, costLabel: 'Coût régulier'
    },
    {
      id: 'full-leaf', title: 'Feuille pleine', event: 'full',
      narration: 'Avec m=4, la feuille atteint 3 clés sur 3. L’écriture reste normale, mais la prochaine clé provoquera un débordement.',
      levels: [[page('l0', 'leaf', [10, 20, 30], 'full')]], heapPages: 1, indexPages: 1, costLabel: 'Split imminent'
    },
    {
      id: 'leaf-split', title: 'Split de feuille', event: 'split-leaf',
      narration: 'L’insertion de 40 scinde la feuille. Deux pages feuilles sont écrites et la clé 30 est copiée dans une nouvelle racine.',
      levels: [[page('r0', 'internal', [30], 'new')], [page('l0', 'leaf', [10, 20]), page('l1', 'leaf', [30, 40], 'new')]], heapPages: 1, indexPages: 4, costLabel: 'Pic ×4 côté index'
    },
    {
      id: 'parent-propagation', title: 'Propagation au parent', event: 'propagation',
      narration: 'Un nouveau split de feuille copie la médiane 50 dans le parent. La modification touche les feuilles et la page interne.',
      levels: [[page('r0', 'internal', [30, 50], 'new')], [page('l0', 'leaf', [10, 20]), page('l1', 'leaf', [30, 40]), page('l2', 'leaf', [50, 60], 'new')]], heapPages: 1, indexPages: 4, costLabel: 'Propagation sur 2 niveaux'
    },
    {
      id: 'full-root', title: 'Racine pleine', event: 'full',
      narration: 'La racine contient maintenant 3 clés sur 3. Le prochain split de feuille ne pourra plus être absorbé localement.',
      levels: [[page('r0', 'internal', [30, 50, 70], 'full')], [page('l0', 'leaf', [10, 20]), page('l1', 'leaf', [30, 40]), page('l2', 'leaf', [50, 60]), page('l3', 'leaf', [70, 80])]], heapPages: 1, indexPages: 1, costLabel: 'Pic maximal imminent'
    },
    {
      id: 'root-split', title: 'Split de racine', event: 'split-root',
      narration: 'Le split remonte jusqu’à la racine. Une nouvelle racine est créée : c’est le seul événement qui augmente la hauteur du B+Tree.',
      levels: [[page('r1', 'internal', [70], 'new')], [page('i0', 'internal', [30, 50]), page('i1', 'internal', [70, 90], 'new')], [page('l0', 'leaf', [10, 20]), page('l1', 'leaf', [30, 40]), page('l2', 'leaf', [50, 60]), page('l3', 'leaf', [70, 80]), page('l4', 'leaf', [90, 100], 'new')]], heapPages: 1, indexPages: 7, costLabel: 'Pic maximal ×7 côté index'
    }
  ];
}

export function estimateTradeoff(
  readSharePercent: number,
  selectivityPercent: number,
  benchmark: InsertBenchmarkResult
): TradeoffEstimate {
  const readShare = Math.min(100, Math.max(0, readSharePercent)) / 100;
  const writeShare = 1 - readShare;
  const selectivity = Math.min(100, Math.max(0.1, selectivityPercent));
  const readGain = Math.max(1, 100 / selectivity);
  const writePenalty = benchmark.relativeFactor;
  const score = readShare * Math.log10(readGain) - writeShare * Math.log10(writePenalty);
  if (score > 0.25) {
    return { readGain, writePenalty, score, verdict: 'favorable', recommendation: 'Le gain de lecture domine : cet index est cohérent avec la charge simulée.' };
  }
  if (score < -0.25) {
    return { readGain, writePenalty, score, verdict: 'unfavorable', recommendation: 'Les écritures dominent : supprimez ou consolidez les index peu utilisés.' };
  }
  return { readGain, writePenalty, score, verdict: 'balanced', recommendation: 'Le compromis est serré : mesurez les requêtes réelles avant de conserver cet index.' };
}
