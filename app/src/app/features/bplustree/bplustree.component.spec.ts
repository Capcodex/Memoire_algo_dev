import { TestBed } from '@angular/core/testing';
import { BPlusTreeComponent } from './bplustree.component';

describe('BPlusTreeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BPlusTreeComponent] }).compileComponents();
  });

  it('returns the exact IoT timestamp range and access metrics', () => {
    const fixture = TestBed.createComponent(BPlusTreeComponent);
    const component = fixture.componentInstance;
    component.activatePreset('iot');
    component.rangeStart = 1_706;
    component.rangeEnd = 1_720;
    component.executeRangeQuery();

    expect(component.rangeResults).toEqual(Array.from({ length: 15 }, (_, index) => 1_706 + index));
    expect(component.currentMetrics.verticalAccesses).toBeGreaterThan(0);
    expect(component.currentMetrics.lateralLeafScans).toBeGreaterThan(0);
  });

  it('isolates the ordered leaf chain', () => {
    const fixture = TestBed.createComponent(BPlusTreeComponent);
    const component = fixture.componentInstance;
    component.toggleLeafOnly();

    expect(component.followLeavesOnly).toBe(true);
    expect(component.currentLayout.nodes.every(node => node.isLeaf)).toBe(true);
    expect(component.currentLayout.edges.every(edge => edge.isLateral)).toBe(true);
    expect(component.leafChain.flat()).toEqual(Array.from({ length: component.indexSize }, (_, index) => (index + 1) * 5));
  });

  it('uses the vertical layout and exposes only essential metrics', () => {
    const fixture = TestBed.createComponent(BPlusTreeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.chapterMetrics).toHaveLength(3);
    expect(Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'))).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.querySelector('app-same-query-comparator')).not.toBeNull();
    expect(element.querySelector('app-tid-heap-link')).not.toBeNull();
  });
});
