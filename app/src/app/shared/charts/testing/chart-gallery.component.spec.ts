import { TestBed } from '@angular/core/testing';
import { ChartGalleryComponent } from './chart-gallery.component';

describe('ChartGalleryComponent', () => {
  it('renders every deterministic chart fixture without joining production routes', async () => {
    await TestBed.configureTestingModule({ imports: [ChartGalleryComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ChartGalleryComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('app-line-chart')).toHaveLength(4);
    expect(element.querySelectorAll('app-bar-chart')).toHaveLength(2);
    expect(element.textContent).toContain('Aucune donnée à afficher');
    expect(element.textContent).toContain('point(s) ignoré(s)');
  });
});
