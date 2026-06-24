import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { buildIndexHeapDemo, formatTupleId, HeapTuple, IndexLeafEntry, resolveTupleId } from '../../core/experiments/index-heap';

@Component({
  selector: 'app-tid-heap-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="glass-panel p-5" aria-labelledby="tid-title">
      <div><p class="chapter-kicker text-violet-400">Index Entry → TID → Heap Tuple</p><h2 id="tid-title" class="mt-1 text-xl font-bold text-white">De la clé indexée à la ligne réelle</h2><p class="mt-1 text-sm text-slate-400">Suivez d’abord un downlink, puis l’adresse physique stockée dans la feuille.</p></div>

      <div class="mt-6 grid items-stretch gap-3 xl:grid-cols-[1fr_auto_1.35fr_auto_1.65fr]">
        <article class="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-amber-300">1 · Page interne</p><p class="mt-1 font-mono text-xs text-slate-500">bloc index 12</p>
          <div class="mt-4 flex flex-wrap gap-2"><button *ngFor="let separator of demo.internalSeparators" type="button" class="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 font-mono text-xs text-amber-100" (click)="followDownlink(separator.childBlock)">{{ separator.key }}<span class="block text-[0.6rem] text-amber-300/60">↓ bloc {{ separator.childBlock }}</span></button></div>
          <p class="mt-4 text-xs leading-relaxed text-slate-400">La page interne contient des séparateurs et des downlinks, pas les lignes complètes.</p>
        </article>

        <div class="flex items-center justify-center text-2xl text-amber-300">→</div>

        <article class="rounded-2xl border p-4" [ngClass]="leafActive ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/10 bg-slate-950/40 opacity-50'">
          <p class="text-xs font-bold uppercase tracking-wide text-violet-300">2 · Feuille d’index</p><p class="mt-1 font-mono text-xs text-slate-500">bloc index {{ demo.leafBlock }}</p>
          <div class="mt-4 space-y-2"><button *ngFor="let entry of demo.leafEntries" type="button" class="flex w-full items-center justify-between rounded-lg border px-3 py-2 font-mono text-xs transition" [ngClass]="selectedEntry === entry ? 'border-violet-300 bg-violet-500/20 text-white' : 'border-white/10 bg-slate-900 text-slate-300'" [disabled]="!leafActive" (click)="followTid(entry)"><span>clé {{ entry.key }}</span><span class="text-violet-300">TID {{ formatTid(entry) }}</span></button></div>
          <p class="mt-4 text-xs leading-relaxed text-slate-400">La feuille associe la clé triée à un TID : numéro de bloc heap et position du tuple.</p>
        </article>

        <div class="flex items-center justify-center text-2xl text-violet-300">→</div>

        <article class="rounded-2xl border p-4" [ngClass]="selectedTuple ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-white/10 bg-slate-950/40'">
          <p class="text-xs font-bold uppercase tracking-wide text-emerald-300">3 · Page heap</p><p class="mt-1 font-mono text-xs text-slate-500">bloc heap {{ demo.heapBlock }}</p>
          <div class="mt-4 space-y-2"><div *ngFor="let tuple of demo.heapTuples" class="rounded-lg border p-3 transition" [ngClass]="selectedTuple === tuple ? 'border-emerald-300 bg-emerald-500/15 ring-2 ring-emerald-500/20' : 'border-white/10 bg-slate-900/70'"><div class="flex justify-between gap-2"><span class="font-mono text-xs text-emerald-300">{{ formatTuple(tuple) }}</span><span class="text-[0.65rem] text-slate-500">offset {{ tuple.tid.offsetNumber }}</span></div><p class="mt-2 font-mono text-[0.68rem] text-slate-300">capteur={{ tuple.capteurId }} · ts={{ tuple.timestampUtc }} · valeur={{ tuple.valeur }} · alerte={{ tuple.alerte }}</p></div></div>
          <p class="mt-4 text-xs leading-relaxed text-slate-400">Le tuple heap contient les colonnes réelles qui ne figurent pas nécessairement dans l’index.</p>
        </article>
      </div>

      <details class="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-4"><summary class="cursor-pointer text-sm font-semibold text-slate-300">Extension : quand un Index Only Scan est-il possible ?</summary><p class="mt-3 text-xs leading-relaxed text-slate-400">Si toutes les colonnes demandées sont présentes dans l’index et que la visibility map confirme la visibilité du tuple, PostgreSQL peut éviter l’accès heap.</p></details>
    </section>
  `
})
export class TidHeapLinkComponent {
  readonly demo = buildIndexHeapDemo();
  leafActive = false;
  selectedEntry: IndexLeafEntry | null = null;
  selectedTuple: HeapTuple | null = null;

  followDownlink(childBlock: number): void {
    this.leafActive = childBlock === this.demo.leafBlock;
    this.selectedEntry = null;
    this.selectedTuple = null;
  }

  followTid(entry: IndexLeafEntry): void {
    this.selectedEntry = entry;
    this.selectedTuple = resolveTupleId(this.demo.heapTuples, entry.tid);
  }

  formatTid(entry: IndexLeafEntry): string { return formatTupleId(entry.tid); }
  formatTuple(tuple: HeapTuple): string { return `TID ${formatTupleId(tuple.tid)}`; }
}
