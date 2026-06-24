import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BTree } from '../../core/algorithms/btree';
import { AvlBTreeSample, buildAvlBTreeSamples } from '../../core/experiments/btree-performance';
import { BstInsertionOrder, generateBstValues } from '../../core/experiments/bst-degradation';
import { AnimationSequence, AnimationStep } from '../../core/models/animation.models';
import { MultiKeyTreeNode, TreeMetrics } from '../../core/models/tree.models';
import { BTREE_SCENARIOS } from '../../core/scenarios/tree.scenarios';
import { ChapterControlsComponent } from '../../shared/chapter-layout/chapter-controls.component';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { BarChartComponent, BarDatum, ChartSeries, CompareChartComponent } from '../../shared/charts';
import { AnimationPlayerComponent } from '../../shared/controls/animation-player.component';
import { DiskPageAnatomyComponent } from '../../shared/storage/disk-page-anatomy.component';
import { TidHeapLinkComponent } from '../../shared/storage/tid-heap-link.component';
import { TreeCanvasComponent } from '../../shared/tree-canvas/tree-canvas.component';
import { TreeLayout, TreeLayoutService } from '../../shared/tree-canvas/tree-layout.service';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

@Component({
  selector: 'app-btree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChapterLayoutComponent,
    ConceptBriefComponent,
    ChapterControlsComponent,
    ChapterMetricsComponent,
    TreeCanvasComponent,
    AnimationPlayerComponent,
    CompareChartComponent,
    BarChartComponent,
    DiskPageAnatomyComponent,
    TidHeapLinkComponent,
    PedagogyPanelComponent
  ],
  template: `
    <app-chapter-layout [sidebarControls]="true">
      <div chapter-header class="chapter-header">
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div class="max-w-4xl"><p class="chapter-kicker text-amber-400">Partie II · Section 2.1</p><h1 class="mt-1 text-2xl font-bold text-white">Chapitre 3 : le B-Tree raisonne en pages</h1><p class="mt-2 text-sm leading-relaxed text-slate-300">Plusieurs clés partagent une page. L’ordre m transforme la largeur physique d’une page en faible hauteur d’arbre.</p></div>
          <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"><strong>Ordre m :</strong> au plus m enfants et m − 1 clés par page.</div>
        </div>
      </div>

      <app-concept-brief chapter-concept concept="Un B-Tree regroupe plusieurs clés dans une même page et possède de nombreux enfants." problemSolved="Sa largeur réduit le nombre de pages disque traversées par rapport à un arbre binaire." demoQuestion="Choisissez n et m, puis observez les pages pleines, les médianes promues et les splits." accent="amber" />

      <div chapter-visual class="flex h-full min-h-[30rem] flex-col">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wider text-slate-500">Arbre courant</p><h2 class="mt-1 text-lg font-semibold text-white">{{ currentNarrative }}</h2></div><span class="rounded-lg bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-300">m={{ order }} · insertion {{ insertionCount }} clés</span></div>
        <div class="h-[32rem]"><app-tree-canvas [layout]="currentLayout" [highlightedNodeIds]="highlightedIds" /></div>
      </div>

      <app-chapter-controls chapter-controls [hasAdvancedControls]="true">
        <label primary-control class="min-w-48 text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Ordre m</span><strong class="font-mono text-amber-300">{{ order }}</strong></span><input type="range" min="3" max="12" step="1" [(ngModel)]="order" class="w-full accent-amber-500" /></label>
        <label primary-control class="min-w-48 text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Clés à insérer</span><strong class="font-mono text-amber-300">{{ insertionCount }}</strong></span><input type="range" min="1" max="100" step="1" [(ngModel)]="insertionCount" class="w-full accent-amber-500" /></label>
        <label primary-control class="text-sm text-slate-300"><span class="mb-2 block">Ordre des clés</span><select [(ngModel)]="insertionOrder" class="glass-input"><option value="chronological">Croissant</option><option value="descending">Décroissant</option><option value="shuffled">Mélangé · seed 42</option></select></label>
        <button primary-control type="button" class="glass-button" (click)="buildTree()">Construire</button>
        <app-animation-player animation-controls [sequence]="currentSequence" (stepChanged)="onStepChanged($event)" />
        <div advanced-control class="flex min-w-72 gap-2"><input type="number" [(ngModel)]="inputValue" (keyup.enter)="insertValue()" placeholder="Clé manuelle" class="glass-input min-w-0 flex-1" /><button type="button" class="glass-button-secondary" (click)="insertValue()">Insérer</button></div>
        <button advanced-control type="button" class="glass-button-secondary" (click)="triggerSplitScenario()">Preset cascade de splits</button>
        <button advanced-control type="button" class="glass-button-secondary" (click)="resetTree()">Réinitialiser</button>
      </app-chapter-controls>

      <app-chapter-metrics chapter-metrics [metrics]="chapterMetrics" />

      <div chapter-charts class="space-y-8">
        <section class="space-y-4 border-t border-white/10 pt-6">
          <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p class="chapter-kicker text-amber-400">Comparaison quantitative</p><h2 class="mt-1 text-xl font-bold text-white">AVL contre B-Tree</h2></div><div class="flex gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-3"><label class="min-w-48 text-xs text-slate-300">Volume n <strong class="float-right font-mono text-amber-300">{{ comparisonSize }}</strong><input type="range" min="100" max="10000" step="100" [(ngModel)]="comparisonSize" (input)="refreshComparison()" class="mt-2 w-full accent-amber-500" /></label><label class="min-w-48 text-xs text-slate-300">Ordre m <strong class="float-right font-mono text-amber-300">{{ comparisonOrder }}</strong><input type="range" min="3" max="512" step="1" [(ngModel)]="comparisonOrder" (input)="refreshComparison()" class="mt-2 w-full accent-amber-500" /></label></div></div>
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]"><app-compare-chart title="Hauteur : AVL contre B-Tree" xLabel="Nombre de clés n · échelle log" yLabel="Hauteur h" [logX]="true" [series]="heightSeries" /><app-bar-chart title="Pages lues par recherche" [data]="pageAccessBars" /></div>
        </section>

        <app-disk-page-anatomy />
        <app-tid-heap-link />
      </div>

      <app-pedagogy-panel chapter-conclusion observation="Une page large contient plusieurs clés : augmenter l’ordre réduit fortement le nombre de niveaux traversés." explanation="Une feuille d’index stocke une clé et un TID qui adresse le tuple réel dans une page heap." takeaway="Le B-Tree minimise les pages lues ; le B+Tree spécialise maintenant ses feuilles pour mieux servir les index et les plages." accent="amber" />
    </app-chapter-layout>
  `
})
export class BTreeComponent {
  order = 5;
  insertionCount = 20;
  insertionOrder: Exclude<BstInsertionOrder, 'iot'> = 'chronological';
  private btree = new BTree(this.order);
  private readonly layoutService = inject(TreeLayoutService);
  inputValue: number | null = null;
  currentSequence: AnimationSequence<MultiKeyTreeNode> | null = null;
  currentLayout: TreeLayout = { nodes: [], edges: [], width: 0, height: 0 };
  currentMetrics: TreeMetrics = this.btree.snapshot().metrics;
  highlightedIds: string[] = [];
  currentNarrative = 'Construisez un arbre B-Tree.';

