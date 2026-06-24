import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BinarySearchTree } from '../../core/algorithms/bst';
import { BstInsertionOrder, buildBstHeightSamples, generateBstValues, measureBstHeight } from '../../core/experiments/bst-degradation';
import { AnimationSequence, AnimationStep } from '../../core/models/animation.models';
import { BinaryTreeNode, TreeMetrics } from '../../core/models/tree.models';
import { ChapterControlsComponent } from '../../shared/chapter-layout/chapter-controls.component';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { ChartSeries, CompareChartComponent } from '../../shared/charts';
import { AnimationPlayerComponent } from '../../shared/controls/animation-player.component';
import { TreeCanvasComponent } from '../../shared/tree-canvas/tree-canvas.component';
import { TreeLayout, TreeLayoutService } from '../../shared/tree-canvas/tree-layout.service';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

@Component({
  selector: 'app-bst',
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
    PedagogyPanelComponent
  ],
  template: `
    <app-chapter-layout [sidebarControls]="true">
      <div chapter-header class="chapter-header">
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div class="max-w-4xl">
            <p class="chapter-kicker text-rose-400">Partie I · Section 1.2</p>
            <h1 class="mt-1 text-2xl font-bold text-white">Chapitre 1 : du BST idéal au cas pathologique</h1>
            <p class="mt-2 text-sm leading-relaxed text-slate-300">Le BST ordonne les clés, mais ne contrôle pas sa forme. La hauteur obtenue dépend entièrement de leur ordre d’insertion.</p>
          </div>
          <div class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"><strong>Hypothèse :</strong> des clés croissantes transforment le BST en liste chaînée.</div>
        </div>
      </div>

      <app-concept-brief chapter-concept concept="Un BST place les clés inférieures à gauche et les clés supérieures à droite." problemSolved="Il permet de rechercher sans parcourir systématiquement toutes les valeurs." demoQuestion="Observez comment l’ordre d’insertion détermine directement la hauteur de l’arbre." accent="rose" />

      <div chapter-visual class="flex h-full min-h-[30rem] flex-col">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Visualisation principale</p>
            <h2 class="mt-1 text-lg font-semibold text-white">{{ selectedOrderLabel }}</h2>
          </div>
          <span class="rounded-lg bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-300">{{ narrative }}</span>
        </div>
        <div class="h-[32rem]"><app-tree-canvas [layout]="currentLayout" [highlightedNodeIds]="highlightedIds" /></div>
      </div>

      <app-chapter-controls chapter-controls [hasAdvancedControls]="true">
        <label primary-control class="min-w-56 flex-1 text-sm text-slate-300">
          <span class="mb-2 flex justify-between"><span>Nombre de clés n</span><strong class="font-mono text-rose-300">{{ sampleSize }}</strong></span>
          <input type="range" min="5" max="100" step="5" [(ngModel)]="sampleSize" (input)="refreshChart()" class="w-full accent-rose-500" />
        </label>
        <label primary-control class="min-w-56 text-sm text-slate-300">
          <span class="mb-2 block">Ordre d’insertion</span>
          <select [(ngModel)]="insertionOrder" class="glass-input w-full">
            <option value="chronological">Croissant</option><option value="shuffled">Mélangé · seed 42</option><option value="descending">Décroissant</option><option value="iot">Chronologique · exemple du dataset</option>
          </select>
        </label>
        <button primary-control type="button" (click)="runExperiment()" class="glass-button">Construire le BST</button>

        <app-animation-player animation-controls [sequence]="currentSequence" (stepChanged)="onStepChanged($event)" />

        <div advanced-control class="flex min-w-72 flex-1 gap-2">
          <input type="number" [(ngModel)]="inputValue" (keyup.enter)="insertValue()" placeholder="Clé à insérer" class="glass-input min-w-0 flex-1" />
          <button type="button" (click)="insertValue()" class="glass-button-secondary">Insérer</button>
        </div>
        <div advanced-control class="flex min-w-72 flex-1 gap-2">
          <input type="number" [(ngModel)]="searchValue" (keyup.enter)="searchTree()" placeholder="Clé à rechercher" class="glass-input min-w-0 flex-1" />
          <button type="button" (click)="searchTree()" class="glass-button-secondary">Chercher</button>
        </div>
        <button advanced-control type="button" (click)="resetTree()" class="glass-button-secondary">Réinitialiser</button>
      </app-chapter-controls>

      <app-chapter-metrics chapter-metrics [metrics]="chapterMetrics" />

      <div chapter-charts class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
        <app-compare-chart title="Hauteur selon l’ordre d’insertion" subtitle="Le mélange est reproductible avec la seed 42." xLabel="Nombre de clés n" yLabel="Hauteur h" [series]="heightSeries" />
        <div class="space-y-3">
          <article class="metric-tile"><p class="text-xs text-slate-500">Pire cas</p><p class="mt-1 font-mono text-xl font-bold text-rose-300">h = n − 1</p><p class="mt-2 text-xs text-slate-400">{{ sampleSize }} clés donnent une hauteur {{ sampleSize - 1 }}.</p></article>
          <article class="metric-tile"><p class="text-xs text-slate-500">Référence équilibrée</p><p class="mt-1 font-mono text-xl font-bold text-indigo-300">log₂(n)</p><p class="mt-2 text-xs text-slate-400">Pour {{ sampleSize }} clés : environ {{ logarithmicReference }} niveaux.</p></article>
          <article class="metric-tile"><p class="text-xs text-slate-500">Parcours in-order</p><div class="mt-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto"><span *ngFor="let value of inorderValues" class="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">{{ value }}</span><span *ngIf="!inorderValues.length" class="text-xs text-slate-500">Arbre vide</span></div></article>
          <p *ngIf="searchResult !== null" class="rounded-xl border px-3 py-2 text-sm" [ngClass]="searchResult ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'">{{ searchResult ? 'Valeur trouvée sur le chemin surligné.' : 'Valeur absente de l’arbre.' }}</p>
        </div>
      </div>

      <app-pedagogy-panel chapter-conclusion observation="Avec des clés triées, chaque nouvelle valeur rejoint la même branche et la hauteur atteint n − 1." explanation="Le BST impose un ordre entre les clés, mais aucune contrainte d’équilibre entre ses sous-arbres." takeaway="Une recherche coûte O(h). L’AVL devient nécessaire pour garantir que h reste logarithmique." accent="rose" />
    </app-chapter-layout>
  `
})
export class BstComponent {
  private bst = new BinarySearchTree();
  private readonly layoutService = inject(TreeLayoutService);

