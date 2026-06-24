import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BPlusTree } from '../../core/algorithms/bplustree';
import { BTree } from '../../core/algorithms/btree';
import { ComparableQuery, ComparableQueryResult, COMPARABLE_QUERIES, evaluateBPlusTreeQuery, evaluateBTreeQuery } from '../../core/experiments/tree-query-comparison';

@Component({
  selector: 'app-same-query-comparator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="glass-panel p-5" aria-labelledby="same-query-title">
      <div class="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div><p class="chapter-kicker text-emerald-400">Same Query Comparator</p><h2 id="same-query-title" class="mt-1 text-xl font-bold text-white">Une requête, deux structures, les mêmes données</h2><p class="mt-1 text-sm text-slate-400">Les deux arbres utilisent m={{ order }} et {{ size }} clés. Seule leur organisation change.</p></div>
        <button type="button" class="glass-button" (click)="runQuery()">Exécuter sur les deux arbres</button>
      </div>

      <div class="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5"><button *ngFor="let query of queries" type="button" class="rounded-xl border px-3 py-3 text-left text-xs transition" [ngClass]="query.id === selectedQueryId ? 'border-emerald-400 bg-emerald-500/10 text-white' : 'border-white/10 bg-slate-950/40 text-slate-400'" (click)="selectQuery(query)"><span class="font-semibold">{{ query.label }}</span><code class="mt-2 block text-[0.65rem] opacity-70">{{ query.sql }}</code></button></div>

      <div class="mt-5 rounded-xl border border-white/10 bg-slate-950/40 p-4"><div class="flex justify-between text-xs text-slate-400"><span>Étape synchronisée</span><span>{{ comparisonStep }} / {{ maximumSteps }}</span></div><input type="range" min="1" [max]="maximumSteps" step="1" [(ngModel)]="comparisonStep" class="mt-2 w-full accent-emerald-500" /></div>

      <div class="mt-5 grid gap-4 xl:grid-cols-2">
        <article *ngIf="btreeResult" class="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-5"><div class="flex justify-between"><div><h3 class="text-lg font-bold text-amber-200">B-Tree</h3><p class="text-xs text-slate-500">Données possibles à tous les niveaux</p></div><span class="font-mono text-2xl font-black text-white">{{ btreeResult.totalPageAccesses }} pages</span></div><div class="mt-5 flex min-h-24 flex-wrap content-start gap-2"><span *ngFor="let page of visiblePages(btreeResult); let index = index" class="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100">{{ page }}<span class="ml-2 text-amber-300/50">{{ index + 1 }}</span></span></div><div class="mt-4 grid grid-cols-4 gap-2 text-center text-xs"><div class="metric-tile"><strong class="text-white">{{ btreeResult.internalPages }}</strong><span class="block text-slate-500">internes</span></div><div class="metric-tile"><strong class="text-white">{{ btreeResult.leafPages }}</strong><span class="block text-slate-500">feuilles</span></div><div class="metric-tile"><strong class="text-rose-300">{{ btreeResult.parentReturns }}</strong><span class="block text-slate-500">retours</span></div><div class="metric-tile"><strong class="text-emerald-300">{{ btreeResult.resultCount }}</strong><span class="block text-slate-500">résultats</span></div></div></article>
        <article *ngIf="bplusResult" class="rounded-2xl border border-violet-400/25 bg-violet-500/5 p-5"><div class="flex justify-between"><div><h3 class="text-lg font-bold text-violet-200">B+Tree</h3><p class="text-xs text-slate-500">Routage interne puis feuilles chaînées</p></div><span class="font-mono text-2xl font-black text-white">{{ bplusResult.totalPageAccesses }} pages</span></div><div class="mt-5 flex min-h-24 flex-wrap content-start gap-2"><span *ngFor="let page of visiblePages(bplusResult); let index = index" class="rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 font-mono text-xs text-violet-100">{{ page }}<span class="ml-2 text-violet-300/50">{{ index + 1 }}</span></span></div><div class="mt-4 grid grid-cols-4 gap-2 text-center text-xs"><div class="metric-tile"><strong class="text-white">{{ bplusResult.internalPages }}</strong><span class="block text-slate-500">internes</span></div><div class="metric-tile"><strong class="text-white">{{ bplusResult.leafPages }}</strong><span class="block text-slate-500">feuilles</span></div><div class="metric-tile"><strong class="text-emerald-300">0</strong><span class="block text-slate-500">retour</span></div><div class="metric-tile"><strong class="text-emerald-300">{{ bplusResult.resultCount }}</strong><span class="block text-slate-500">résultats</span></div></div></article>
      </div>
      <p *ngIf="btreeResult && bplusResult" class="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">Les résultats sont identiques. {{ conclusion }}</p>
    </section>
  `
})
export class SameQueryComparatorComponent implements OnChanges {
  @Input() order = 5;
  @Input() size = 40;

  readonly queries = COMPARABLE_QUERIES;
  selectedQueryId = this.queries[1].id;
  comparisonStep = 1;
  btreeResult: ComparableQueryResult | null = null;
  bplusResult: ComparableQueryResult | null = null;
  private btree = new BTree(5);
  private bplus = new BPlusTree(5);

  ngOnChanges(): void { this.rebuild(); }

  get selectedQuery(): ComparableQuery { return this.queries.find(query => query.id === this.selectedQueryId) ?? this.queries[0]; }
  get maximumSteps(): number { return Math.max(1, this.btreeResult?.visitedNodeIds.length ?? 0, this.bplusResult?.visitedNodeIds.length ?? 0); }
  get conclusion(): string {
    if (!this.btreeResult || !this.bplusResult) return '';
    if (this.selectedQuery.id === 'point' || this.selectedQuery.id === 'missing') return 'Pour une recherche ponctuelle, les coûts restent souvent proches.';
    return this.bplusResult.parentReturns === 0 ? 'Le B+Tree poursuit la plage dans les feuilles sans retour vers les parents.' : '';
  }

  selectQuery(query: ComparableQuery): void { this.selectedQueryId = query.id; this.runQuery(); }

  runQuery(): void {
    this.btreeResult = evaluateBTreeQuery(this.btree.snapshot().root!, this.selectedQuery);
    this.bplusResult = evaluateBPlusTreeQuery(this.bplus.snapshot().root!, this.selectedQuery);
    this.comparisonStep = 1;
  }

  visiblePages(result: ComparableQueryResult): readonly string[] { return result.visitedNodeIds.slice(0, this.comparisonStep); }

  private rebuild(): void {
    this.btree = new BTree(Math.max(3, this.order));
    this.bplus = new BPlusTree(Math.max(3, this.order));
    Array.from({ length: Math.max(1, this.size) }, (_, index) => (index + 1) * 5).forEach(value => { this.btree.insert(value); this.bplus.insert(value); });
    this.runQuery();
  }
}
