import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChapterAccent } from './chapter.models';

@Component({
  selector: 'app-concept-brief',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35" aria-label="Concept essentiel">
      <div class="grid divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <article class="p-4">
          <p class="text-[0.65rem] font-bold uppercase tracking-[0.18em]" [ngClass]="accentTextClass">Concept</p>
          <p class="mt-2 text-sm leading-relaxed text-slate-200">{{ concept }}</p>
        </article>
        <article class="p-4">
          <p class="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-rose-400">Problème résolu</p>
          <p class="mt-2 text-sm leading-relaxed text-slate-300">{{ problemSolved }}</p>
        </article>
        <article class="p-4" [ngClass]="accentBackgroundClass">
          <p class="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-400">À observer</p>
          <p class="mt-2 text-sm font-medium leading-relaxed text-white">{{ demoQuestion }}</p>
        </article>
      </div>
    </section>
  `
})
export class ConceptBriefComponent {
  @Input({ required: true }) concept = '';
  @Input({ required: true }) problemSolved = '';
  @Input({ required: true }) demoQuestion = '';
  @Input() accent: ChapterAccent = 'blue';

  get accentTextClass(): string {
    return {
      rose: 'text-rose-400', orange: 'text-orange-400', amber: 'text-amber-400', emerald: 'text-emerald-400',
      violet: 'text-violet-400', cyan: 'text-cyan-400', blue: 'text-blue-400', slate: 'text-slate-400'
    }[this.accent];
  }

  get accentBackgroundClass(): string {
    return {
      rose: 'bg-rose-500/5', orange: 'bg-orange-500/5', amber: 'bg-amber-500/5', emerald: 'bg-emerald-500/5',
      violet: 'bg-violet-500/5', cyan: 'bg-cyan-500/5', blue: 'bg-blue-500/5', slate: 'bg-slate-500/5'
    }[this.accent];
  }
}
