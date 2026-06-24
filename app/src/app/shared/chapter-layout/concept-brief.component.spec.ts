import { TestBed } from '@angular/core/testing';
import { ConceptBriefComponent } from './concept-brief.component';

describe('ConceptBriefComponent', () => {
  it('renders the three oral anchors', async () => {
    await TestBed.configureTestingModule({ imports: [ConceptBriefComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ConceptBriefComponent);
    fixture.componentRef.setInput('concept', 'Un arbre ordonné.');
    fixture.componentRef.setInput('problemSolved', 'Retrouver une clé.');
    fixture.componentRef.setInput('demoQuestion', 'Que devient sa hauteur ?');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Concept');
    expect(text).toContain('Problème résolu');
    expect(text).toContain('À observer');
  });
});
