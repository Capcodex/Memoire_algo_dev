import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ChapterTab {
  id: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-chapter-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-2 sm:grid-cols-3" role="tablist" [attr.aria-label]="ariaLabel">
      <button *ngFor="let tab of tabs" type="button" role="tab" class="rounded-xl border px-4 py-3 text-left transition" [attr.aria-selected]="tab.id === activeId" [ngClass]="tab.id === activeId ? 'border-violet-400/50 bg-violet-500/15 text-white' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'" (click)="activeIdChange.emit(tab.id)">
        <span class="block text-sm font-bold">{{ tab.label }}</span><span class="mt-1 block text-xs opacity-70">{{ tab.description }}</span>
      </button>
    </nav>
  `
})
export class ChapterTabsComponent {
  @Input() tabs: readonly ChapterTab[] = [];
  @Input() activeId = '';
  @Input() ariaLabel = 'Laboratoires du chapitre';
  @Output() readonly activeIdChange = new EventEmitter<string>();
}
