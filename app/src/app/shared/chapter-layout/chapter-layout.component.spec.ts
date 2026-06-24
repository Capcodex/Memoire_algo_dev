import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChapterLayoutComponent } from './chapter-layout.component';

@Component({
  standalone: true,
  imports: [ChapterLayoutComponent],
  template: `
    <app-chapter-layout>
      <div chapter-header>Header</div><div chapter-concept>Concept</div><div chapter-visual>Visual</div>
      <div chapter-controls>Controls</div><div chapter-metrics>Metrics</div><div chapter-charts>Charts</div><div chapter-conclusion>Conclusion</div>
    </app-chapter-layout>
  `
})
class ChapterLayoutHostComponent {}

describe('ChapterLayoutComponent', () => {
  it('enforces the pedagogical reading order', async () => {
    await TestBed.configureTestingModule({ imports: [ChapterLayoutHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ChapterLayoutHostComponent);
    fixture.detectChanges();
    const zones = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[data-chapter-zone]'));

    expect(zones.map(zone => zone.getAttribute('data-chapter-zone'))).toEqual(['header', 'concept', 'visual', 'controls', 'metrics', 'charts', 'conclusion']);
    expect(zones.find(zone => zone.getAttribute('data-chapter-zone') === 'visual')?.getAttribute('class')).toContain('min-h-[30rem]');
  });
});