  comparisonSize = 1_000;
  comparisonOrder = 50;
  comparisonInsertionOrder: BstInsertionOrder = 'iot';
  heightSeries: readonly ChartSeries[] = [];
  pageAccessBars: readonly BarDatum[] = [];
  finalComparison: AvlBTreeSample | null = null;

  constructor() { this.buildTree(); this.refreshComparison(); }

  get fillRatePercentage(): number { return Math.round((this.currentMetrics.fillRate ?? 0) * 100); }

  get chapterMetrics(): readonly ChapterMetric[] {
    return [
      { label: 'Ordre m', value: this.order, unit: 'enfants max.', explanation: 'Nombre maximal d’enfants adressables depuis une page.', accent: 'amber' },
      { label: 'Pages traversées', value: this.currentMetrics.nodeCount > 0 ? this.currentMetrics.height + 1 : 0, explanation: 'Pages lues entre la racine et une feuille.', accent: 'emerald' },
      { label: 'Splits', value: this.currentMetrics.splits ?? 0, explanation: 'Pages scindées pendant la construction courante.', accent: 'rose' },
      { label: 'Remplissage', value: this.fillRatePercentage, unit: '%', explanation: 'Part moyenne des emplacements de clés occupés.', accent: 'cyan' }
    ];
  }

