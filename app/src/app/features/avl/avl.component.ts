import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AVLTree } from '../../core/algorithms/avl';
import { StorageCost, StorageMedium, TreeGrowthSample, buildTreeGrowthSamples, estimateAvlStorageCosts } from '../../core/experiments/avl-performance';
import { BstInsertionOrder } from '../../core/experiments/bst-degradation';
import { AnimationSequence, AnimationStep } from '../../core/models/animation.models';
import { BinaryTreeNode, TreeMetrics } from '../../core/models/tree.models';
import { AVL_ROTATION_SCENARIOS, AvlRotationCase } from '../../core/scenarios/tree.scenarios';
import { ChapterControlsComponent } from '../../shared/chapter-layout/chapter-controls.component';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { BarChartComponent, BarDatum, ChartSeries, CompareChartComponent } from '../../shared/charts';
import { AnimationPlayerComponent } from '../../shared/controls/animation-player.component';
import { TreeCanvasComponent } from '../../shared/tree-canvas/tree-canvas.component';
import { TreeLayout, TreeLayoutService } from '../../shared/tree-canvas/tree-layout.service';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

interface RotationInfo {
  label: string;
  pattern: string;
  imbalance: string;
  correction: string;
  expectedRotations: number;
}

const ROTATION_INFO: Record<AvlRotationCase, RotationInfo> = {
  LL: { label: 'Gauche-gauche', pattern: '30 → 20 → 10', imbalance: 'BF(racine) = +2', correction: 'Une rotation droite', expectedRotations: 1 },
  RR: { label: 'Droite-droite', pattern: '10 → 20 → 30', imbalance: 'BF(racine) = -2', correction: 'Une rotation gauche', expectedRotations: 1 },
  LR: { label: 'Gauche-droite', pattern: '30 → 10 → 20', imbalance: 'BF = +2 avec zig-zag', correction: 'Gauche puis droite', expectedRotations: 2 },
  RL: { label: 'Droite-gauche', pattern: '10 → 30 → 20', imbalance: 'BF = -2 avec zig-zag', correction: 'Droite puis gauche', expectedRotations: 2 }
};

