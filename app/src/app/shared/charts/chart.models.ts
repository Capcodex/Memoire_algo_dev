export interface ChartPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  id: string;
  label: string;
  color?: string;
  dashed?: boolean;
  points: readonly ChartPoint[];
}

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export const CHART_COLORS = ['#818cf8', '#34d399', '#fb7185', '#fbbf24', '#a78bfa'] as const;
