import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chapter-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="control-panel" aria-label="Paramètres de la démonstration">
      <div class="flex flex-wrap items-end gap-4"><ng-content select="[primary-control]" /></div>
      <div class="mt-4 border-t border-white/10 pt-4"><ng-content select="[animation-controls]" /></div>
      <details *ngIf="hasAdvancedControls" class="mt-4 border-t border-white/10 pt-4">
        <summary class="cursor-pointer text-sm font-semibold text-slate-300">Paramètres avancés</summary>
        <div class="mt-4 flex flex-wrap items-end gap-4"><ng-content select="[advanced-control]" /></div>
      </details>
    </section>
  `
})
export class ChapterControlsComponent {
  @Input() hasAdvancedControls = false;
}
