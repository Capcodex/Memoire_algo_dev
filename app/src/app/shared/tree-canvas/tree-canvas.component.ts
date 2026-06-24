import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeLayout } from './tree-layout.service';
import { BinaryNodeComponent } from './binary-node.component';
import { MultiNodeComponent } from './multi-node.component';

@Component({
  selector: 'app-tree-canvas',
  standalone: true,
  imports: [CommonModule, BinaryNodeComponent, MultiNodeComponent],
  host: { class: 'block w-full h-full' },
  template: `
    <div class="w-full h-full overflow-hidden bg-slate-900/50 rounded-xl border border-slate-700/50 shadow-inner relative p-2">

      <svg *ngIf="layout"
           [attr.viewBox]="'0 0 ' + layout.width + ' ' + layout.height"
           width="100%"
           height="100%"
           preserveAspectRatio="xMidYMid meet"
           class="transition-all duration-500">
        
        <!-- Définition des filtres et marqueurs -->
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="fill-indigo-400" />
          </marker>
        </defs>

        <!-- Arêtes (Edges) -->
        <ng-container *ngFor="let edge of layout.edges">
          <!-- Arête normale (parent-enfant) -->
          <svg:path *ngIf="!edge.isLateral"
            [attr.d]="'M ' + edge.x1 + ' ' + edge.y1 + ' C ' + edge.x1 + ' ' + (edge.y1 + 40) + ', ' + edge.x2 + ' ' + (edge.y2 - 40) + ', ' + edge.x2 + ' ' + edge.y2"
            fill="transparent"
            class="stroke-slate-600 stroke-2 transition-all duration-500 ease-in-out"
            [class.stroke-blue-400]="isEdgeHighlighted(edge.id)"
          />
          
          <!-- Arête latérale (chaînage feuilles B+Tree) -->
          <svg:line *ngIf="edge.isLateral"
            [attr.x1]="edge.x1"
            [attr.y1]="edge.y1"
            [attr.x2]="edge.x2"
            [attr.y2]="edge.y2"
            stroke-dasharray="5,5"
            marker-end="url(#arrow)"
            class="stroke-indigo-400 stroke-2 transition-all duration-500 ease-in-out opacity-70"
            [class.opacity-100]="isEdgeHighlighted(edge.id)"
            [class.stroke-pink-500]="isEdgeHighlighted(edge.id)"
          />
        </ng-container>

        <!-- Nœuds (Nodes) -->
        <ng-container *ngFor="let node of layout.nodes">
          <svg:g *ngIf="isBinaryNode(node)" 
                 app-binary-node 
                 [node]="node" 
                 [isHighlighted]="isNodeHighlighted(node.id)">
          </svg:g>

          <svg:g *ngIf="isMultiNode(node)" 
                 app-multi-node 
                 [node]="node" 
                 [isHighlighted]="isNodeHighlighted(node.id)">
          </svg:g>
        </ng-container>
      </svg>
      
      <!-- État vide -->
      <div *ngIf="!layout || layout.nodes.length === 0" class="absolute text-slate-500 font-medium">
        L'arbre est vide
      </div>
    </div>
  `
})
export class TreeCanvasComponent {
  @Input() layout: TreeLayout | null = null;
  @Input() highlightedNodeIds: string[] = [];
  
  // Dans un vrai projet, le type d'arbre (binaire vs multi) pourrait être un Input du canvas,
  // ou on peut le déduire de la présence de keys vs value.
  isBinaryNode(node: any): boolean {
    return node.value !== undefined;
  }

  isMultiNode(node: any): boolean {
    return node.keys !== undefined;
  }

  isNodeHighlighted(id: string): boolean {
    return this.highlightedNodeIds.includes(id);
  }

  isEdgeHighlighted(_edgeId: string): boolean {
    return false;
  }
}
