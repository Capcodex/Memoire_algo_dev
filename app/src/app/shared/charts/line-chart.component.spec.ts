import { TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LineChartComponent] }).compileComponents();
  });

  it('filters points that would invalidate logarithmic axes', () => {
    const fixture = TestBed.createComponent(LineChartComponent);
    const component = fixture.componentInstance;
    component.logX = true;
    component.logY = true;
    component.series = [{
      id: 'mixed',
      label: 'Mixed',
      points: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 2 },
        { x: Number.NaN, y: 2 },
        { x: 10, y: 5 }
      ]
    }];

    expect(component.invalidPointCount).toBe(4);
    expect(component.normalizedSeries[0].points).toEqual([{ x: 10, y: 5 }]);
    expect([...component.xTicks, ...component.yTicks].every(Number.isFinite)).toBe(true);
    expect(component.linePoints(component.normalizedSeries[0])).not.toMatch(/NaN|Infinity/);
  });

  it('creates a finite domain for a single constant value', () => {
    const fixture = TestBed.createComponent(LineChartComponent);
    const component = fixture.componentInstance;
    component.series = [{ id: 'one', label: 'One', points: [{ x: 5, y: 5 }] }];

    expect(component.xDomain[0]).toBeLessThan(component.xDomain[1]);
    expect(component.yDomain[0]).toBeLessThan(component.yDomain[1]);
    expect(component.xTicks.every(Number.isFinite)).toBe(true);
    expect(component.yTicks.every(Number.isFinite)).toBe(true);
  });

  it('renders a stable SVG frame and an explicit invalid-data state', () => {
    const fixture = TestBed.createComponent(LineChartComponent);
    fixture.componentInstance.logX = true;
    fixture.componentInstance.series = [{ id: 'invalid', label: 'Invalid', points: [{ x: 0, y: 2 }] }];
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('svg')).toBeNull();
    expect(element.textContent).toContain('Aucune donnée compatible');

    fixture.componentRef.setInput('series', [{ id: 'valid', label: 'Valid', points: [{ x: 1, y: 2 }, { x: 10, y: 3 }] }]);
    fixture.detectChanges();
    const svg = element.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 720 360');
    expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(svg?.getAttribute('class')).toContain('min-h-[18rem]');
  });
});
