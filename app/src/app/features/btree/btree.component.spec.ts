import { TestBed } from '@angular/core/testing';
import { BTreeComponent } from './btree.component';

describe('BTreeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BTreeComponent] }).compileComponents();
  });

  it('animates a split scenario for an odd order', () => {
    const fixture = TestBed.createComponent(BTreeComponent);
    const component = fixture.componentInstance;
    component.order = 5;
    component.changeOrder();
    component.triggerSplitScenario();
    const finalStep = component.currentSequence?.steps.at(-1);

    expect(finalStep?.state.metrics.splits).toBeGreaterThan(0);
    expect(finalStep?.state.metrics.leafCount).toBeGreaterThan(1);
    expect(finalStep?.state.metrics.fillRate).toBeLessThanOrEqual(1);
  });

  it('shows fewer page accesses for a wide B-Tree than for an AVL', () => {
    const fixture = TestBed.createComponent(BTreeComponent);
    const component = fixture.componentInstance;
    component.comparisonSize = 1_000;
    component.comparisonOrder = 50;
    component.refreshComparison();

    expect(component.finalComparison?.btreeHeight).toBeLessThan(component.finalComparison?.avlHeight ?? 0);
    expect(component.finalComparison?.btreePageAccesses).toBeLessThan(component.finalComparison?.avlPageAccesses ?? 0);
    expect(component.pageAccessBars).toHaveLength(2);
  });

  it('builds a deterministic number of shuffled keys', () => {
    const fixture = TestBed.createComponent(BTreeComponent);
    const component = fixture.componentInstance;
    component.order = 7;
    component.insertionCount = 37;
    component.insertionOrder = 'shuffled';
    component.buildTree();

    expect(component.currentSequence?.steps.at(-1)?.description).toContain('Insertion 37/37');
    expect(component.currentMetrics.nodeCount).toBeGreaterThan(1);
    expect(component.currentMetrics.fillRate).toBeGreaterThan(0);
  });

  it('uses the vertical pedagogical layout and exposes only essential metrics', () => {
    const fixture = TestBed.createComponent(BTreeComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const zones = Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'));

    expect(zones).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.querySelector('[data-chapter-zone="conclusion"]')?.textContent?.length).toBeGreaterThan(0);
    expect(element.querySelector('app-disk-page-anatomy')).not.toBeNull();
    expect(element.querySelector('app-tid-heap-link')).not.toBeNull();
  });
});
