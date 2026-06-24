import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutNode } from './tree-layout.service';

@Component({
  selector: '[app-binary-node]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:circle 
      [attr.cx]="node.x" 
      [attr.cy]="node.y" 
      [attr.r]="node.width / 2" 
      [class.fill-blue-500]="isHighlighted"
      [class.fill-slate-800]="!isHighlighted"
      [attr.filter]="isHighlighted ? 'url(#glow)' : null"
      class="stroke-white stroke-2 transition-all duration-500 ease-in-out hover:stroke-blue-400 cursor-pointer shadow-xl drop-shadow-md"
    />
    <svg:text 
      [attr.x]="node.x" 
      [attr.y]="node.y" 
      dominant-baseline="middle" 
      text-anchor="middle" 
      class="fill-white font-bold text-sm select-none pointer-events-none transition-all duration-500"
    >
      {{ node.value }}
    </svg:text>
    <svg:text *ngIf="node.balanceFactor !== undefined"
      [attr.x]="node.x + node.width / 2 + 5" 
      [attr.y]="node.y - node.height / 2" 
      class="fill-orange-400 font-mono text-xs select-none pointer-events-none"
    >
      BF:{{ node.balanceFactor }}
    </svg:text>
  `
})
export class BinaryNodeComponent {
  @Input({ required: true }) node!: LayoutNode;
  @Input() isHighlighted: boolean = false;
}
