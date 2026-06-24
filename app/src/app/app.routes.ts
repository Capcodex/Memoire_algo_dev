import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'intro', pathMatch: 'full' },
  { 
    path: 'intro', 
    loadComponent: () => import('./features/intro/intro.component').then(m => m.IntroComponent)
  },
  { 
    path: 'bst', 
    loadComponent: () => import('./features/bst/bst.component').then(m => m.BstComponent)
  },
  {
    path: 'avl',
    loadComponent: () => import('./features/avl/avl.component').then(m => m.AvlComponent)
  },
  {
    path: 'btree',
    loadComponent: () => import('./features/btree/btree.component').then(m => m.BTreeComponent)
  },
  {
    path: 'bplustree',
    loadComponent: () => import('./features/bplustree/bplustree.component').then(m => m.BPlusTreeComponent)
  },
  {
    path: 'write-cost',
    loadComponent: () => import('./features/write-cost/write-cost.component').then(m => m.WriteCostComponent)
  },
  {
    path: 'postgres-bridge',
    loadComponent: () => import('./features/postgres-bridge/postgres-bridge.component').then(m => m.PostgresBridgeComponent)
  },
  {
    path: 'conclusion',
    loadComponent: () => import('./features/conclusion/conclusion.component').then(m => m.ConclusionComponent)
  }
];
