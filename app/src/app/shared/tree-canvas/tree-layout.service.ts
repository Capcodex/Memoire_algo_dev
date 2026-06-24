import { Injectable } from '@angular/core';
import { BinaryTreeNode, MultiKeyTreeNode } from '../../core/models/tree.models';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: number;
  keys?: number[];
  isLeaf: boolean;
  balanceFactor?: number;
}

export interface LayoutEdge {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isLateral?: boolean; // Pour le chaînage des feuilles B+Tree
}

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class TreeLayoutService {
  
  // Paramètres pour arbres binaires
  private readonly BINARY_NODE_RADIUS = 20;
  private readonly BINARY_Y_SPACING = 60;
  private readonly BINARY_X_SPACING = 40;

  // Paramètres pour arbres B-Tree
  private readonly MULTI_KEY_WIDTH = 30; // largeur par clé
  private readonly MULTI_NODE_HEIGHT = 40;
  private readonly MULTI_Y_SPACING = 80;
  private readonly MULTI_X_SPACING = 20; // Espacement minimal entre nœuds frères

  public layoutBinaryTree(root: BinaryTreeNode | null): TreeLayout {
    if (!root) return { nodes: [], edges: [], width: 0, height: 0 };

    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];
    
    // Calcul in-order pour la coordonnée X
    let currentIndex = 0;
    
    const traverse = (node: BinaryTreeNode, depth: number) => {
      if (node.left) traverse(node.left, depth + 1);
      
      const x = currentIndex * this.BINARY_X_SPACING;
      const y = depth * this.BINARY_Y_SPACING;
      
      nodes.push({
        id: node.id,
        x,
        y,
        width: this.BINARY_NODE_RADIUS * 2,
        height: this.BINARY_NODE_RADIUS * 2,
        value: node.value,
        isLeaf: node.isLeaf,
        balanceFactor: node.balanceFactor
      });
      
      currentIndex++;
      
      if (node.right) traverse(node.right, depth + 1);
    };

    traverse(root, 0);

    // Centrer et calculer les arêtes
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    // Translation pour éviter X négatif ou collé au bord
    const paddingX = this.BINARY_NODE_RADIUS + 20;
    const paddingY = this.BINARY_NODE_RADIUS + 20;
    
    nodes.forEach(n => {
      n.x = n.x - minX + paddingX;
      n.y = n.y + paddingY;
    });

    // Créer les arêtes en utilisant les coordonnées finales
    const nodeMap = new Map<string, LayoutNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const buildEdges = (node: BinaryTreeNode) => {
      const source = nodeMap.get(node.id)!;
      if (node.left) {
        const target = nodeMap.get(node.left.id)!;
        edges.push({
          id: `edge-${source.id}-${target.id}`,
          sourceId: source.id,
          targetId: target.id,
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y
        });
        buildEdges(node.left);
      }
      if (node.right) {
        const target = nodeMap.get(node.right.id)!;
        edges.push({
          id: `edge-${source.id}-${target.id}`,
          sourceId: source.id,
          targetId: target.id,
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y
        });
        buildEdges(node.right);
      }
    };
    buildEdges(root);

    return {
      nodes,
      edges,
      width: maxX - minX + paddingX * 2,
      height: maxY + paddingY * 2
    };
  }

  public layoutMultiKeyTree(root: MultiKeyTreeNode | null, maxKeys: number = 4): TreeLayout {
    if (!root) return { nodes: [], edges: [], width: 0, height: 0 };

    const nodes: LayoutNode[] = [];
    const edges: LayoutEdge[] = [];
    
    // Pour B-Tree, un layout simple : Y basé sur depth, X basé sur la taille du sous-arbre.
    // On va faire un calcul post-order pour déterminer la largeur de chaque sous-arbre.
    const subtreeWidths = new Map<string, number>();

    const calculateWidths = (node: MultiKeyTreeNode) => {
      let width = 0;
      if (node.isLeaf) {
        width = Math.max(1, node.keys.length) * this.MULTI_KEY_WIDTH + this.MULTI_X_SPACING;
      } else {
        node.children?.forEach(c => {
          calculateWidths(c);
          width += subtreeWidths.get(c.id) ?? 0;
        });
      }
      subtreeWidths.set(node.id, width);
    };

    calculateWidths(root);

    const buildLayout = (node: MultiKeyTreeNode, depth: number, startX: number) => {
      const nodeWidth = Math.max(1, node.keys.length) * this.MULTI_KEY_WIDTH;
      const totalSubtreeWidth = subtreeWidths.get(node.id) ?? 0;
      
      // Placer le nœud au milieu de la zone allouée pour son sous-arbre
      const cx = startX + totalSubtreeWidth / 2;
      const y = depth * this.MULTI_Y_SPACING;
      
      const layoutNode: LayoutNode = {
        id: node.id,
        x: cx,
        y: y,
        width: nodeWidth,
        height: this.MULTI_NODE_HEIGHT,
        keys: [...node.keys],
        isLeaf: node.isLeaf
      };
      nodes.push(layoutNode);

      let childStartX = startX;
      if (!node.isLeaf && node.children) {
        node.children.forEach(child => {
          const childLayout = buildLayout(child, depth + 1, childStartX);
          
          edges.push({
            id: `edge-${node.id}-${child.id}`,
            sourceId: node.id,
            targetId: child.id,
            x1: cx,
            y1: y + this.MULTI_NODE_HEIGHT / 2,
            x2: childLayout.x,
            y2: childLayout.y - this.MULTI_NODE_HEIGHT / 2
          });
          
          childStartX += subtreeWidths.get(child.id) ?? 0;
        });
      }
      
      // Gestion du pointeur nextLeaf (B+Tree)
      if (node.nextLeaf) {
        // On ne crée pas l'arête tout de suite car la cible n'a pas encore ses coordonnées
        // On fera un passe après coup.
      }

      return layoutNode;
    };

    buildLayout(root, 0, 0);

    // Passes pour les feuilles B+Tree (latérales)
    const nodeMap = new Map<string, LayoutNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const addLateralEdges = (node: MultiKeyTreeNode) => {
      if (node.nextLeaf) {
        const source = nodeMap.get(node.id);
        const target = nodeMap.get(node.nextLeaf.id);
        if (source && target) {
          edges.push({
            id: `edge-lat-${source.id}-${target.id}`,
            sourceId: source.id,
            targetId: target.id,
            x1: source.x + source.width / 2,
            y1: source.y,
            x2: target.x - target.width / 2,
            y2: target.y,
            isLateral: true
          });
        }
      }
      if (!node.isLeaf && node.children) {
        node.children.forEach(c => addLateralEdges(c));
      }
    };
    addLateralEdges(root);

    const minX = Math.min(...nodes.map(n => n.x - n.width/2));
    const maxX = Math.max(...nodes.map(n => n.x + n.width/2));
    const maxY = Math.max(...nodes.map(n => n.y + n.height/2));

    const paddingY = this.MULTI_NODE_HEIGHT;
    nodes.forEach(n => {
      n.x = n.x - minX + 20;
      n.y = n.y + paddingY;
    });
    
    edges.forEach(e => {
      e.x1 = e.x1 - minX + 20;
      e.x2 = e.x2 - minX + 20;
      e.y1 += paddingY;
      e.y2 += paddingY;
    });

    return {
      nodes,
      edges,
      width: maxX - minX + 40,
      height: maxY + paddingY * 2
    };
  }
}
