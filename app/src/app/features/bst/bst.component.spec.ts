import { TestBed } from '@angular/core/testing';
import { BstComponent } from './bst.component';

describe('BstComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BstComponent] }).compileComponents();
  });

  it('builds the pathological tree and its comparative chart', () => {
    const fixture = TestBed.createComponent(BstComponent);
    const component = fixture.componentInstance;
    component.sampleSize = 20;
    component.insertionOrder = 'chronological';
    component.refreshChart();
    component.runExperiment();

    expect(component.currentSequence?.steps).toHaveLength(20);
    expect(component.currentSequence?.steps.at(-1)?.state.metrics.height).toBe(19);
    expect(component.inorderValues).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(component.heightSeries.map(series => series.id)).toEqual(['chronological', 'shuffled', 'logarithmic']);
  });

  it('activates the IoT chronology and exposes search feedback', () => {
    const fixture = TestBed.createComponent(BstComponent);
    const component = fixture.componentInstance;
    component.activateIotMode();
    component.searchValue = 1_710;
    component.searchTree();

    expect(component.insertionOrder).toBe('iot');
    expect(component.inorderValues[0]).toBe(1_701);
    expect(component.searchResult).toBe(true);
    expect(component.currentSequence?.steps.at(-1)?.description).toContain('trouvée');
  });

  it('uses the vertical pedagogical layout without splitters', () => {
    const fixture = TestBed.createComponent(BstComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const zones = Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'));

    expect(zones).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.textContent).not.toContain('Pourquoi le cas IoT est pathologique');
  });
});
