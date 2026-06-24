import { TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart.component';

describe('BarChartComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BarChartComponent] }).compileComponents();
  });

  it('filters non-finite, negative and zero logarithmic values', () => {
    const fixture = TestBed.createComponent(BarChartComponent);
    const component = fixture.componentInstance;
    component.logScale = true;
    component.data = [
      { label: 'zero', value: 0 },
      { label: 'negative', value: -1 },
      { label: 'nan', value: Number.NaN },
      { label: 'valid', value: 10 }
    ];

    expect(component.invalidValueCount).toBe(3);
    expect(component.normalizedData).toEqual([{ label: 'valid', value: 10 }]);
    expect(component.barHeight(10)).toBe(100);
  });

  it('returns finite heights for constant and large values', () => {
    const fixture = TestBed.createComponent(BarChartComponent);
    const component = fixture.componentInstance;
    component.data = [{ label: 'a', value: 1_000_000 }, { label: 'b', value: 1_000_000 }];

    expect(component.normalizedData.map(item => component.barHeight(item.value)).every(Number.isFinite)).toBe(true);
    expect(component.format(1_000_000)).toContain('e+');
  });

  it('renders an explicit empty state when all logarithmic values are invalid', () => {
    const fixture = TestBed.createComponent(BarChartComponent);
    fixture.componentInstance.logScale = true;
    fixture.componentInstance.data = [{ label: 'zero', value: 0 }];
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucune donnée compatible');
  });
});
