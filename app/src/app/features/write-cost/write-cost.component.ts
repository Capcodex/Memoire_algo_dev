import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { buildInsertBenchmark, buildSplitStoryboard, estimateTradeoff, InsertBenchmarkResult, SplitPageStatus, SplitStoryboardStep, TradeoffEstimate } from '../../core/experiments/write-cost';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ChapterTab, ChapterTabsComponent } from '../../shared/chapter-layout/chapter-tabs.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { BarDatum } from '../../shared/charts/chart.models';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

type WriteCostTab = 'benchmark' | 'propagation' | 'tradeoff';

@Component({
  selector: 'app-write-cost',
  standalone: true,
  imports: [CommonModule, FormsModule, ChapterLayoutComponent, ConceptBriefComponent, ChapterTabsComponent, ChapterMetricsComponent, BarChartComponent, PedagogyPanelComponent],
  template: `
    <app-chapter-layout>
      <div chapter-header class="chapter-header py-7 text-center"><p class="chapter-kicker text-rose-400">Partie II · Coût des index</p><h1 class="mt-2 text-3xl font-extrabold text-white">Quand accélérer la lecture ralentit l’écriture</h1><p class="mx-auto mt-3 max-w-3xl text-slate-400">Mesurer la maintenance, suivre un split, puis décider selon la charge réelle.</p></div>

      <app-concept-brief chapter-concept concept="Chaque index est une structure supplémentaire maintenue à chaque écriture." problemSolved="Il accélère les lectures sélectives, mais ajoute des écritures et parfois des splits." demoQuestion="Mesurez quand le gain de lecture compense réellement le coût permanent des index." accent="rose" />

      <div chapter-visual class="space-y-5">
        <app-chapter-tabs [tabs]="tabs" [activeId]="activeTab" (activeIdChange)="setActiveTab($event)" ariaLabel="Laboratoires du coût des index" />

        <div *ngIf="activeTab === 'benchmark'" class="grid gap-5 xl:grid-cols-2">
          <app-bar-chart title="Temps total" subtitle="Durée simulée en millisecondes" [data]="totalTimeBars" />
          <app-bar-chart title="Dégradation relative" subtitle="Facteur par rapport à la table sans index" [data]="relativeBars" />
        </div>

        <article *ngIf="activeTab === 'propagation'" class="grid min-h-[28rem] gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div class="flex flex-col rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <div class="flex justify-between gap-3"><span class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide" [ngClass]="eventClass(currentSplitStep)">{{ currentSplitStep.costLabel }}</span><span class="text-xs text-slate-500">Étape {{ splitStepIndex + 1 }} / {{ splitSteps.length }}</span></div>
            <div class="flex flex-1 flex-col items-center justify-center gap-4 py-8"><ng-container *ngFor="let level of currentSplitStep.levels; let levelIndex = index"><div class="flex w-full flex-wrap justify-center gap-3"><div *ngFor="let page of level" class="min-w-24 rounded-xl border-2 px-3 py-3 text-center" [ngClass]="pageClass(page.status, page.type)"><p class="text-[0.6rem] font-bold uppercase tracking-widest opacity-70">{{ page.type === 'leaf' ? 'Feuille' : 'Interne' }}</p><div class="mt-2 flex justify-center divide-x divide-current/30 font-mono text-sm font-bold"><span *ngFor="let key of page.keys" class="px-2">{{ key }}</span></div><p *ngIf="page.status !== 'normal'" class="mt-2 text-[0.6rem] font-black uppercase">{{ page.status === 'full' ? 'Pleine' : 'Nouvelle' }}</p></div></div><div *ngIf="levelIndex < currentSplitStep.levels.length - 1" class="text-xl text-amber-400">↓</div></ng-container></div>
            <div class="rounded-xl border border-white/10 bg-slate-900/70 p-4"><h2 class="font-bold text-white">{{ currentSplitStep.title }}</h2><p class="mt-2 text-sm leading-relaxed text-slate-300">{{ currentSplitStep.narration }}</p></div>
          </div>
          <app-bar-chart title="Pages écrites" subtitle="Heap, index et total" [data]="splitCostBars" />
        </article>

        <article *ngIf="activeTab === 'tradeoff'" class="grid min-h-[24rem] items-center gap-5 lg:grid-cols-3">
          <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6"><p class="text-xs font-bold uppercase text-emerald-300">Gain lecture estimé</p><p class="mt-3 text-4xl font-black text-white">× {{ tradeoff.readGain | number:'1.1-1' }}</p><p class="mt-3 text-sm text-slate-400">Une faible sélectivité évite de lire une grande partie de la table.</p></div>
          <div class="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6"><p class="text-xs font-bold uppercase text-rose-300">Pénalité écriture</p><p class="mt-3 text-4xl font-black text-white">× {{ tradeoff.writePenalty | number:'1.1-1' }}</p><p class="mt-3 text-sm text-slate-400">Chaque insertion maintient {{ selectedIndexCount }} index.</p></div>
          <div class="rounded-2xl border p-6" [ngClass]="verdictClass"><p class="text-xs font-bold uppercase opacity-70">Décision</p><p class="mt-3 text-3xl font-black">{{ verdictLabel }}</p><p class="mt-3 text-sm leading-relaxed opacity-80">{{ tradeoff.recommendation }}</p></div>
        </article>
      </div>

      <section chapter-controls class="control-panel">
        <div *ngIf="activeTab === 'benchmark'" class="flex flex-wrap items-end gap-5"><label class="min-w-56 flex-1 text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Insertions</span><strong>{{ insertCount | number }}</strong></span><input class="w-full accent-violet-500" type="range" min="1000" max="100000" step="1000" [(ngModel)]="insertCount" (ngModelChange)="refreshBenchmark()" /></label><label class="min-w-56 flex-1 text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Ordre B+Tree</span><strong>m={{ btreeOrder }}</strong></span><input class="w-full accent-violet-500" type="range" min="3" max="100" [(ngModel)]="btreeOrder" (ngModelChange)="refreshBenchmark()" /></label><div class="flex flex-wrap gap-2"><button *ngFor="let result of benchmarkResults" type="button" class="rounded-lg border px-3 py-2 text-xs" [ngClass]="selectedIndexCount === result.indexCount ? 'border-violet-400 bg-violet-500/15 text-white' : 'border-white/10 text-slate-400'" (click)="selectIndexCount(result.indexCount)">{{ result.indexCount }} idx</button></div></div>
        <div *ngIf="activeTab === 'propagation'" class="flex flex-wrap items-center gap-2"><button *ngFor="let step of splitSteps; let index = index" type="button" class="rounded-lg border px-3 py-2 text-xs" [ngClass]="index === splitStepIndex ? 'border-amber-400 bg-amber-500/15 text-white' : 'border-white/10 text-slate-400'" (click)="setSplitStep(index)">{{ index + 1 }} · {{ step.title }}</button><button type="button" class="glass-button-secondary ml-auto" [disabled]="splitStepIndex === 0" (click)="previousSplitStep()">←</button><button type="button" class="glass-button-secondary" [disabled]="splitStepIndex === splitSteps.length - 1" (click)="nextSplitStep()">→</button></div>
        <div *ngIf="activeTab === 'tradeoff'" class="grid gap-5 lg:grid-cols-3"><label class="text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Lectures</span><strong>{{ readShare }} %</strong></span><input class="w-full accent-emerald-500" type="range" min="0" max="100" [(ngModel)]="readShare" /></label><label class="text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Sélectivité</span><strong>{{ selectivity }} %</strong></span><input class="w-full accent-emerald-500" type="range" min="1" max="100" [(ngModel)]="selectivity" /></label><div class="flex flex-wrap items-end gap-2"><button *ngFor="let result of benchmarkResults" type="button" class="rounded-lg border px-3 py-2 text-xs" [ngClass]="selectedIndexCount === result.indexCount ? 'border-rose-400 bg-rose-500/15 text-white' : 'border-white/10 text-slate-400'" (click)="selectIndexCount(result.indexCount)">{{ result.indexCount }} idx</button></div></div>
      </section>

      <app-chapter-metrics chapter-metrics [metrics]="chapterMetrics" />
      <div chapter-charts></div>
      <app-pedagogy-panel chapter-conclusion observation="Un index accélère certaines lectures, mais son coût est payé par toutes les écritures concernées." explanation="Le nombre d’index, leur ordre et les splits déterminent le travail supplémentaire de maintenance." takeaway="Conserver uniquement les index utiles, puis laisser le planner PostgreSQL décider s’ils sont rentables pour chaque requête." accent="rose" />
    </app-chapter-layout>
  `
})
export class WriteCostComponent {
  readonly tabs: readonly ChapterTab[] = [
    { id: 'benchmark', label: 'Benchmark', description: 'Quantifier le surcoût' },
    { id: 'propagation', label: 'Propagation', description: 'Comprendre le pic de pages' },
    { id: 'tradeoff', label: 'Compromis', description: 'Décider selon la charge' }
  ];
  activeTab: WriteCostTab = 'benchmark';
  insertCount = 20_000;
  btreeOrder = 50;
  selectedIndexCount = 2;
  benchmarkResults: InsertBenchmarkResult[] = [];
  totalTimeBars: BarDatum[] = [];
  relativeBars: BarDatum[] = [];
  readonly splitSteps = buildSplitStoryboard();
  splitStepIndex = 0;
  readShare = 70;
  selectivity = 5;

