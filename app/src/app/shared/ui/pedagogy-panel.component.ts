import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpotlightDirective } from './spotlight.directive';

export type PedagogyAccent = 'rose' | 'orange' | 'emerald' | 'amber' | 'violet' | 'blue' | 'cyan';
export type PedagogyLayout = 'wide' | 'stacked';

@Component({
  selector: 'app-pedagogy-panel',
  standalone: true,
  imports: [CommonModule, SpotlightDirective],
  template: `
    <section class="glass-panel overflow-hidden" aria-label="Synthèse pédagogique">
      <div [ngClass]="containerClass">
        <article class="p-4">
          <p class="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sky-400">Ce qu'on observe</p>
          <p class="text-sm leading-relaxed text-slate-300">{{ observation }}</p>
        </article>
        <article class="p-4">
          <p class="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-amber-400">Pourquoi</p>
          <p class="text-sm leading-relaxed text-slate-300">{{ explanation }}</p>
        </article>
        <article class="p-4" [ngClass]="takeawayClass">
          <p class="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em]" [ngClass]="accentTextClass">À retenir</p>
          <p class="text-sm font-medium leading-relaxed text-slate-100">{{ takeaway }}</p>
        </article>
      </div>
    </section>
  `
})
export class PedagogyPanelComponent {
  @Input({ required: true }) observation = '';
  @Input({ required: true }) explanation = '';
  @Input({ required: true }) takeaway = '';
  @Input() accent: PedagogyAccent = 'blue';
  @Input() layout: PedagogyLayout = 'wide';

  get containerClass(): string {
    return this.layout === 'stacked'
      ? 'grid grid-cols-1 divide-y divide-white/10'
      : 'grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0';
  }

  get takeawayClass(): string {
    return {
      rose: 'bg-rose-500/5',
      orange: 'bg-orange-500/5',
      emerald: 'bg-emerald-500/5',
      amber: 'bg-amber-500/5',
      violet: 'bg-violet-500/5',
      blue: 'bg-blue-500/5',
      cyan: 'bg-cyan-500/5'
    }[this.accent];
  }

  get accentTextClass(): string {
    return {
      rose: 'text-rose-400',
      orange: 'text-orange-400',
      emerald: 'text-emerald-400',
      amber: 'text-amber-400',
      violet: 'text-violet-400',
      blue: 'text-blue-400',
      cyan: 'text-cyan-400'
    }[this.accent];
  }
}