@Component({
  selector: 'app-avl',
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
    PedagogyPanelComponent
  ],
  template: `
    <app-chapter-layout [sidebarControls]="true">
      <div chapter-header class="chapter-header">
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div class="max-w-4xl">
            <p class="chapter-kicker text-orange-400">Partie I · Sections 1.3 et 1.4</p>
            <h1 class="mt-1 text-2xl font-bold text-white">Chapitre 2 : garantir la hauteur, puis changer d’unité de coût</h1>
            <p class="mt-2 text-sm leading-relaxed text-slate-300">L’AVL corrige la dégénérescence par rotations. Cette garantie suffit en RAM, mais chaque niveau reste potentiellement une page à lire sur disque.</p>
          </div>
          <div class="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100"><strong>Invariant :</strong> chaque facteur d’équilibre reste dans [−1, 1].</div>
        </div>
      </div>

      <app-concept-brief chapter-concept concept="Un AVL est un BST qui limite à 1 l’écart de hauteur entre les sous-arbres." problemSolved="Les rotations empêchent la dégénérescence linéaire observée avec des clés ordonnées." demoQuestion="Suivez le déséquilibre, la rotation puis la hauteur obtenue après correction." accent="orange" />

      <div chapter-visual class="flex h-full min-h-[30rem] flex-col">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><p class="text-xs font-bold uppercase tracking-wider text-slate-500">Rotation {{ activeRotationCase }}</p><h2 class="mt-1 text-lg font-semibold text-white">{{ activeRotationInfo.label }} · {{ activeRotationInfo.pattern }}</h2></div>
          <span class="rounded-lg bg-orange-500/10 px-3 py-1.5 font-mono text-xs text-orange-300">{{ activeRotationInfo.imbalance }} → {{ activeRotationInfo.correction }}</span>
        </div>
        <div class="h-[32rem]"><app-tree-canvas [layout]="currentLayout" [highlightedNodeIds]="highlightedIds" /></div>
        <div class="mt-3 flex flex-wrap gap-2"><span *ngFor="let factor of balanceFactors" class="rounded-lg border border-orange-500/20 bg-orange-500/10 px-2 py-1 font-mono text-xs text-orange-200">{{ factor.value }} : BF {{ factor.balanceFactor }}</span></div>
      </div>

      <app-chapter-controls chapter-controls [hasAdvancedControls]="true">
        <button *ngFor="let rotationCase of rotationCases" primary-control type="button" (click)="triggerScenario(rotationCase)" class="min-w-32 rounded-xl border px-4 py-3 text-left transition" [ngClass]="activeRotationCase === rotationCase ? 'border-orange-400 bg-orange-500/15 text-white' : 'border-white/10 bg-slate-900/60 text-slate-300'">
          <span class="font-mono text-xs font-bold text-orange-300">{{ rotationCase }}</span><span class="mt-1 block text-sm font-semibold">{{ rotationInfo(rotationCase).label }}</span>
        </button>
        <app-animation-player animation-controls [sequence]="currentSequence" (stepChanged)="onStepChanged($event)" />
        <div advanced-control class="flex min-w-72 gap-2"><input type="number" [(ngModel)]="inputValue" (keyup.enter)="insertValue()" placeholder="Clé libre" class="glass-input min-w-0 flex-1" /><button type="button" (click)="insertValue()" class="glass-button-secondary">Insérer</button></div>
        <ol advanced-control class="min-w-80 flex-1 space-y-2 text-sm text-slate-300"><li *ngFor="let phase of rotationTimeline; let index = index" class="flex gap-2"><span class="font-mono text-orange-300">{{ index + 1 }}.</span><span>{{ phase }}</span></li></ol>
      </app-chapter-controls>

      <app-chapter-metrics chapter-metrics [metrics]="chapterMetrics" />

      <div chapter-charts class="space-y-6">
        <section class="space-y-4 border-t border-white/10 pt-6">
          <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div><p class="chapter-kicker text-emerald-400">Comparaison sur gros volumes</p><h2 class="mt-1 text-xl font-bold text-white">BST contre AVL</h2><p class="mt-1 text-sm text-slate-400">Les traits pleins sont mesurés ; les traits pointillés sont projetés au-delà de 10 000 clés.</p></div>
            <div class="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <label class="text-xs text-slate-300">Volume maximal<select [(ngModel)]="growthSize" (change)="refreshGrowthExperiments()" class="glass-input ml-2"><option [ngValue]="1000">1 000</option><option [ngValue]="1000000">1 million</option><option [ngValue]="100000000">100 millions</option></select></label>
              <label class="text-xs text-slate-300">Ordre<select [(ngModel)]="growthOrder" (change)="refreshGrowthExperiments()" class="glass-input ml-2"><option value="chronological">Croissant</option><option value="shuffled">Mélangé</option><option value="descending">Décroissant</option><option value="iot">Chronologique · dataset</option></select></label>
            </div>
          </div>
          <app-compare-chart title="Hauteur réelle puis projetée" subtitle="Même volume et même ordre d’insertion pour les deux structures." xLabel="Nombre de clés n · échelle log" yLabel="Hauteur h" [logX]="true" [logY]="true" [series]="growthSeries" />
          <app-chapter-metrics [metrics]="growthMetrics" />
        </section>

        <section class="space-y-4 border-t border-white/10 pt-6">
          <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div><p class="chapter-kicker text-amber-400">Section 1.4 · RAM contre disque</p><h2 class="mt-1 text-xl font-bold text-white">Même AVL, coût physique différent</h2><p class="mt-1 text-sm text-slate-400">La hauteur reste logarithmique, mais une visite de nœud ne coûte pas la même chose selon le support.</p></div>
            <div class="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <label class="min-w-56 text-xs text-slate-300"><span class="mb-2 flex justify-between"><span>Volume indexé</span><strong class="font-mono text-amber-300">10^{{ storageExponent }}</strong></span><input type="range" min="3" max="9" step="1" [(ngModel)]="storageExponent" (input)="refreshStorageCosts()" class="w-full accent-amber-500" /></label>
              <label class="text-xs text-slate-300">Support<select [(ngModel)]="selectedMedium" class="glass-input ml-2"><option value="ram">RAM</option><option value="ssd">SSD</option><option value="hdd">HDD</option></select></label>
              <div class="text-sm"><span class="text-slate-500">Coût sélectionné</span><p class="font-bold text-amber-300">{{ formatCost(selectedStorageCost?.totalCostMs ?? 0) }}</p></div>
            </div>
          </div>
          <app-bar-chart title="Temps estimé d’une recherche AVL" subtitle="Même nombre d’accès, échelle logarithmique, supports différents." [data]="storageBars" [logScale]="true" />
          <app-chapter-metrics [metrics]="storageMetrics" />
        </section>
      </div>

      <app-pedagogy-panel chapter-conclusion observation="L’AVL conserve une hauteur logarithmique, même lorsque les clés arrivent déjà ordonnées." explanation="Les rotations contrôlent la hauteur, mais un arbre binaire visite encore une page potentielle par niveau sur disque." takeaway="Pour réduire les entrées-sorties, il faut élargir les nœuds et regrouper plusieurs clés dans une page B-Tree." accent="orange" />
    </app-chapter-layout>
  `
})
export class AvlComponent {
  private avl = new AVLTree();
  private readonly layoutService = inject(TreeLayoutService);