  constructor() { this.refreshBenchmark(); }

  get selectedBenchmark(): InsertBenchmarkResult { return this.benchmarkResults[this.selectedIndexCount]; }
  get currentSplitStep(): SplitStoryboardStep { return this.splitSteps[this.splitStepIndex]; }
  get splitCostBars(): BarDatum[] { return [{ label: 'Heap', value: this.currentSplitStep.heapPages, color: '#34d399' }, { label: 'Index', value: this.currentSplitStep.indexPages, color: '#fb7185' }, { label: 'Total', value: this.currentSplitStep.heapPages + this.currentSplitStep.indexPages, color: '#fbbf24' }]; }
  get tradeoff(): TradeoffEstimate { return estimateTradeoff(this.readShare, this.selectivity, this.selectedBenchmark); }
  get verdictLabel(): string { return { favorable: 'Index pertinent', balanced: 'À mesurer', unfavorable: 'Index coûteux' }[this.tradeoff.verdict]; }
  get verdictClass(): string { return { favorable: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200', balanced: 'border-amber-400/40 bg-amber-500/10 text-amber-200', unfavorable: 'border-rose-400/40 bg-rose-500/10 text-rose-200' }[this.tradeoff.verdict]; }

  get chapterMetrics(): readonly ChapterMetric[] {
    if (this.activeTab === 'benchmark') return [
      { label: 'Temps/insertion', value: this.formatPerInsert(this.selectedBenchmark.millisecondsPerInsert), explanation: 'Coût moyen de l’insertion avec les index sélectionnés.', accent: 'violet', projected: this.selectedBenchmark.projected },
      { label: 'Surcoût', value: `× ${this.selectedBenchmark.relativeFactor.toFixed(1)}`, explanation: 'Facteur par rapport à la table sans index.', accent: 'rose', projected: this.selectedBenchmark.projected },
      { label: 'Temps total', value: this.formatDuration(this.selectedBenchmark.totalTimeMs), explanation: `Durée pour ${this.insertCount.toLocaleString('fr-FR')} insertions.`, accent: 'amber', projected: this.selectedBenchmark.projected }
    ];
    if (this.activeTab === 'propagation') return [
      { label: 'Heap', value: this.currentSplitStep.heapPages, unit: 'page', explanation: 'Page de table écrite par l’insertion.', accent: 'emerald' },
      { label: 'Index', value: this.currentSplitStep.indexPages, unit: 'pages', explanation: 'Pages d’index touchées par le split.', accent: 'rose' },
      { label: 'Total', value: this.currentSplitStep.heapPages + this.currentSplitStep.indexPages, unit: 'pages', explanation: 'Pic total d’écritures de l’étape.', accent: 'amber' }
    ];
    return [
      { label: 'Gain lecture', value: `× ${this.tradeoff.readGain.toFixed(1)}`, explanation: 'Travail de lecture évité selon la sélectivité.', accent: 'emerald' },
      { label: 'Pénalité écriture', value: `× ${this.tradeoff.writePenalty.toFixed(1)}`, explanation: 'Surcoût du scénario d’index choisi.', accent: 'rose' },
      { label: 'Verdict', value: this.verdictLabel, explanation: this.tradeoff.recommendation, accent: this.tradeoff.verdict === 'favorable' ? 'emerald' : this.tradeoff.verdict === 'balanced' ? 'amber' : 'rose' }
    ];
  }

  setActiveTab(id: string): void { if (id === 'benchmark' || id === 'propagation' || id === 'tradeoff') this.activeTab = id; }
  refreshBenchmark(): void { this.benchmarkResults = buildInsertBenchmark(this.insertCount, this.btreeOrder); this.totalTimeBars = this.benchmarkResults.map(result => ({ label: `${result.indexCount} idx`, value: result.totalTimeMs })); this.relativeBars = this.benchmarkResults.map(result => ({ label: `${result.indexCount} idx`, value: result.relativeFactor })); }
  selectIndexCount(indexCount: number): void { this.selectedIndexCount = indexCount; }
  setSplitStep(index: number): void { this.splitStepIndex = Math.min(this.splitSteps.length - 1, Math.max(0, index)); }
  previousSplitStep(): void { this.setSplitStep(this.splitStepIndex - 1); }
  nextSplitStep(): void { this.setSplitStep(this.splitStepIndex + 1); }
  pageClass(status: SplitPageStatus, type: 'internal' | 'leaf'): string { if (status === 'full') return 'border-rose-400 bg-rose-500/15 text-rose-200'; if (status === 'new') return 'border-emerald-400 bg-emerald-500/15 text-emerald-200'; return type === 'internal' ? 'border-amber-400/50 bg-amber-500/10 text-amber-200' : 'border-violet-400/50 bg-violet-500/10 text-violet-200'; }
  eventClass(step: SplitStoryboardStep): string { if (step.event === 'split-root') return 'bg-rose-500/15 text-rose-300'; if (step.event === 'split-leaf' || step.event === 'propagation') return 'bg-amber-500/15 text-amber-300'; return 'bg-slate-800 text-slate-300'; }
  formatDuration(milliseconds: number): string { return milliseconds < 1 ? `${(milliseconds * 1000).toFixed(1)} µs` : `${milliseconds.toFixed(1)} ms`; }
  formatPerInsert(milliseconds: number): string { return `${(milliseconds * 1000).toFixed(2)} µs`; }
}
