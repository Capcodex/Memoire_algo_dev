import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="demo-page">
      <main class="mx-auto w-full max-w-[100rem] space-y-6 pb-12">

        <!-- TITRE + ACCROCHE -->
        <header class="chapter-header p-6 sm:p-10">
          <div class="relative z-10">
            <p class="chapter-kicker text-violet-400">Mémoire · Structures d'indexation</p>
            <h1 class="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">
              Du BST au B+Tree<br class="hidden sm:block" /> de PostgreSQL
            </h1>
            <div class="mt-6 flex max-w-3xl items-center gap-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5">
              <span class="shrink-0 text-3xl">⚡</span>
              <p class="text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">
                Une requête sur 1 million de données s'exécute en
                <strong class="font-black text-cyan-300">0,017 ms</strong> avec un index,
                <strong class="font-black text-rose-300">132 ms</strong> sans.
                <strong class="text-white">Pourquoi&nbsp;?</strong>
              </p>
            </div>
          </div>
        </header>

        <!-- 3 BLOCS VISUELS DE PROGRESSION -->
        <section class="glass-panel p-5 sm:p-8" aria-label="Progression des structures">
          <p class="chapter-kicker text-slate-500 mb-6">Progression des structures</p>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch">

            <!-- BST -->
            <div class="flex flex-1 flex-col rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
              <p class="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">01 · BST</p>
              <p class="mt-2 text-2xl font-black text-white">O(log n)</p>
              <p class="mt-2 text-sm text-slate-400">Arbre de recherche binaire</p>
              <div class="mt-4 flex-1 space-y-2 text-sm">
                <p class="text-slate-300">mais dégénère sur données triées</p>
                <p class="text-rose-300">✗ Hauteur n − 1 dans le pire cas</p>
              </div>
            </div>

            <!-- Flèche 1 -->
            <div class="flex shrink-0 items-center justify-center text-2xl font-black text-slate-600">
              <span class="hidden lg:block">→</span>
              <span class="block lg:hidden">↓</span>
            </div>

            <!-- AVL -->
            <div class="flex flex-1 flex-col rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5">
              <p class="font-mono text-xs font-bold uppercase tracking-wider text-orange-400">02 · AVL</p>
              <p class="mt-2 text-2xl font-black text-white">Équilibrage</p>
              <p class="mt-2 text-sm text-slate-400">en mémoire garanti</p>
              <div class="mt-4 flex-1 space-y-2 text-sm">
                <p class="text-emerald-300">✓ Hauteur logarithmique garantie</p>
                <p class="text-orange-300">✗ 1 page disque par nœud (B-Tree corrige ça)</p>
              </div>
            </div>

            <!-- Flèche 2 -->
            <div class="flex shrink-0 items-center justify-center text-2xl font-black text-slate-600">
              <span class="hidden lg:block">→</span>
              <span class="block lg:hidden">↓</span>
            </div>

            <!-- B+Tree -->
            <div class="flex flex-1 flex-col rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
              <p class="font-mono text-xs font-bold uppercase tracking-wider text-violet-400">03 · B+Tree</p>
              <p class="mt-2 text-2xl font-black text-white">Optimisé disque</p>
              <p class="mt-2 font-mono text-xs text-violet-300">PostgreSQL · CREATE INDEX</p>
              <div class="mt-4 flex-1 space-y-2 text-sm">
                <p class="text-emerald-300">✓ Plusieurs clés par page</p>
                <p class="text-emerald-300">✓ Index Scan / Seq Scan</p>
              </div>
            </div>

          </div>
        </section>

        <!-- PROBLÉMATIQUE -->
        <section class="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-6 sm:p-8" aria-label="Problématique">
          <p class="chapter-kicker text-violet-400 mb-4">Problématique</p>
          <blockquote class="border-l-4 border-violet-400 pl-5 text-lg font-semibold leading-relaxed text-white sm:text-xl">
            Comment la progression du BST au B+Tree, en passant par l'équilibrage AVL,
            permet-elle d'expliquer le comportement des index PostgreSQL face à un dataset
            de relevés IoT à fort volume&nbsp;?
          </blockquote>
        </section>

        <!-- DATASET -->
        <section class="glass-panel p-5 sm:p-7" aria-label="Terrain d'expérimentation">
          <div class="mb-5">
            <p class="chapter-kicker text-cyan-400">Terrain d'expérimentation</p>
            <h2 class="mt-1 text-xl font-bold text-white">Génération d'un dataset pour les tests</h2>
            <p class="mt-1 text-sm text-slate-500">3 tables · PostgreSQL · Docker</p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">

            <!-- sites -->
            <div class="flex flex-1 flex-col rounded-xl border border-slate-700/50 bg-slate-950/50 p-4">
              <p class="font-mono text-[0.65rem] uppercase tracking-wider text-slate-500">TABLE</p>
              <h3 class="mt-1 text-lg font-black text-white">sites</h3>
              <p class="mt-3 text-3xl font-black text-slate-200">8</p>
              <p class="mt-1 text-xs text-slate-500">lignes · Stations de mesure</p>
            </div>

            <div class="flex items-center justify-center text-xl font-bold text-slate-600">→</div>

            <!-- capteurs -->
            <div class="flex flex-1 flex-col rounded-xl border border-slate-700/50 bg-slate-950/50 p-4">
              <p class="font-mono text-[0.65rem] uppercase tracking-wider text-slate-500">TABLE</p>
              <h3 class="mt-1 text-lg font-black text-white">capteurs</h3>
              <p class="mt-3 text-3xl font-black text-slate-200">5 000</p>
              <p class="mt-1 text-xs text-slate-500">lignes · Appareils par site</p>
            </div>

            <div class="flex items-center justify-center text-xl font-bold text-slate-600">→</div>

            <!-- relevés -->
            <div class="flex flex-1 flex-col rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <p class="font-mono text-[0.65rem] uppercase tracking-wider text-cyan-400">TABLE PRINCIPALE</p>
              <h3 class="mt-1 text-lg font-black text-white">relevés</h3>
              <p class="mt-3 text-3xl font-black text-cyan-300">1 000 000</p>
              <p class="mt-1 text-xs text-slate-500">lignes · Mesures horodatées</p>
            </div>

          </div>
        </section>

        <!-- CTA -->
        <div class="flex justify-center pt-2">
          <a routerLink="/bst" class="glass-button px-10 py-4 text-center text-lg font-bold">
            Commencer la démonstration →
          </a>
        </div>

      </main>
    </div>
  `
})
export class IntroComponent {}
