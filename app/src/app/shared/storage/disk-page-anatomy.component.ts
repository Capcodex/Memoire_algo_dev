import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { calculateDiskPageLayout, DiskPageLayout, estimatePageTreeHeight, IndexPageType } from '../../core/experiments/storage-page';

@Component({
  selector: 'app-disk-page-anatomy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="glass-panel p-5" aria-labelledby="page-anatomy-title">
      <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div><p class="chapter-kicker text-cyan-400">Disk Page Anatomy Explorer</p><h2 id="page-anatomy-title" class="mt-1 text-xl font-bold text-white">Répartition physique d’une page d’index</h2><p class="mt-1 text-sm text-slate-400">Chaque entrée consomme une ligne d’adressage et un payload différent selon le type de page.</p></div>
        <div class="flex gap-2"><button type="button" class="rounded-lg border px-3 py-2 text-xs" [ngClass]="pageType === 'internal' ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-white/10 text-slate-400'" (click)="pageType = 'internal'">Page interne</button><button type="button" class="rounded-lg border px-3 py-2 text-xs" [ngClass]="pageType === 'leaf' ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-white/10 text-slate-400'" (click)="pageType = 'leaf'">Feuille</button></div>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-5">
        <label class="text-xs text-slate-300">Page <span class="float-right font-mono text-cyan-300">{{ pageSizeBytes / 1024 }} KiB</span><input type="range" min="4096" max="32768" step="4096" [(ngModel)]="pageSizeBytes" class="mt-2 w-full accent-cyan-500" /></label>
        <label class="text-xs text-slate-300">Clé <span class="float-right font-mono text-cyan-300">{{ keyBytes }} o</span><input type="range" min="4" max="64" step="4" [(ngModel)]="keyBytes" class="mt-2 w-full accent-cyan-500" /></label>
        <label class="text-xs text-slate-300">Downlink <span class="float-right font-mono text-cyan-300">{{ childPointerBytes }} o</span><input type="range" min="4" max="16" step="2" [(ngModel)]="childPointerBytes" class="mt-2 w-full accent-cyan-500" /></label>
        <label class="text-xs text-slate-300">TID <span class="float-right font-mono text-cyan-300">{{ tidBytes }} o</span><input type="range" min="6" max="16" step="2" [(ngModel)]="tidBytes" class="mt-2 w-full accent-cyan-500" /></label>
        <label class="text-xs text-slate-300">Fill factor <span class="float-right font-mono text-cyan-300">{{ fillFactorPercent }} %</span><input type="range" min="50" max="100" step="5" [(ngModel)]="fillFactorPercent" class="mt-2 w-full accent-cyan-500" /></label>
      </div>

      <div class="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <div class="flex h-28 min-w-[42rem] overflow-hidden rounded-xl text-center text-[0.68rem] font-bold">
          <div class="flex min-w-16 items-center justify-center bg-slate-700 px-2 text-slate-200" [style.width.%]="percentage(layout.headerBytes)">En-tête<br>{{ layout.headerBytes }} o</div>
          <div class="flex min-w-20 items-center justify-center bg-blue-600/50 px-2 text-blue-100" [style.width.%]="percentage(layout.linePointersTotalBytes)">Line pointers<br>{{ layout.linePointersTotalBytes }} o</div>
          <div class="flex min-w-28 flex-1 items-center justify-center bg-gradient-to-r from-cyan-600/60 to-violet-600/60 px-3 text-white">{{ layout.capacity }} entrées<br>{{ layout.entriesTotalBytes }} o</div>
          <div class="flex min-w-20 items-center justify-center bg-emerald-600/25 px-2 text-emerald-100" [style.width.%]="percentage(layout.freeBytes)">Libre<br>{{ layout.freeBytes }} o</div>
        </div>
        <div class="mt-2 flex justify-between font-mono text-xs text-slate-500"><span>0</span><span>{{ pageSizeBytes }} octets</span></div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-4">
        <article class="metric-tile"><p class="text-xs text-slate-500">Taille d’une entrée</p><p class="mt-1 text-2xl font-bold text-white">{{ layout.entryBytes }} o</p><p class="mt-1 text-xs text-slate-500">clé + {{ pageType === 'internal' ? 'downlink' : 'TID' }} + line pointer</p></article>
        <article class="metric-tile"><p class="text-xs text-slate-500">Capacité</p><p class="mt-1 text-2xl font-bold text-cyan-300">{{ layout.capacity }}</p><p class="mt-1 text-xs text-slate-500">entrées au fill factor choisi</p></article>
        <article class="metric-tile"><p class="text-xs text-slate-500">Ordre dérivé</p><p class="mt-1 text-2xl font-bold text-violet-300">m={{ layout.order }}</p><p class="mt-1 text-xs text-slate-500">{{ pageType === 'internal' ? 'enfants maximum' : 'entrées feuille' }}</p></article>
        <article class="metric-tile"><p class="text-xs text-slate-500">Hauteur pour 10^{{ recordExponent }}</p><p class="mt-1 text-2xl font-bold text-amber-300">{{ estimatedHeight }}</p><input type="range" min="3" max="9" step="1" [(ngModel)]="recordExponent" class="mt-2 w-full accent-amber-500" /></article>
      </div>
    </section>
  `
})
export class DiskPageAnatomyComponent {
  pageType: IndexPageType = 'leaf';
  pageSizeBytes = 8192;
  keyBytes = 8;
  childPointerBytes = 8;
  tidBytes = 6;
  fillFactorPercent = 90;
  recordExponent = 6;

  get layout(): DiskPageLayout {
    return calculateDiskPageLayout({ pageSizeBytes: this.pageSizeBytes, headerBytes: 32, linePointerBytes: 4, keyBytes: this.keyBytes, childPointerBytes: this.childPointerBytes, tidBytes: this.tidBytes, fillFactorPercent: this.fillFactorPercent, pageType: this.pageType });
  }

  get estimatedHeight(): number {
    return estimatePageTreeHeight(10 ** this.recordExponent, this.layout.order);
  }

  percentage(bytes: number): number {
    return this.pageSizeBytes ? Math.max(2, bytes / this.pageSizeBytes * 100) : 0;
  }
}