  readonly rotationCases: readonly AvlRotationCase[] = ['LL', 'RR', 'LR', 'RL'];
  inputValue: number | null = null;
  activeRotationCase: AvlRotationCase | null = 'LL';
  currentSequence: AnimationSequence<BinaryTreeNode> | null = null;
  currentLayout: TreeLayout = { nodes: [], edges: [], width: 0, height: 0 };
  currentMetrics: TreeMetrics = { height: -1, nodeCount: 0, comparisons: 0, rotations: 0 };
  highlightedIds: string[] = [];
  balanceFactors: { value: number; balanceFactor: number }[] = [];
  rotationTimeline: string[] = [];

  growthSize = 1_000_000;
  growthOrder: BstInsertionOrder = 'chronological';
  growthSamples: readonly TreeGrowthSample[] = [];
  growthSeries: readonly ChartSeries[] = [];
  finalGrowth: TreeGrowthSample | null = null;

  storageExponent = 6;
  selectedMedium: StorageMedium = 'ram';
  storageCosts: StorageCost[] = [];
  storageBars: readonly BarDatum[] = [];
  storageEstimateHeight = '0';
  storageAccesses = 0;

  constructor() {
    this.triggerScenario('LL');
    this.refreshGrowthExperiments();
    this.refreshStorageCosts();
  }

  get chapterMetrics(): readonly ChapterMetric[] {
    return [
      { label: 'Hauteur h', value: Math.max(0, this.currentMetrics.height), unit: 'arêtes', explanation: 'Hauteur de l’AVL après la dernière étape.', accent: 'emerald' },
      { label: 'BF maximal', value: this.maximumBalanceFactor, explanation: 'Plus grande valeur absolue du facteur d’équilibre visible.', accent: 'orange' },
      { label: 'Rotations', value: this.currentMetrics.rotations ?? 0, explanation: 'Rotations effectuées pendant la construction animée.', accent: 'amber' }
    ];
  }

  get growthMetrics(): readonly ChapterMetric[] {
    return [
      { label: 'Hauteur BST', value: this.finalGrowth?.bstHeight ?? 0, explanation: 'Hauteur du BST pour le volume et l’ordre sélectionnés.', accent: 'rose', projected: this.finalGrowth?.projected },
      { label: 'Hauteur AVL', value: this.finalGrowth?.height ?? 0, explanation: 'Hauteur équilibrée de l’AVL pour les mêmes clés.', accent: 'emerald', projected: this.finalGrowth?.projected },
      { label: 'Écart de hauteur', value: (this.finalGrowth?.bstHeight ?? 0) - (this.finalGrowth?.height ?? 0), explanation: 'Niveaux évités par l’équilibrage AVL.', accent: 'violet', projected: this.finalGrowth?.projected }
    ];
  }

  get storageMetrics(): readonly ChapterMetric[] {
    return [
      { label: 'Volume', value: this.storageVolumeLabel, unit: 'clés', explanation: 'Nombre de clés couvertes par l’estimation.', accent: 'slate', projected: true },
      { label: 'Hauteur majorée', value: this.storageEstimateHeight, unit: 'niveaux', explanation: 'Borne 1,44 × log₂(n) utilisée pour le coût.', accent: 'amber', projected: true },
      { label: 'Accès', value: this.storageAccesses, unit: 'nœuds', explanation: 'Nombre de nœuds potentiellement visités pendant une recherche.', accent: 'orange', projected: true }
    ];
  }

  get maximumBalanceFactor(): number {
    return Math.max(0, ...this.balanceFactors.map(item => Math.abs(item.balanceFactor)));
  }

  get activeRotationInfo(): RotationInfo {
    return ROTATION_INFO[this.activeRotationCase ?? 'LL'];
  }

  get storageVolume(): number {
    return 10 ** this.storageExponent;
  }

