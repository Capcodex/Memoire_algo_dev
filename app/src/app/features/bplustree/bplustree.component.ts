import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BPlusTree } from '../../core/algorithms/bplustree';
import { AnimationSequence, AnimationStep } from '../../core/models/animation.models';
import { MultiKeyTreeNode, TreeMetrics } from '../../core/models/tree.models';
import { ChapterControlsComponent } from '../../shared/chapter-layout/chapter-controls.component';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { AnimationPlayerComponent } from '../../shared/controls/animation-player.component';
import { SameQueryComparatorComponent } from '../../shared/query-comparison/same-query-comparator.component';
import { TidHeapLinkComponent } from '../../shared/storage/tid-heap-link.component';
import { TreeCanvasComponent } from '../../shared/tree-canvas/tree-canvas.component';
import { TreeLayout, TreeLayoutService } from '../../shared/tree-canvas/tree-layout.service';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

type IndexPreset = 'regular' | 'iot';

@Component({
  selector: 'app-bplustree',
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
    SameQueryComparatorComponent,
    TidHeapLinkComponent,
    PedagogyPanelComponent
  ],
  template: `
    <app-chapter-layout [sidebarControls]="true">
      <div chapter-header class="chapter-header">
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div class="max-w-4xl"><p class="chapter-kicker text-violet-400">Partie II · Section 2.2</p><h1 class="mt-1 text-2xl font-bold text-white">Chapitre 4 : le B+Tree sépare routage et données</h1><p class="mt-2 text-sm leading-relaxed text-slate-300">Les pages internes guident la recherche. Les entrées d’index restent dans des feuilles ordonnées et chaînées.</p></div>
          <div class="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100"><strong>Plage :</strong> une descente verticale, puis un parcours latéral.</div>
        </div>
      </div>

      <app-concept-brief chapter-concept concept="Un B+Tree réserve le routage aux pages internes et conserve les entrées dans les feuilles." problemSolved="Le chaînage des feuilles évite de remonter dans l’arbre pendant une requête de plage." demoQuestion="Lancez une plage et distinguez les accès verticaux des feuilles parcourues latéralement." accent="violet" />

      <div chapter-visual class="flex h-full min-h-[30rem] flex-col">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ followLeavesOnly ? 'Chaîne de feuilles isolée' : 'B+Tree et chemin courant' }}</p><h2 class="mt-1 text-lg font-semibold text-white">{{ currentNarrative }}</h2></div><span class="rounded-lg bg-violet-500/10 px-3 py-1.5 font-mono text-xs text-violet-300">m={{ indexOrder }} · {{ indexSize }} clés</span></div>
        <div class="h-[32rem]"><app-tree-canvas [layout]="currentLayout" [highlightedNodeIds]="highlightedIds" /></div>
      </div>

      <app-chapter-controls chapter-controls [hasAdvancedControls]="true">
        <label primary-control class="min-w-44 text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Ordre m</span><strong class="font-mono text-violet-300">{{ indexOrder }}</strong></span><input type="range" min="3" max="12" step="1" [(ngModel)]="indexOrder" class="w-full accent-violet-500" /></label>
        <label primary-control class="min-w-44 text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Clés indexées</span><strong class="font-mono text-violet-300">{{ indexSize }}</strong></span><input type="range" min="10" max="100" step="5" [(ngModel)]="indexSize" class="w-full accent-violet-500" /></label>
        <label primary-control class="text-sm text-slate-300"><span class="mb-2 block">Données</span><select [(ngModel)]="indexPreset" class="glass-input"><option value="regular">Clés simples</option><option value="iot">Chronologie du dataset</option></select></label>
        <button primary-control type="button" class="glass-button" (click)="buildIndex()">Reconstruire</button>
        <app-animation-player animation-controls [sequence]="currentSequence" (stepChanged)="onStepChanged($event)" />
        <div advanced-control class="min-w-80"><label class="mb-2 block text-sm text-slate-300">WHERE clé BETWEEN</label><div class="flex gap-2"><input type="number" [(ngModel)]="rangeStart" class="glass-input min-w-0 w-1/2" /><input type="number" [(ngModel)]="rangeEnd" class="glass-input min-w-0 w-1/2" /><button type="button" class="glass-button-secondary" (click)="executeRangeQuery()">Lancer</button></div><p *ngIf="rangeError" class="mt-2 text-xs text-rose-300">{{ rangeError }}</p></div>
        <button advanced-control type="button" class="glass-button-secondary" (click)="toggleLeafOnly()">{{ followLeavesOnly ? 'Afficher tout l’arbre' : 'Isoler les feuilles' }}</button>
      </app-chapter-controls>

      <app-chapter-metrics chapter-metrics [metrics]="chapterMetrics" />

      <div chapter-charts class="space-y-8">
        <section class="glass-panel p-5">
          <div class="flex items-center justify-between gap-3"><div><p class="chapter-kicker text-emerald-400">Leaf Chain Visualizer</p><h2 class="mt-1 text-lg font-bold text-white">Toutes les feuilles dans l’ordre</h2></div><span class="text-xs text-slate-500">{{ leafChain.length }} page(s)</span></div>
          <div class="mt-4 flex items-center gap-2 overflow-x-auto pb-3"><ng-container *ngFor="let leaf of leafChain; let last = last"><div class="shrink-0 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 font-mono text-xs text-violet-100">[{{ leaf.join(' · ') }}]</div><span *ngIf="!last" class="text-xl text-emerald-300">→</span></ng-container></div>
          <div class="mt-3 flex flex-wrap gap-1.5"><span *ngFor="let result of rangeResults" class="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-200">{{ result }}</span><span *ngIf="!rangeResults.length" class="text-sm text-slate-500">Lancez une plage pour surligner les résultats.</span></div>
        </section>

        <app-same-query-comparator [order]="indexOrder" [size]="indexSize" />
        <app-tid-heap-link />
      </div>

      <app-pedagogy-panel chapter-conclusion observation="Une recherche descend une fois jusqu’à la première feuille, puis avance latéralement sur les feuilles utiles." explanation="Les pages internes ne transportent que le routage ; les feuilles associent les clés triées aux TID des tuples heap." takeaway="Le B+Tree accélère les index et les plages ; il reste à mesurer le coût de sa maintenance à chaque écriture." accent="violet" />
    </app-chapter-layout>
  `
})
export class BPlusTreeComponent {
  private bptree = new BPlusTree(5);
  private readonly layoutService = inject(TreeLayoutService);
  private currentRoot: MultiKeyTreeNode | null = null;

