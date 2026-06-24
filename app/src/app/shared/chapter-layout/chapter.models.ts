export type ChapterAccent = 'rose' | 'orange' | 'amber' | 'emerald' | 'violet' | 'cyan' | 'blue' | 'slate';

export interface ChapterMetric {
  label: string;
  value: string | number;
  unit?: string;
  explanation: string;
  accent: ChapterAccent;
  projected?: boolean;
}
