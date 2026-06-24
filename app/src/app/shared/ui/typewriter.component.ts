import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typewriter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-block">
      <ng-container *ngFor="let char of displayedChars; let i = index">
        <span class="animate-[fade-in_0.1s_ease-out_forwards]" [style.animation-delay.ms]="i * speed">{{ char === ' ' ? '&nbsp;' : char }}</span>
      </ng-container>
    </span>
  `
})
export class TypewriterComponent implements OnChanges {
  @Input({ required: true }) text: string = '';
  @Input() speed: number = 15; // ms per char

  displayedChars: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['text']) {
      this.displayedChars = Array.from(this.text);
    }
  }
}