  indexOrder = 5;
  indexSize = 40;
  indexPreset: IndexPreset = 'regular';
  rangeStart: number | null = 30;
  rangeEnd: number | null = 90;
  rangeError = '';
  rangeResults: number[] = [];
  leafChain: number[][] = [];
  followLeavesOnly = false;
  currentSequence: AnimationSequence<MultiKeyTreeNode> | null = null;
  currentLayout: TreeLayout = { nodes: [], edges: [], width: 0, height: 0 };
  currentMetrics: TreeMetrics = this.bptree.snapshot().metrics;
  highlightedIds: string[] = [];
  currentNarrative = 'Construction de l’index B+Tree.';

  constructor() { this.buildIndex(); }

  get chapterMetrics(): readonly ChapterMetric[] {
    return [
      { label: 'Accès verticaux', value: this.currentMetrics.verticalAccesses ?? 0, unit: 'pages', explanation: 'Pages traversées jusqu’à la première feuille utile.', accent: 'violet' },
      { label: 'Feuilles parcourues', value: this.currentMetrics.lateralLeafScans ?? 0, unit: 'pages', explanation: 'Feuilles suivies horizontalement pendant la plage.', accent: 'emerald' },
      { label: 'Résultats', value: this.rangeResults.length, unit: 'clés', explanation: 'Clés comprises dans l’intervalle demandé.', accent: 'cyan' }
    ];
  }

