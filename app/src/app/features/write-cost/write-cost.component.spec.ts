import { TestBed } from '@angular/core/testing';
import { WriteCostComponent } from './write-cost.component';

describe('WriteCostComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WriteCostComponent] }).compileComponents();
  });

  it('reproduces the notebook benchmark and labels the projection', () => {
    const fixture = TestBed.createComponent(WriteCostComponent);
    const component = fixture.componentInstance;

    expect(component.benchmarkResults.slice(0, 4).map(result => result.totalTimeMs)).toEqual([1.3, 55.7, 202.3, 219.2]);
    component.selectIndexCount(4);
    expect(component.selectedBenchmark.projected).toBe(true);
    expect(component.selectedBenchmark.indexedColumns).toContain('alerte');
  });

  it('shows the maximal write spike when the root splits', () => {
    const fixture = TestBed.createComponent(WriteCostComponent);
    const component = fixture.componentInstance;
    component.setSplitStep(5);

    expect(component.currentSplitStep.event).toBe('split-root');
    expect(component.splitCostBars.at(-1)?.value).toBe(8);
    expect(component.currentSplitStep.levels).toHaveLength(3);
  });

  it('changes the recommendation with the workload', () => {
    const fixture = TestBed.createComponent(WriteCostComponent);
    const component = fixture.componentInstance;
    component.selectIndexCount(3);
    component.readShare = 95;
    component.selectivity = 1;
    expect(component.tradeoff.verdict).toBe('favorable');

    component.readShare = 10;
    component.selectivity = 80;
    expect(component.tradeoff.verdict).toBe('unfavorable');
  });

  it('keeps one laboratory active with three contextual metrics', () => {
    const fixture = TestBed.createComponent(WriteCostComponent);
    const component = fixture.componentInstance;

    expect(component.activeTab).toBe('benchmark');
    expect(component.chapterMetrics).toHaveLength(3);

    component.setActiveTab('propagation');
    expect(component.activeTab).toBe('propagation');
    expect(component.chapterMetrics.map(metric => metric.label)).toEqual(['Heap', 'Index', 'Total']);
  });

  it('uses the vertical pedagogical layout with conclusion at end', () => {
    const fixture = TestBed.createComponent(WriteCostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const zones = Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'));

    expect(zones).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.querySelector('[data-chapter-zone="conclusion"]')?.textContent?.length).toBeGreaterThan(0);
  });
});
