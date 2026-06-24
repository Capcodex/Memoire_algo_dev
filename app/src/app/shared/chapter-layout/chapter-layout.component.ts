import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chapter-layout',
  standalone: true,
  template: `
    <div class="demo-page">
      <div class="demo-content">
        <header data-chapter-zone="header"><ng-content select="[chapter-header]" /></header>
        <section data-chapter-zone="concept" aria-label="Repère pédagogique"><ng-content select="[chapter-concept]" /></section>
        <div [class]="sidebarControls ? 'visual-controls-sidebar' : 'visual-controls-stacked'">
          <section data-chapter-zone="visual" class="visual-panel min-h-[30rem] lg:min-h-[36rem]" aria-label="Visualisation principale"><ng-content select="[chapter-visual]" /></section>
          <section data-chapter-zone="controls" aria-label="Paramètres et commandes"><ng-content select="[chapter-controls]" /></section>
        </div>
        <section data-chapter-zone="metrics" aria-label="Métriques essentielles"><ng-content select="[chapter-metrics]" /></section>
        <section data-chapter-zone="charts" aria-label="Comparaisons"><ng-content select="[chapter-charts]" /></section>
        <footer data-chapter-zone="conclusion" aria-label="Conclusion pédagogique"><ng-content select="[chapter-conclusion]" /></footer>
      </div>
    </div>
  `
})
export class ChapterLayoutComponent {
  @Input() sidebarControls = false;
}
