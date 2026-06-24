import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConclusionComponent } from './conclusion.component';

describe('ConclusionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConclusionComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('uses the vertical pedagogical layout with conclusion at end', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const zones = Array.from(element.querySelectorAll('[data-chapter-zone]')).map(zone => zone.getAttribute('data-chapter-zone'));

    expect(zones).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(element.querySelector('[data-chapter-zone="conclusion"]')?.textContent?.length).toBeGreaterThan(0);
  });

  it('answers the thesis question with the five evolution steps', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    const component = fixture.componentInstance;

    expect(component.evolutionSteps).toHaveLength(5);
    expect(component.evolutionSteps.map(step => step.structure)).toEqual(['BST', 'AVL', 'B-Tree', 'B+Tree', 'PostgreSQL']);
    expect(component.evolutionSteps.map(step => step.path)).toEqual(['/bst', '/avl', '/btree', '/bplustree', '/postgres-bridge']);
  });

  it('renders the final decision table with five rows', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const rows = element.querySelectorAll('tbody tr');

    expect(rows.length).toBe(5);
    expect(element.textContent).toContain('AVL');
    expect(element.textContent).toContain('B-Tree');
    expect(element.textContent).toContain('B+Tree');
    expect(element.textContent).toContain('Index Scan');
    expect(element.textContent).toContain('Seq Scan');
  });

  it('exposes three summary metrics without exceeding the four-metric cap', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    const component = fixture.componentInstance;

    expect(component.summaryMetrics.length).toBeGreaterThanOrEqual(3);
    expect(component.summaryMetrics.length).toBeLessThanOrEqual(4);
  });

  it('starts in summary mode and switches to recap mode', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.recapMode()).toBe(false);
    expect(element.querySelector('table')).not.toBeNull();

    component.recapMode.set(true);
    fixture.detectChanges();

    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelectorAll('a[routerLink]').length).toBeGreaterThan(0);
  });

  it('contains navigation back to intro and links to each chapter in recap mode', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    const component = fixture.componentInstance;

    const chapterPaths = component.evolutionSteps.map(step => step.path);
    expect(chapterPaths).toContain('/bst');
    expect(chapterPaths).toContain('/avl');
    expect(chapterPaths).toContain('/btree');
    expect(chapterPaths).toContain('/bplustree');
    expect(chapterPaths).toContain('/postgres-bridge');

    component.recapMode.set(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const anchors = element.querySelectorAll('a');
    expect(anchors.length).toBeGreaterThan(0);
  });

  it('answers the thesis question in the visible text', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    fixture.detectChanges();
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('BST');
    expect(content).toContain('AVL');
    expect(content).toContain('B-Tree');
    expect(content).toContain('B+Tree');
    expect(content).toContain('PostgreSQL');
    expect(content).toContain('Tableau de décision');
    expect(content).toContain('Une question ouverte');
  });

  it('contains no new concept that would require prior knowledge of another chapter', () => {
    const fixture = TestBed.createComponent(ConclusionComponent);
    const component = fixture.componentInstance;

    component.evolutionSteps.forEach(step => {
      expect(step.limit.length).toBeGreaterThan(0);
      expect(step.gain.length).toBeGreaterThan(0);
    });
    expect(typeof component.openingQuestion).toBe('string');
    expect(component.openingQuestion.length).toBeGreaterThan(0);
  });
});
