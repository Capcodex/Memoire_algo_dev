import { Component } from '@angular/core';
import { BarChartComponent } from '../bar-chart.component';
import { BarDatum, ChartSeries } from '../chart.models';
import { LineChartComponent } from '../line-chart.component';

@Component({
  selector: 'app-chart-gallery',
  standalone: true,
  imports: [LineChartComponent, BarChartComponent],
  template: `
    <div class="grid gap-4 xl:grid-cols-2">
      <app-line-chart title="Série vide" [series]="emptySeries" />
      <app-line-chart title="Valeur constante" [series]="constantSeries" />
      <app-line-chart title="Échelle logarithmique filtrée" [series]="invalidLogSeries" [logX]="true" [logY]="true" />
      <app-line-chart title="Grands volumes" [series]="largeSeries" [logX]="true" />
      <app-bar-chart title="Histogramme logarithmique" [data]="logBars" [logScale]="true" />
      <app-bar-chart title="Histogramme invalide" [data]="invalidBars" [logScale]="true" />
    </div>
  `
})
export class ChartGalleryComponent {
  readonly emptySeries: readonly ChartSeries[] = [];
  readonly constantSeries: readonly ChartSeries[] = [
    { id: 'constant', label: 'Constante', points: [{ x: 10, y: 5 }] }
  ];
  readonly invalidLogSeries: readonly ChartSeries[] = [
    { id: 'mixed', label: 'Valide et invalide', points: [{ x: 0, y: 0 }, { x: -1, y: 2 }, { x: 10, y: 3 }, { x: 100, y: 9 }] }
  ];
  readonly largeSeries: readonly ChartSeries[] = [
    { id: 'large', label: 'Très grands volumes', points: [3, 4, 5, 6, 7, 8, 9].map(exponent => ({ x: 10 ** exponent, y: exponent * 1.44 })) }
  ];
  readonly logBars: readonly BarDatum[] = [
    { label: 'RAM', value: 0.0001 }, { label: 'SSD', value: 2 }, { label: 'HDD', value: 200 }
  ];
  readonly invalidBars: readonly BarDatum[] = [
    { label: 'Zéro', value: 0 }, { label: 'Négatif', value: -1 }, { label: 'Non fini', value: Number.NaN }
  ];
}