  activatePreset(preset: IndexPreset): void {
    this.indexPreset = preset;
    if (preset === 'iot') { this.rangeStart = 1_706; this.rangeEnd = 1_720; }
    else { this.rangeStart = 30; this.rangeEnd = 90; }
    this.buildIndex();
  }

  buildIndex(): void {
    this.bptree = new BPlusTree(this.indexOrder);
    const values = this.indexPreset === 'iot' ? Array.from({ length: this.indexSize }, (_, index) => 1_701 + index) : Array.from({ length: this.indexSize }, (_, index) => (index + 1) * 5);
    const steps: AnimationStep<MultiKeyTreeNode>[] = [];
    values.forEach((value, index) => this.bptree.insert(value).steps.forEach(step => steps.push({ ...step, description: `Insertion ${index + 1}/${values.length} · ${step.description}` })));
    this.currentSequence = { steps };
    this.currentRoot = this.bptree.snapshot().root;
    this.currentMetrics = this.bptree.snapshot().metrics;
    this.leafChain = this.bptree.getLeafChain();
    this.rangeResults = [];
    this.rangeError = '';
    this.currentNarrative = `${values.length} clés dans un B+Tree d’ordre m=${this.indexOrder}.`;
    const finalStep = steps.at(-1);
    if (finalStep) this.onStepChanged(finalStep);
  }

  executeRangeQuery(): void {
    if (this.rangeStart === null || this.rangeEnd === null) return;
    if (this.rangeStart > this.rangeEnd) { this.rangeError = 'La borne minimale doit être inférieure ou égale à la borne maximale.'; return; }
    this.rangeError = '';
    this.currentSequence = this.bptree.rangeQuery(this.rangeStart, this.rangeEnd);
    this.rangeResults = this.bptree.getLastRangeResults();
    const finalStep = this.currentSequence.steps.at(-1);
    if (finalStep) this.onStepChanged(finalStep);
  }

  toggleLeafOnly(): void { this.followLeavesOnly = !this.followLeavesOnly; this.currentLayout = this.layoutForMode(this.currentRoot); }

  onStepChanged(step: AnimationStep<MultiKeyTreeNode>): void {
    this.currentRoot = step.state.root;
    this.currentLayout = this.layoutForMode(step.state.root);
    this.currentMetrics = step.state.metrics;
    this.highlightedIds = step.highlightNodeIds ?? [];
    this.currentNarrative = step.description;
  }

  private layoutForMode(root: MultiKeyTreeNode | null): TreeLayout {
    const layout = this.layoutService.layoutMultiKeyTree(root, this.indexOrder - 1);
    if (!this.followLeavesOnly) return layout;
    const leaves = layout.nodes.filter(node => node.isLeaf);
    if (!leaves.length) return { nodes: [], edges: [], width: 0, height: 0 };
    const minimumX = Math.min(...leaves.map(node => node.x - node.width / 2));
    const shiftedLeaves = leaves.map(node => ({ ...node, x: node.x - minimumX + 30, y: 50 }));
    const positions = new Map(shiftedLeaves.map(node => [node.id, node]));
    const edges = layout.edges.filter(edge => edge.isLateral && positions.has(edge.sourceId) && positions.has(edge.targetId)).map(edge => ({ ...edge, x1: positions.get(edge.sourceId)!.x + positions.get(edge.sourceId)!.width / 2, y1: 50, x2: positions.get(edge.targetId)!.x - positions.get(edge.targetId)!.width / 2, y2: 50 }));
    const width = Math.max(...shiftedLeaves.map(node => node.x + node.width / 2)) + 30;
    return { nodes: shiftedLeaves, edges, width, height: 100 };
  }
}
