import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { estimatePlannerDecision, IOT_COLUMN_SCENARIOS, IotColumnScenario, PlannerDecisionEstimate, PREFIX_QUERY_SCENARIOS, PrefixQueryScenario, ScanType } from '../../core/experiments/postgres-planner';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ChapterTab, ChapterTabsComponent } from '../../shared/chapter-layout/chapter-tabs.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { BarDatum } from '../../shared/charts/chart.models';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

interface SelectivityPreset { label: string; selectivity: number; detail: string; }
type PostgresTab = 'selectivity' | 'dataset' | 'prefix';

@Component({
  selector: 'app-postgres-bridge',
  standalone: true,
  imports: [CommonModule, FormsModule, ChapterLayoutComponent, ConceptBriefComponent, ChapterTabsComponent, ChapterMetricsComponent, BarChartComponent, PedagogyPanelComponent],
  template: `
    <app-chapter-layout>
      <div chapter-header class="chapter-header py-7 text-center"><p class="chapter-kicker text-blue-400">Partie III · PostgreSQL</p><h1 class="mt-2 text-3xl font-extrabold text-white">Du B+Tree au choix du planner</h1><p class="mx-auto mt-3 max-w-3xl text-slate-400">La structure existe ; PostgreSQL doit encore décider si son utilisation est rentable.</p></div>

      <app-concept-brief chapter-concept concept="Le planner compare plusieurs plans et retient celui dont le coût estimé est le plus faible." problemSolved="La présence d’un index ne garantit pas qu’il soit préférable à une lecture séquentielle." demoQuestion="Faites varier sélectivité, distribution et préfixe pour observer le plan choisi." accent="blue" />

      <div chapter-visual class="space-y-5">
        <app-chapter-tabs [tabs]="tabs" [activeId]="activeTab" (activeIdChange)="setActiveTab($event)" ariaLabel="Explorateurs PostgreSQL" />

        <div *ngIf="activeTab === 'selectivity'" class="grid min-h-[28rem] gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <app-bar-chart title="Coût estimé des plans" subtitle="Index, Bitmap et lecture séquentielle" [data]="plannerCostBars" />
          <article class="flex flex-col justify-between rounded-2xl border-2 p-5" [ngClass]="scanPanelClass(plannerDecision.scanType)"><div><p class="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Plan probable</p><h2 class="mt-3 text-3xl font-black">{{ plannerDecision.scanType }}</h2><p class="mt-4 text-sm leading-relaxed opacity-90">{{ plannerDecision.explanation }}</p></div><div class="mt-6 space-y-3"><code class="block rounded-lg bg-slate-950/30 p-3 text-xs">rows={{ plannerDecision.estimatedRows | number }} cost={{ winningCost | number:'1.1-1' }}</code><div *ngIf="plannerDecision.scanType !== 'Seq Scan'" class="flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-xs font-bold text-violet-100"><span>B+Tree</span><span>→</span><span>feuille</span><span>→</span><span>TID</span><span>→</span><span>tuple heap</span></div></div></article>
        </div>

        <article *ngIf="activeTab === 'dataset'" class="min-h-[28rem] rounded-2xl border border-white/10 bg-slate-950/50 p-6">
          <div class="grid gap-4 md:grid-cols-3"><div class="metric-tile"><p class="text-xs text-slate-500">Cardinalité</p><p class="mt-2 font-bold text-white">{{ activeIotScenario.cardinality }}</p></div><div class="metric-tile"><p class="text-xs text-slate-500">Sélectivité typique</p><p class="mt-2 font-bold text-white">{{ activeIotScenario.typicalSelectivity }}</p></div><div class="rounded-xl border p-4" [ngClass]="scanPanelClass(activeIotScenario.scanType)"><p class="text-xs opacity-70">Plan probable</p><p class="mt-2 font-black">{{ activeIotScenario.scanType }}</p></div></div>
          <div class="mt-5 grid gap-5 lg:grid-cols-2"><div class="rounded-xl border border-white/10 bg-slate-900/60 p-5"><p class="chapter-kicker text-cyan-300">Requête</p><code class="mt-3 block whitespace-pre-wrap text-sm text-slate-200">SELECT * FROM relevés\n{{ activeIotScenario.query }};</code></div><div class="rounded-xl border border-white/10 bg-slate-900/60 p-5"><p class="chapter-kicker text-emerald-300">Stratégie</p><p class="mt-3 text-lg font-bold text-white">{{ activeIotScenario.strategy }}</p><p class="mt-3 text-sm leading-relaxed text-slate-400">{{ activeIotScenario.insight }}</p></div></div>
          <div *ngIf="activeIotScenario.id === 'alerte'" class="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 font-mono text-sm text-rose-200">CREATE INDEX idx_alerte ON relevés (alerte) WHERE alerte = TRUE;</div>
          <div *ngIf="activeIotScenario.id === 'timestamp_utc'" class="mt-5 flex items-center gap-2 overflow-x-auto rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><span *ngFor="let date of timelineDates" class="min-w-20 rounded-lg bg-amber-300/15 px-3 py-2 text-center font-mono text-xs text-amber-200">{{ date }}</span><span class="text-amber-300">→</span></div>
        </article>

        <article *ngIf="activeTab === 'prefix'" class="min-h-[28rem] rounded-2xl border border-white/10 bg-slate-950/50 p-6">
          <div class="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 text-center"><p class="chapter-kicker text-violet-300">Index composite</p><div class="mx-auto mt-4 flex max-w-xl justify-center font-mono font-bold"><span class="rounded-l-xl border border-violet-400 bg-violet-500/20 px-5 py-4 text-violet-100">capteur_id</span><span class="border-y border-r border-violet-400/50 px-3 py-4 text-violet-300">→</span><span class="rounded-r-xl border-y border-r border-violet-400/50 bg-slate-950/50 px-5 py-4 text-slate-200">timestamp_utc</span></div><p class="mt-3 text-xs text-slate-400">Tri par capteur, puis par date à l’intérieur de chaque capteur.</p></div>
          <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><div><code class="block whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">SELECT * FROM relevés\n{{ activePrefixScenario.sql }};</code><div class="mt-4 flex gap-2"><span *ngFor="let column of compositeColumns" class="rounded-lg border px-3 py-2 font-mono text-xs" [ngClass]="prefixColumnClass(column)">{{ column }}</span></div><p class="mt-4 text-sm leading-relaxed text-slate-300">{{ activePrefixScenario.explanation }}</p></div><div class="rounded-xl border p-5 text-center" [ngClass]="scanPanelClass(activePrefixScenario.scanType)"><p class="text-xs font-bold uppercase opacity-70">Verdict</p><p class="mt-3 text-2xl font-black">{{ activePrefixScenario.scanType }}</p><p class="mt-2 text-xs opacity-80">{{ activePrefixScenario.indexUsable ? 'Index composite exploitable' : 'Préfixe gauche absent' }}</p></div></div>
        </article>
      </div>

      <section chapter-controls class="control-panel">
        <div *ngIf="activeTab === 'selectivity'" class="space-y-5"><div class="flex flex-wrap gap-2"><button *ngFor="let preset of selectivityPresets" type="button" class="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300" (click)="activateSelectivityPreset(preset)">{{ preset.label }} · {{ preset.detail }}</button></div><div class="grid gap-5 lg:grid-cols-3"><label class="text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Sélectivité</span><strong>{{ formatSelectivity(selectivityPercent) }}</strong></span><input class="w-full accent-blue-500" type="range" min="0.001" max="100" step="0.001" [(ngModel)]="selectivityPercent" /></label><label class="text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>Taille de table</span><strong>{{ tableRows | number }} lignes</strong></span><input class="w-full accent-blue-500" type="range" min="4" max="7" step="0.1" [(ngModel)]="tableExponent" /></label><label class="text-sm text-slate-300"><span class="mb-2 flex justify-between"><span>random_page_cost</span><strong>{{ randomPageCost }}</strong></span><input class="w-full accent-blue-500" type="range" min="1" max="8" step="0.1" [(ngModel)]="randomPageCost" /></label></div></div>
        <div *ngIf="activeTab === 'dataset'" class="grid grid-cols-2 gap-2 lg:grid-cols-4"><button *ngFor="let scenario of iotScenarios" type="button" class="rounded-xl border px-4 py-3 text-left" [ngClass]="scenario.id === activeIotScenario.id ? iotActiveClass(scenario) : 'border-white/10 text-slate-400'" (click)="selectIotScenario(scenario.id)"><span class="font-mono text-sm font-bold">{{ scenario.label }}</span><span class="mt-1 block text-xs opacity-70">{{ scenario.dataType }}</span></button></div>
        <div *ngIf="activeTab === 'prefix'" class="grid gap-2 lg:grid-cols-3"><button *ngFor="let scenario of prefixScenarios" type="button" class="rounded-xl border p-4 text-left" [ngClass]="scenario.id === activePrefixScenario.id ? (scenario.indexUsable ? 'border-emerald-400 bg-emerald-500/10' : 'border-rose-400 bg-rose-500/10') : 'border-white/10'" (click)="selectPrefixScenario(scenario.id)"><span class="text-xs font-bold" [class.text-emerald-300]="scenario.indexUsable" [class.text-rose-300]="!scenario.indexUsable">{{ scenario.indexUsable ? '✓ Index exploitable' : '✕ Préfixe absent' }}</span><span class="mt-2 block text-sm text-white">{{ scenario.label }}</span></button></div>
      </section>

      <app-chapter-metrics chapter-metrics [metrics]="chapterMetrics" />
      <div chapter-charts></div>
      <app-pedagogy-panel chapter-conclusion observation="Un index existant peut conduire à un Index Scan, un Bitmap Scan ou être ignoré selon les lignes attendues." explanation="Le planner combine statistiques, sélectivité, coût des pages et ordre des colonnes pour comparer les plans." takeaway="La bonne structure ne suffit pas : PostgreSQL ne l’utilise que lorsque son coût estimé est favorable." accent="blue" />
    </app-chapter-layout>
  `
})
export class PostgresBridgeComponent {
  readonly tabs: readonly ChapterTab[] = [{ id: 'selectivity', label: 'Sélectivité', description: 'Choisir le type de scan' }, { id: 'dataset', label: 'Dataset', description: 'Comparer les distributions' }, { id: 'prefix', label: 'Préfixe gauche', description: 'Tester un index composite' }];
  activeTab: PostgresTab = 'selectivity';
  tableExponent = 6;
  selectivityPercent = 2;
  randomPageCost = 4;
  readonly selectivityPresets: readonly SelectivityPreset[] = [{ label: 'capteur_id', selectivity: 0.002, detail: '1 / 50 000' }, { label: 'alerte = TRUE', selectivity: 2, detail: 'index partiel' }, { label: 'qualite = 0', selectivity: 5, detail: 'cas limite' }, { label: 'qualite = 1', selectivity: 70, detail: 'valeur majoritaire' }];
  readonly iotScenarios = IOT_COLUMN_SCENARIOS;
  readonly prefixScenarios = PREFIX_QUERY_SCENARIOS;
  readonly compositeColumns = ['capteur_id', 'timestamp_utc'];
  readonly timelineDates = ['01/01', '01/02', '01/03', '01/04', '01/05'];
  activeIotId: IotColumnScenario['id'] = 'capteur_id';
  activePrefixId: PrefixQueryScenario['id'] = 'sensor';