  inputValue: number | null = null;
  searchValue: number | null = null;
  searchResult: boolean | null = null;
  sampleSize = 20;
  insertionOrder: BstInsertionOrder = 'chronological';
  currentSequence: AnimationSequence<BinaryTreeNode> | null = null;
  currentLayout: TreeLayout = { nodes: [], edges: [], width: 0, height: 0 };
  currentMetrics: TreeMetrics = { height: -1, nodeCount: 0, comparisons: 0 };
  highlightedIds: string[] = [];
  inorderValues: number[] = [];
  narrative = 'Choisissez un ordre puis construisez le BST.';
  heightSeries: readonly ChartSeries[] = [];

  constructor() {
    this.refreshChart();
    this.runExperiment();
  }

  get chapterMetrics(): readonly ChapterMetric[] {
    return [
      { label: 'Clés indexées', value: this.currentMetrics.nodeCount, explanation: 'Nombre de clés actuellement présentes dans le BST.', accent: 'slate' },
      { label: 'Hauteur h', value: Math.max(0, this.currentMetrics.height), unit: 'arêtes', explanation: 'Longueur maximale entre la racine et une feuille.', accent: 'rose' },
      { label: 'Comparaisons', value: this.currentMetrics.comparisons, explanation: 'Clés comparées pendant la dernière opération animée.', accent: 'blue' }
    ];
  }

  get selectedOrderLabel(): string {
    return { chronological: 'Insertion croissante', shuffled: 'Insertion mélangée · seed 42', descending: 'Insertion décroissante', iot: 'Insertion chronologique · exemple du dataset' }[this.insertionOrder];
  }

  get logarithmicReference(): string {
    return Math.log2(this.sampleSize).toFixed(1);
  }

  refreshChart(): void {
    const samples = buildBstHeightSamples(this.sampleSize);
    this.heightSeries = [
      { id: 'chronological', label: 'Chronologique · h = n − 1', color: '#fb7185', points: samples.map(sample => ({ x: sample.n, y: sample.chronological })) },
      { id: 'shuffled', label: 'Mélangé · seed 42', color: '#34d399', points: samples.map(sample => ({ x: sample.n, y: sample.shuffled })) },
      { id: 'logarithmic', label: 'Référence log₂(n)', color: '#818cf8', points: samples.map(sample => ({ x: sample.n, y: sample.logarithmic })) }
    ];
  }

  runExperiment(): void {
    this.bst = new BinarySearchTree();
    const values = generateBstValues(this.sampleSize, this.insertionOrder);
    const steps: AnimationStep<BinaryTreeNode>[] = [];
    values.forEach((value, index) => {
      const finalStep = this.bst.insert(value).steps.at(-1);
      if (finalStep) steps.push({ ...finalStep, description: `Insertion ${index + 1}/${values.length} · ${finalStep.description}` });
    });
    this.currentSequence = { steps };
    this.inorderValues = this.bst.inorderTraversal();
    this.searchResult = null;
    this.narrative = `${this.selectedOrderLabel} · hauteur finale ${measureBstHeight(values)}.`;
    const finalStep = steps.at(-1);
    if (finalStep) this.onStepChanged(finalStep);
  }

  activateIotMode(): void {
    this.insertionOrder = 'iot';
    this.sampleSize = 20;
    this.refreshChart();
    this.runExperiment();
  }

  insertValue(): void {
    if (this.inputValue === null || Number.isNaN(this.inputValue)) return;
    this.currentSequence = this.bst.insert(this.inputValue);
    this.inorderValues = this.bst.inorderTraversal();
    this.searchResult = null;
    this.inputValue = null;
  }

  searchTree(): void {
    if (this.searchValue === null || Number.isNaN(this.searchValue)) return;
    this.searchResult = this.inorderValues.includes(this.searchValue);
    this.currentSequence = this.bst.search(this.searchValue);
  }

  resetTree(): void {
    this.bst = new BinarySearchTree();
    this.currentSequence = null;
    this.currentLayout = { nodes: [], edges: [], width: 0, height: 0 };
    this.currentMetrics = { height: -1, nodeCount: 0, comparisons: 0 };
    this.highlightedIds = [];
    this.inorderValues = [];
    this.searchResult = null;
    this.narrative = 'Arbre réinitialisé.';
  }

  onStepChanged(step: AnimationStep<BinaryTreeNode>): void {
    this.currentLayout = this.layoutService.layoutBinaryTree(step.state.root);
    this.currentMetrics = step.state.metrics;
    this.highlightedIds = step.highlightNodeIds ?? [];
    this.narrative = step.description;
  }
}
