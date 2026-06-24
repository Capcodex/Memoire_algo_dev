import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CHART_COLORS, ChartPoint, ChartSeries } from './chart.models';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 p-4" [attr.aria-label]="title">
      <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-semibold text-white">{{ title }}</h3>
          <p *ngIf="subtitle" class="mt-1 text-xs text-slate-400">{{ subtitle }}</p>
        </div>
        <div class="flex flex-wrap gap-3 text-xs text-slate-300" aria-label="Légende">
          <span *ngFor="let item of normalizedSeries; let index = index" class="flex items-center gap-1.5 transition-opacity" [class.opacity-30]="hoveredSeriesIndex !== null && hoveredSeriesIndex !== index" (mouseenter)="hoverSeries(index)" (mouseleave)="hoverSeries(null)">
            <span class="h-2.5 w-2.5 rounded-full" [style.backgroundColor]="seriesColor(item, index)"></span>
            {{ item.label }}
          </span>
        </div>
      </div>

      <p *ngIf="invalidPointCount > 0" class="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        {{ invalidPointCount }} point(s) ignoré(s) car incompatible(s) avec l’échelle sélectionnée.
      </p>

      <div *ngIf="hasData; else emptyState" class="relative min-h-[18rem] w-full overflow-hidden">
        <svg class="block min-h-[18rem] w-full" [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="xMidYMid meet" role="img" (mouseleave)="hideTooltip()">
          <title>{{ title }}</title>
          <desc>{{ subtitle || yLabel + ' selon ' + xLabel }}</desc>

          <g class="text-slate-600">
            <line *ngFor="let tick of yTicks" [attr.x1]="padding.left" [attr.x2]="width - padding.right" [attr.y1]="scaleY(tick)" [attr.y2]="scaleY(tick)" stroke="currentColor" stroke-dasharray="4 6" />
          </g>

          <line [attr.x1]="padding.left" [attr.x2]="padding.left" [attr.y1]="padding.top" [attr.y2]="height - padding.bottom" stroke="#64748b" />
          <line [attr.x1]="padding.left" [attr.x2]="width - padding.right" [attr.y1]="height - padding.bottom" [attr.y2]="height - padding.bottom" stroke="#64748b" />

          <g *ngFor="let tick of yTicks">
            <text [attr.x]="padding.left - 10" [attr.y]="scaleY(tick) + 4" text-anchor="end" fill="#94a3b8" font-size="11">{{ format(tick) }}</text>
          </g>
          <g *ngFor="let tick of xTicks">
            <text [attr.x]="scaleX(tick)" [attr.y]="height - padding.bottom + 20" text-anchor="middle" fill="#94a3b8" font-size="11">{{ format(tick) }}</text>
          </g>

          <g *ngFor="let item of normalizedSeries; let seriesIndex = index" [class.opacity-30]="hoveredSeriesIndex !== null && hoveredSeriesIndex !== seriesIndex" class="transition-opacity duration-300">
            <polyline [attr.points]="linePoints(item)" fill="none" [attr.stroke]="seriesColor(item, seriesIndex)" [attr.stroke-dasharray]="item.dashed ? '9 7' : null" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <circle
              *ngFor="let point of item.points"
              [attr.cx]="scaleX(point.x)"
              [attr.cy]="scaleY(point.y)"
              r="4"
              [attr.fill]="seriesColor(item, seriesIndex)"
              stroke="#0f172a"
              stroke-width="2"
              class="cursor-pointer transition-all duration-200 hover:stroke-white focus:outline-none"
              (mouseenter)="showTooltip($event, point, item, seriesColor(item, seriesIndex))"
            />
          </g>

          <text [attr.x]="width / 2" [attr.y]="height - 8" text-anchor="middle" fill="#94a3b8" font-size="12">{{ xLabel }}</text>
          <text [attr.transform]="'translate(14 ' + height / 2 + ') rotate(-90)'" text-anchor="middle" fill="#94a3b8" font-size="12">{{ yLabel }}</text>
        </svg>

        <div *ngIf="tooltip.visible" class="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-[120%] rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-2xl backdrop-blur-md" [style.left.px]="tooltip.x" [style.top.px]="tooltip.y">
          <div class="mb-1 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full" [style.backgroundColor]="tooltip.color"></span>
            <span class="text-xs font-semibold text-white">{{ tooltip.title }}</span>
          </div>
          <div class="font-mono text-xs text-slate-300">{{ yLabel }}: {{ tooltip.value }}</div>
          <div class="mt-0.5 font-mono text-[0.65rem] text-slate-500">{{ xLabel }}: {{ tooltip.xValue }}</div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-700 px-4 text-center text-sm text-slate-500">
          {{ invalidPointCount > 0 ? 'Aucune donnée compatible avec cette échelle' : 'Aucune donnée à afficher' }}
        </div>
      </ng-template>
    </section>
  `
})
export class LineChartComponent {
  @Input() title = 'Évolution';
  @Input() subtitle = '';
  @Input() xLabel = 'x';
  @Input() yLabel = 'y';
  @Input() series: readonly ChartSeries[] = [];
  @Input() logX = false;
  @Input() logY = false;

  readonly width = 720;
  readonly height = 360;
  readonly padding = { top: 20, right: 24, bottom: 50, left: 64 };

  hoveredSeriesIndex: number | null = null;
  tooltip = { visible: false, x: 0, y: 0, title: '', value: '', xValue: '', color: '' };

  get normalizedSeries(): readonly ChartSeries[] {
    return this.series
      .map(item => ({ ...item, points: item.points.filter(point => this.isRenderablePoint(point)) }))
      .filter(item => item.points.length > 0);
  }

  get invalidPointCount(): number {
    const inputCount = this.series.reduce((sum, item) => sum + item.points.length, 0);
    const renderedCount = this.normalizedSeries.reduce((sum, item) => sum + item.points.length, 0);
    return inputCount - renderedCount;
  }

  get hasData(): boolean {
    return this.normalizedSeries.length > 0;
  }

  get xDomain(): [number, number] {
    return this.domain(this.normalizedSeries.flatMap(item => item.points.map(point => point.x)), false, this.logX);
  }

  get yDomain(): [number, number] {
    return this.domain(this.normalizedSeries.flatMap(item => item.points.map(point => point.y)), !this.logY, this.logY);
  }

  get xTicks(): number[] {
    return this.ticks(this.xDomain, this.logX);
  }

  get yTicks(): number[] {
    return this.ticks(this.yDomain, this.logY);
  }

  hoverSeries(index: number | null): void {
    this.hoveredSeriesIndex = index;
  }

  showTooltip(event: MouseEvent, point: ChartPoint, series: ChartSeries, color: string): void {
    const svgElement = (event.target as SVGElement).ownerSVGElement;
    if (!svgElement) return;
    const rect = svgElement.getBoundingClientRect();
    this.tooltip = {
      visible: true,
      x: this.scaleX(point.x) * (rect.width / this.width),
      y: this.scaleY(point.y) * (rect.height / this.height),
      title: point.label || series.label,
      value: this.format(point.y),
      xValue: this.format(point.x),
      color
    };
    const seriesIndex = this.normalizedSeries.findIndex(item => item.id === series.id);
    this.hoveredSeriesIndex = seriesIndex >= 0 ? seriesIndex : null;
  }

  hideTooltip(): void {
    this.tooltip.visible = false;
    this.hoveredSeriesIndex = null;
  }

  scaleX(value: number): number {
    const [minimum, maximum] = this.xDomain;
    return this.padding.left + this.scaleRatio(value, minimum, maximum, this.logX) * (this.width - this.padding.left - this.padding.right);
  }

  scaleY(value: number): number {
    const [minimum, maximum] = this.yDomain;
    return this.height - this.padding.bottom - this.scaleRatio(value, minimum, maximum, this.logY) * (this.height - this.padding.top - this.padding.bottom);
  }

  linePoints(item: ChartSeries): string {
    return item.points
      .map(point => [this.scaleX(point.x), this.scaleY(point.y)])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
      .map(([x, y]) => `${x},${y}`)
      .join(' ');
  }

  seriesColor(item: ChartSeries, index: number): string {
    return item.color ?? CHART_COLORS[index % CHART_COLORS.length];
  }

  format(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (value !== 0 && (Math.abs(value) >= 1_000_000 || Math.abs(value) < 0.001)) return value.toExponential(1);
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  private isRenderablePoint(point: ChartPoint): boolean {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
    if (this.logX && point.x <= 0) return false;
    if (this.logY && point.y <= 0) return false;
    return true;
  }

  private domain(values: readonly number[], includeZero: boolean, logarithmic: boolean): [number, number] {
    const finiteValues = values.filter(Number.isFinite);
    if (finiteValues.length === 0) return logarithmic ? [1, 10] : [0, 1];
    let minimum = Math.min(...finiteValues);
    let maximum = Math.max(...finiteValues);
    if (includeZero) minimum = Math.min(0, minimum);
    if (minimum === maximum) {
      if (logarithmic) return [minimum / 10, minimum * 10];
      const margin = Math.abs(minimum) * 0.1 || 1;
      minimum = includeZero ? Math.min(0, minimum - margin) : minimum - margin;
      maximum += margin;
    }
    return [minimum, maximum];
  }

  private ticks([minimum, maximum]: [number, number], logarithmic: boolean): number[] {
    if (!logarithmic) return Array.from({ length: 5 }, (_, index) => minimum + ((maximum - minimum) * index) / 4);
    if (minimum <= 0 || maximum <= 0) return [];
    const minimumLog = Math.log10(minimum);
    const maximumLog = Math.log10(maximum);
    return Array.from({ length: 5 }, (_, index) => 10 ** (minimumLog + ((maximumLog - minimumLog) * index) / 4));
  }

  private scaleRatio(value: number, minimum: number, maximum: number, logarithmic: boolean): number {
    if (!Number.isFinite(value) || maximum === minimum) return 0;
    const ratio = logarithmic
      ? (value > 0 && minimum > 0 ? (Math.log10(value) - Math.log10(minimum)) / (Math.log10(maximum) - Math.log10(minimum)) : 0)
      : (value - minimum) / (maximum - minimum);
    return Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  }
}