  buildTree(): void {
    this.btree = new BTree(this.order);
    const values = generateBstValues(this.insertionCount, this.insertionOrder);
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    values.forEach((value, index) => this.btree.insert(value).steps.forEach(step => steps.push({ ...step, description: `Insertion ${index + 1}/${values.length} · ${step.description}` })));
    this.currentSequence = { steps };
    this.currentNarrative = `${values.length} clés · m=${this.order} · ordre ${this.insertionOrder}.`;
    const finalStep = steps.at(-1);
    if (finalStep) this.onStepChanged(finalStep);
  }

  changeOrder(): void { this.buildTree(); }

  insertValue(): void {
    if (this.inputValue === null || Number.isNaN(this.inputValue)) return;
    this.currentSequence = this.btree.insert(this.inputValue);
    this.inputValue = null;
  }

  insertRandom(): void { this.currentSequence = this.btree.insert(Math.floor(Math.random() * 100)); }

  triggerSplitScenario(): void {
    this.btree = new BTree(this.order);
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    BTREE_SCENARIOS.splitCascade.values.forEach((value, index, values) => this.btree.insert(value).steps.forEach(step => steps.push({ ...step, description: `Insertion ${index + 1}/${values.length} · ${step.description}` })));
    this.currentSequence = { steps };
    const finalStep = steps.at(-1);
    if (finalStep) this.onStepChanged(finalStep);
  }

  resetTree(): void {
    this.btree = new BTree(this.order);
    this.currentSequence = null;
    this.currentLayout = { nodes: [], edges: [], width: 0, height: 0 };
    this.currentMetrics = this.btree.snapshot().metrics;
    this.highlightedIds = [];
    this.currentNarrative = `Nouvel arbre B-Tree d’ordre m=${this.order}.`;
  }

  refreshComparison(): void {
    const samples = buildAvlBTreeSamples(this.comparisonSize, this.comparisonOrder, this.comparisonInsertionOrder);
    this.finalComparison = samples.at(-1) ?? null;
    this.heightSeries = [
      { id: 'avl', label: 'AVL · 1 clé/nœud', color: '#fb7185', points: samples.map(sample => ({ x: sample.n, y: sample.avlHeight })) },
      { id: 'btree', label: `B-Tree · m=${this.comparisonOrder}`, color: '#34d399', points: samples.map(sample => ({ x: sample.n, y: sample.btreeHeight })) }
    ];
    this.pageAccessBars = this.finalComparison ? [{ label: 'AVL', value: this.finalComparison.avlPageAccesses, color: '#fb7185' }, { label: 'B-Tree', value: this.finalComparison.btreePageAccesses, color: '#34d399' }] : [];
  }

  onStepChanged(step: AnimationStep<MultiKeyTreeNode>): void {
    this.currentLayout = this.layoutService.layoutMultiKeyTree(step.state.root, this.order - 1);
    this.currentMetrics = step.state.metrics;
    this.highlightedIds = step.highlightNodeIds ?? [];
    this.currentNarrative = step.description;
  }
}
