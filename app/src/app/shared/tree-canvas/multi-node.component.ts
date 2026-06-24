import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutNode } from './tree-layout.service';

@Component({
  selector: '[app-multi-node]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g class="transition-all duration-500 ease-in-out drop-shadow-md">
      <!-- Cadre du nœud (Rectangle global) -->
      <svg:rect 
        [attr.x]="node.x - node.width / 2" 
        [attr.y]="node.y - node.height / 2" 
        [attr.width]="node.width" 
        [attr.height]="node.height" 
        rx="6" ry="6"
        [class.fill-indigo-600]="isHighlighted"
        [class.fill-slate-800]="!isHighlighted"
        [attr.filter]="isHighlighted ? 'url(#glow)' : null"
        class="stroke-white stroke-2 transition-all duration-500 ease-in-out hover:stroke-indigo-400 cursor-pointer"
      />
      
      <!-- Lignes de séparation internes et Textes pour chaque clé -->
      <ng-container *ngIf="node.keys">
        <ng-container *ngFor="let key of node.keys; let i = index">
          <!-- Séparateur vertical (sauf pour la première clé) -->
          <svg:line *ngIf="i > 0"
            [attr.x1]="node.x - node.width / 2 + i * (node.width / node.keys.length)"
            [attr.y1]="node.y - node.height / 2"
            [attr.x2]="node.x - node.width / 2 + i * (node.width / node.keys.length)"
            [attr.y2]="node.y + node.height / 2"
            class="stroke-white/30 stroke-1"
          />
          
          <!-- Texte de la clé -->
          <svg:text 
            [attr.x]="node.x - node.width / 2 + (i + 0.5) * (node.width / node.keys.length)" 
            [attr.y]="node.y" 
            dominant-baseline="middle" 
            text-anchor="middle" 
            class="fill-white font-bold text-sm select-none pointer-events-none"
          >
            {{ key }}
          </svg:text>
        </ng-container>
      </ng-container>
    </svg:g>
  `
})
export class MultiNodeComponent {
  @Input({ required: true }) node!: LayoutNode;
  @Input() isHighlighted: boolean = false;
}
