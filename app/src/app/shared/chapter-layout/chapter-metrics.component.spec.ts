import { TestBed } from '@angular/core/testing';
import { ChapterMetricsComponent } from './chapter-metrics.component';

describe('ChapterMetricsComponent', () => {
  it('limits the view to four explained metrics', async () => {
    await TestBed.configureTestingModule({ imports: [ChapterMetricsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ChapterMetricsComponent);
    fixture.componentRef.setInput('metrics', Array.from({ length: 5 }, (_, index) => ({
      label: `Metric ${index}`, value: index, explanation: `Explanation ${index}`, accent: 'blue' as const
    })));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('article')).toHaveLength(4);
    expect(element.textContent).toContain('Seules les quatre métriques');
    expect(element.querySelector('article')?.getAttribute('tabindex')).toBe('0');
  });

  it('marks projected values explicitly', async () => {
    await TestBed.configureTestingModule({ imports: [ChapterMetricsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ChapterMetricsComponent);
    fixture.componentRef.setInput('metrics', [{ label: 'Height', value: 20, unit: 'niveaux', explanation: 'Theoretical estimate', accent: 'amber', projected: true }]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Projection');
  });
});
