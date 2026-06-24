import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BarDatum, CHART_COLORS } from './chart.models';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 p-4" [attr.aria-label]="title">
      <h3 class="font-semibold text-white">{{ title }}</h3>
      <p *ngIf="subtitle" class="mt-1 text-xs text-slate-400">{{ subtitle }}</p>
      <p *ngIf="invalidValueCount > 0" class="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        {{ invalidValueCount }} valeur(s) ignorée(s) car incompatible(s) avec l’échelle sélectionnée.
      </p>

      <div *ngIf="normalizedData.length; else emptyState" class="mt-4 flex h-64 items-end gap-3 overflow-hidden border-b border-slate-700 px-2 pt-8">
        <div *ngFor="let item of normalizedData; let index = index" class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span class="text-xs font-semibold text-slate-200">{{ format(item.value) }}</span>
          <div class="w-full max-w-20 rounded-t-lg transition-all duration-300" [style.height.%]="barHeight(item.value)" [style.backgroundColor]="item.color || colors[index % colors.length]" [attr.title]="item.label + ' : ' + format(item.value)"></div>
          <span class="w-full truncate pb-2 text-center text-xs text-slate-400" [attr.title]="item.label">{{ item.label }}</span>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="mt-4 flex min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-700 px-4 text-center text-sm text-slate-500">
          {{ invalidValueCount > 0 ? 'Aucune donnée compatible avec cette échelle' : 'Aucune donnée à afficher' }}
        </div>
      </ng-template>
    </section>
  `
})
export class BarChartComponent {
  @Input() title = 'Comparaison';
  @Input() subtitle = '';
  @Input() data: readonly BarDatum[] = [];
  @Input() logScale = false;

  readonly colors = CHART_COLORS;

  get normalizedData(): readonly BarDatum[] {
    return this.data.filter(item => Number.isFinite(item.value) && item.value >= 0 && (!this.logScale || item.value > 0));
  }

  get invalidValueCount(): number {
    return this.data.length - this.normalizedData.length;
  }

  barHeight(value: number): number {
    if (!Number.isFinite(value) || value < 0 || (this.logScale && value <= 0)) return 0;
    if (!this.logScale) {
      const maximum = Math.max(...this.normalizedData.map(item => item.value), 1);
      return Math.max(2, (value / maximum) * 100);
    }
    const positiveValues = this.normalizedData.map(item => item.value);
    if (positiveValues.length === 0) return 0;
    const minimum = Math.min(...positiveValues);
    const maximum = Math.max(...positiveValues);
    if (minimum === maximum) return 100;
    const position = (Math.log10(value) - Math.log10(minimum)) / (Math.log10(maximum) - Math.log10(minimum));
    return Number.isFinite(position) ? 10 + position * 90 : 0;
  }

  format(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (value !== 0 && (Math.abs(value) >= 1_000_000 || Math.abs(value) < 0.001)) return value.toExponential(1);
    if (Number.isInteger(value)) return value.toString();
    if (Math.abs(value) < 0.01) return value.toFixed(4);
    return value.toFixed(1);
  }
}
