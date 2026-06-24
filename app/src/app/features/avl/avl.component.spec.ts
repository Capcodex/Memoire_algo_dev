import { TestBed } from '@angular/core/testing';
import { AvlComponent } from './avl.component';

describe('AvlComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvlComponent] }).compileComponents();
  });

  it('explains and animates a double LR rotation', () => {
    const fixture = TestBed.createComponent(AvlComponent);
    const component = fixture.componentInstance;
    component.triggerScenario('LR');
    const finalStep = component.currentSequence?.steps.at(-1);

    expect(component.activeRotationInfo.expectedRotations).toBe(2);
    expect(component.rotationTimeline).toHaveLength(4);
    expect(finalStep?.state.root?.value).toBe(20);
    expect(finalStep?.state.metrics.rotations).toBe(2);
  });

  it('builds the measured BST/AVL comparison', () => {
    const fixture = TestBed.createComponent(AvlComponent);
    const component = fixture.componentInstance;
    component.growthSize = 1_000;
    component.growthOrder = 'chronological';
    component.refreshGrowthExperiments();

    expect(component.finalGrowth?.bstHeight).toBe(999);
    expect(component.finalGrowth?.height).toBe(9);
    expect(component.finalGrowth?.rotations).toBeGreaterThan(0);
    expect(component.finalGrowth?.projected).toBe(false);
    expect(component.growthSeries.map(series => series.id)).toEqual(['bst-measured', 'avl-measured']);
  });

  it('projects one hundred million keys without building the trees', () => {
    const fixture = TestBed.createComponent(AvlComponent);
    const component = fixture.componentInstance;
    component.growthSize = 100_000_000;
    component.growthOrder = 'chronological';
    component.refreshGrowthExperiments();

    expect(component.finalGrowth?.projected).toBe(true);
    expect(component.finalGrowth?.bstHeight).toBe(99_999_999);
    expect(component.growthSeries.map(series => series.id)).toEqual(['bst-measured', 'avl-measured', 'bst-projected', 'avl-projected']);
    expect(component.growthSeries.filter(series => series.dashed)).toHaveLength(2);
  });

  it('compares RAM, SSD and HDD for the same AVL height', () => {
    const fixture = TestBed.createComponent(AvlComponent);
    const component = fixture.componentInstance;
    component.storageExponent = 6;
    component.refreshStorageCosts();

    expect(component.storageAccesses).toBe(29);
    expect(component.storageCosts).toHaveLength(3);
    expect(component.storageCosts[2].totalCostMs).toBeGreaterThan(component.storageCosts[0].totalCostMs);
  });

  it('estimates storage costs up to one billion keys', () => {
    const fixture = TestBed.createComponent(AvlComponent);
    const component = fixture.componentInstance;
    component.storageExponent = 9;
    component.refreshStorageCosts();

    expect(component.storageVolume).toBe(1_000_000_000);
    expect(component.storageAccesses).toBeGreaterThan(40);
    expect(component.storageMetrics.every(metric => metric.projected)).toBe(true);
  });

  it('uses the vertical pedagogical layout with at most four metrics', () => {
    const fixture = TestBed.createComponent(AvlComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const zones = Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'));

    expect(zones).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.querySelector('[data-chapter-zone="conclusion"]')?.textContent?.length).toBeGreaterThan(0);
  });
});
