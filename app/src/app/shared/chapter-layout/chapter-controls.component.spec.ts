import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChapterControlsComponent } from './chapter-controls.component';

@Component({
  standalone: true,
  imports: [ChapterControlsComponent],
  template: `
    <app-chapter-controls [hasAdvancedControls]="true">
      <button primary-control>Primary</button>
      <button animation-controls>Play</button>
      <button advanced-control>Advanced</button>
    </app-chapter-controls>
  `
})
class ChapterControlsHostComponent {}

describe('ChapterControlsComponent', () => {
  it('keeps advanced controls collapsed by default', async () => {
    await TestBed.configureTestingModule({ imports: [ChapterControlsHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ChapterControlsHostComponent);
    fixture.detectChanges();
    const details = (fixture.nativeElement as HTMLElement).querySelector('details');

    expect(details?.hasAttribute('open')).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Primary');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Play');
  });
});
