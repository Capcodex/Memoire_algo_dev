import { Component, EventEmitter, Input, OnDestroy, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationSequence, AnimationStep } from '../../core/models/animation.models';

@Component({
  selector: 'app-animation-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel w-full flex flex-col gap-3 p-4">

      <!-- Description de l'étape courante -->
      <p class="min-h-[2.75rem] rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-center text-sm leading-snug text-slate-200">
        {{ currentStepDescription || "En attente d'une animation..." }}
      </p>

      <!-- Boutons de navigation + compteur -->
      <div class="flex items-center gap-1.5">
        <button (click)="reset()" [disabled]="!sequence || currentStepIndex === 0"
          title="Revenir au début"
          class="rounded-full p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
        </button>
        <button (click)="stepBackward()" [disabled]="!sequence || currentStepIndex === 0"
          title="Étape précédente"
          class="rounded-full p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button (click)="togglePlay()" [disabled]="!sequence || currentStepIndex >= totalSteps - 1"
          class="rounded-full bg-blue-600 p-2.5 text-white shadow-md hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all hover:scale-105 active:scale-95">
          <svg *ngIf="isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          <svg *ngIf="!isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button (click)="stepForward()" [disabled]="!sequence || currentStepIndex >= totalSteps - 1"
          title="Étape suivante"
          class="rounded-full p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <span class="ml-auto font-mono text-xs text-slate-400 tabular-nums">
          {{ sequence ? (currentStepIndex + 1) + ' / ' + totalSteps : '— / —' }}
        </span>
      </div>

      <!-- Vitesse + barre de progression -->
      <div class="flex items-center gap-3">
        <label class="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
          <span class="select-none">Vitesse</span>
          <select [value]="speed" (change)="onSpeedChange($event)"
            class="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option [value]="1000">×1</option>
            <option [value]="500">×2</option>
            <option [value]="200">×5</option>
          </select>
        </label>
        <div class="relative flex-1 cursor-pointer group" (click)="onProgressBarClick($event)">
          <div class="h-1.5 w-full rounded-full bg-slate-700">
            <div class="absolute inset-y-0 left-0 w-full rounded-full bg-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="h-1.5 rounded-full bg-blue-500 transition-all duration-300" [style.width.%]="progressPercentage"></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnimationPlayerComponent implements OnChanges, OnDestroy {
  @Input() sequence: AnimationSequence<any> | null = null;
  
  // Émet l'état courant pour que le parent mette à jour le canvas
  @Output() stepChanged = new EventEmitter<AnimationStep<any>>();

  public currentStepIndex = 0;
  public isPlaying = false;
  public speed = 500; // ms
  private timerId: any = null;

  get totalSteps(): number {
    return this.sequence?.steps.length ?? 0;
  }

  get currentStepDescription(): string {
    if (!this.sequence || this.totalSteps === 0) return '';
    return this.sequence.steps[this.currentStepIndex].description;
  }

  get progressPercentage(): number {
    if (this.totalSteps <= 1) return 0;
    return (this.currentStepIndex / (this.totalSteps - 1)) * 100;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sequence'] && this.sequence) {
      this.reset();
      // On lance automatiquement si une nouvelle séquence arrive
      if (this.totalSteps > 0) {
        this.emitCurrentStep();
        this.play();
      }
    }
  }

  ngOnDestroy() {
    this.pause();
  }

  onSpeedChange(event: any) {
    this.speed = parseInt(event.target.value, 10);
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      // Si on est à la fin, on recommence
      if (this.currentStepIndex >= this.totalSteps - 1) {
        this.currentStepIndex = 0;
        this.emitCurrentStep();
      }
      this.play();
    }
  }

  play() {
    if (this.totalSteps === 0 || this.currentStepIndex >= this.totalSteps - 1) return;
    this.isPlaying = true;
    
    this.timerId = setInterval(() => {
      this.stepForward();
      if (this.currentStepIndex >= this.totalSteps - 1) {
        this.pause();
      }
    }, this.speed);
  }

  pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reset() {
    this.pause();
    this.currentStepIndex = 0;
    if (this.sequence && this.totalSteps > 0) {
      this.emitCurrentStep();
    }
  }

  stepForward() {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++;
      this.emitCurrentStep();
    }
  }

  stepBackward() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.emitCurrentStep();
    }
  }

  private emitCurrentStep() {
    if (this.sequence && this.sequence.steps[this.currentStepIndex]) {
      this.stepChanged.emit(this.sequence.steps[this.currentStepIndex]);
    }
  }

  onProgressBarClick(event: MouseEvent) {
    if (this.totalSteps <= 1) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    // Calculate new index
    const newIndex = Math.round(percentage * (this.totalSteps - 1));
    
    if (newIndex !== this.currentStepIndex) {
      this.currentStepIndex = newIndex;
      this.emitCurrentStep();
      
      // If playing, pause and resume to reset timer
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    }
  }
}