  get storageVolumeLabel(): string {
    return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 0 }).format(this.storageVolume);
  }

  get selectedStorageCost(): StorageCost | undefined {
    return this.storageCosts.find(cost => cost.medium === this.selectedMedium);
  }

  rotationInfo(rotationCase: AvlRotationCase): RotationInfo {
    return ROTATION_INFO[rotationCase];
  }

  triggerScenario(type: AvlRotationCase): void {
    this.avl = new AVLTree();
    this.activeRotationCase = type;
    const scenario = AVL_ROTATION_SCENARIOS[type];
    const steps: AnimationStep<BinaryTreeNode>[] = [];
    scenario.values.forEach(value => steps.push(...this.avl.insert(value).steps));
    this.currentSequence = { steps };
    this.rotationTimeline = [
      `Insérer les clés dans l’ordre ${scenario.values.join(' → ')}.`,
      `Mesurer le déséquilibre : ${ROTATION_INFO[type].imbalance}.`,
      `Appliquer la correction : ${ROTATION_INFO[type].correction.toLowerCase()}.`,
      `Vérifier ${ROTATION_INFO[type].expectedRotations} rotation(s) et tous les BF dans [−1, 1].`
    ];
    const finalStep = steps.at(-1);
    if (finalStep) this.onStepChanged(finalStep);
  }

  insertValue(): void {
    if (this.inputValue === null || Number.isNaN(this.inputValue)) return;
    this.activeRotationCase = null;
    this.currentSequence = this.avl.insert(this.inputValue);
    this.rotationTimeline = [`Insertion de ${this.inputValue}.`, 'Recalcul des hauteurs.', 'Rotation si |BF| > 1.', 'Invariant AVL restauré.'];
    this.inputValue = null;
  }

  refreshGrowthExperiments(): void {
    const samples = buildTreeGrowthSamples(this.growthSize, this.growthOrder);
    this.growthSamples = samples;
    this.finalGrowth = samples.at(-1) ?? null;
    const measured = samples.filter(sample => !sample.projected);
    const projected = samples.filter(sample => sample.projected);
    const boundary = measured.at(-1);
    const projectedWithBoundary = boundary && projected.length ? [boundary, ...projected] : projected;
    this.growthSeries = [
      { id: 'bst-measured', label: 'BST mesuré', color: '#fb7185', points: measured.map(sample => ({ x: sample.n, y: sample.bstHeight, label: 'Mesuré' })) },
      { id: 'avl-measured', label: 'AVL mesuré', color: '#34d399', points: measured.map(sample => ({ x: sample.n, y: sample.height, label: 'Mesuré' })) },
      { id: 'bst-projected', label: 'BST projeté', color: '#fb7185', dashed: true, points: projectedWithBoundary.map(sample => ({ x: sample.n, y: sample.bstHeight, label: sample.projected ? 'Projection' : 'Seuil mesuré' })) },
      { id: 'avl-projected', label: 'AVL projeté', color: '#34d399', dashed: true, points: projectedWithBoundary.map(sample => ({ x: sample.n, y: sample.height, label: sample.projected ? 'Projection' : 'Seuil mesuré' })) }
    ].filter(series => series.points.length > 0);
  }

  refreshStorageCosts(): void {
    const estimate = estimateAvlStorageCosts(this.storageVolume);
    this.storageCosts = estimate.costs;
    this.storageEstimateHeight = estimate.estimatedHeight.toFixed(1);
    this.storageAccesses = estimate.accesses;
    this.storageBars = estimate.costs.map(cost => ({ label: cost.medium.toUpperCase(), value: cost.totalCostMs, color: { ram: '#34d399', ssd: '#fbbf24', hdd: '#fb7185' }[cost.medium] }));
  }

  formatCost(milliseconds: number): string {
    if (milliseconds < 0.001) return `${(milliseconds * 1_000_000).toFixed(0)} ns`;
    if (milliseconds < 1) return `${(milliseconds * 1_000).toFixed(1)} µs`;
    if (milliseconds < 1_000) return `${milliseconds.toFixed(1)} ms`;
    return `${(milliseconds / 1_000).toFixed(2)} s`;
  }

  onStepChanged(step: AnimationStep<BinaryTreeNode>): void {
    this.currentLayout = this.layoutService.layoutBinaryTree(step.state.root);
    this.currentMetrics = step.state.metrics;
    this.highlightedIds = step.highlightNodeIds ?? [];
    this.balanceFactors = this.collectBalanceFactors(step.state.root);
  }

  private collectBalanceFactors(node: BinaryTreeNode | null): { value: number; balanceFactor: number }[] {
    if (!node) return [];
    return [...this.collectBalanceFactors(node.left ?? null), { value: node.value, balanceFactor: node.balanceFactor ?? 0 }, ...this.collectBalanceFactors(node.right ?? null)];
  }
}