  get tableRows(): number { return Math.round(10 ** this.tableExponent); }
  get plannerDecision(): PlannerDecisionEstimate { return estimatePlannerDecision({ tableRows: this.tableRows, selectivityPercent: this.selectivityPercent, randomPageCost: this.randomPageCost }); }
  get plannerCostBars(): BarDatum[] { const costs = this.plannerDecision.costs; return [{ label: 'Index', value: costs.index, color: '#34d399' }, { label: 'Bitmap', value: costs.bitmap, color: '#fbbf24' }, { label: 'Seq Scan', value: costs.sequential, color: '#fb7185' }]; }
  get winningCost(): number { return Math.min(...this.plannerCostBars.map(item => item.value)); }
  get activeIotScenario(): IotColumnScenario { return this.iotScenarios.find(scenario => scenario.id === this.activeIotId) ?? this.iotScenarios[0]; }
  get activePrefixScenario(): PrefixQueryScenario { return this.prefixScenarios.find(scenario => scenario.id === this.activePrefixId) ?? this.prefixScenarios[0]; }

  get chapterMetrics(): readonly ChapterMetric[] {
    if (this.activeTab === 'selectivity') return [
      { label: 'Lignes estimées', value: this.plannerDecision.estimatedRows.toLocaleString('fr-FR'), explanation: 'Lignes que le planner pense devoir retourner.', accent: 'blue' },
      { label: 'Coût gagnant', value: this.winningCost.toFixed(1), unit: 'u.c.', explanation: 'Plus faible coût parmi les trois plans simulés.', accent: 'amber' },
      { label: 'Plan choisi', value: this.plannerDecision.scanType, explanation: this.plannerDecision.explanation, accent: this.scanAccent(this.plannerDecision.scanType) }
    ];
    if (this.activeTab === 'dataset') return [
      { label: 'Cardinalité', value: this.activeIotScenario.cardinality, explanation: 'Nombre de valeurs distinctes ou ordre de grandeur.', accent: 'cyan' },
      { label: 'Sélectivité', value: this.activeIotScenario.typicalSelectivity, explanation: 'Part typique des lignes retournées.', accent: 'amber' },
      { label: 'Plan probable', value: this.activeIotScenario.scanType, explanation: this.activeIotScenario.strategy, accent: this.scanAccent(this.activeIotScenario.scanType) }
    ];
    return [
      { label: 'Préfixe gauche', value: this.activePrefixScenario.indexUsable ? 'Présent' : 'Absent', explanation: 'La première colonne de l’index est-elle contrainte ?', accent: this.activePrefixScenario.indexUsable ? 'emerald' : 'rose' },
      { label: 'Colonnes filtrées', value: this.activePrefixScenario.constrainedColumns.length, explanation: 'Colonnes de l’index présentes dans le prédicat.', accent: 'violet' },
      { label: 'Plan probable', value: this.activePrefixScenario.scanType, explanation: this.activePrefixScenario.explanation, accent: this.scanAccent(this.activePrefixScenario.scanType) }
    ];
  }

