import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChapterAccent, ChapterMetric } from './chapter.models';

@Component({
  selector: 'app-chapter-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section aria-label="Métriques essentielles">
      <div class="grid gap-3" [ngClass]="gridClass">
        <article *ngFor="let metric of visibleMetrics" class="metric-tile" tabindex="0" [attr.title]="metric.explanation" [attr.aria-label]="metric.label + ' : ' + metric.value + (metric.unit ? ' ' + metric.unit : '') + '. ' + metric.explanation">
          <div class="flex items-start justify-between gap-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ metric.label }}</p>
            <span *ngIf="metric.projected" class="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-300">Projection</span>
          </div>
          <p class="mt-2 text-2xl font-black" [ngClass]="accentClass(metric.accent)">
            {{ metric.value }} <span *ngIf="metric.unit" class="text-sm font-semibold text-slate-400">{{ metric.unit }}</span>
          </p>
          <p class="mt-2 text-xs leading-relaxed text-slate-500">{{ metric.explanation }}</p>
        </article>
      </div>
      <p *ngIf="hasOverflow" class="mt-2 text-xs text-amber-300">Seules les quatre métriques prioritaires sont affichées.</p>
    </section>
  `
})
export class ChapterMetricsComponent {
  @Input() metrics: readonly ChapterMetric[] = [];

  get visibleMetrics(): readonly ChapterMetric[] {
    return this.metrics.slice(0, 4);
  }

  get hasOverflow(): boolean {
    return this.metrics.length > 4;
  }

  get gridClass(): string {
    return this.visibleMetrics.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4';
  }

  accentClass(accent: ChapterAccent): string {
    return {
      rose: 'text-rose-300', orange: 'text-orange-300', amber: 'text-amber-300', emerald: 'text-emerald-300',
      violet: 'text-violet-300', cyan: 'text-cyan-300', blue: 'text-blue-300', slate: 'text-slate-200'
    }[accent];
  }
}
