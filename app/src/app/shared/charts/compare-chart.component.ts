import { Component, Input } from '@angular/core';
import { ChartSeries } from './chart.models';
import { LineChartComponent } from './line-chart.component';

@Component({
  selector: 'app-compare-chart',
  standalone: true,
  imports: [LineChartComponent],
  template: `
    <app-line-chart
      [title]="title"
      [subtitle]="subtitle"
      [xLabel]="xLabel"
      [yLabel]="yLabel"
      [series]="series"
      [logX]="logX"
      [logY]="logY"
    />
  `
})
export class CompareChartComponent {
  @Input() title = 'Comparaison';
  @Input() subtitle = '';
  @Input() xLabel = 'Paramètre';
  @Input() yLabel = 'Mesure';
  @Input() series: readonly ChartSeries[] = [];
  @Input() logX = false;
  @Input() logY = false;
}