  setActiveTab(id: string): void { if (id === 'selectivity' || id === 'dataset' || id === 'prefix') this.activeTab = id; }
  activateSelectivityPreset(preset: SelectivityPreset): void { this.selectivityPercent = preset.selectivity; }
  selectIotScenario(id: IotColumnScenario['id']): void { this.activeIotId = id; }
  selectPrefixScenario(id: PrefixQueryScenario['id']): void { this.activePrefixId = id; }
  formatSelectivity(value: number): string { return value < 0.01 ? `${value.toFixed(3)} %` : `${value.toFixed(value < 10 ? 1 : 0)} %`; }
  scanPanelClass(scanType: ScanType): string { return { 'Index Scan': 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200', 'Bitmap Index Scan': 'border-amber-400/50 bg-amber-500/10 text-amber-200', 'Seq Scan': 'border-rose-400/50 bg-rose-500/10 text-rose-200' }[scanType]; }
  scanAccent(scanType: ScanType): 'emerald' | 'amber' | 'rose' { return { 'Index Scan': 'emerald' as const, 'Bitmap Index Scan': 'amber' as const, 'Seq Scan': 'rose' as const }[scanType]; }
  iotActiveClass(scenario: IotColumnScenario): string { return { violet: 'border-violet-400 bg-violet-500/10 text-violet-200', cyan: 'border-cyan-400 bg-cyan-500/10 text-cyan-200', rose: 'border-rose-400 bg-rose-500/10 text-rose-200', amber: 'border-amber-400 bg-amber-500/10 text-amber-200' }[scenario.accent]; }
  prefixColumnClass(column: string): string { return this.activePrefixScenario.constrainedColumns.includes(column) ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-500'; }
}
