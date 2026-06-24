import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChapterLayoutComponent } from '../../shared/chapter-layout/chapter-layout.component';
import { ChapterMetric } from '../../shared/chapter-layout/chapter.models';
import { ChapterMetricsComponent } from '../../shared/chapter-layout/chapter-metrics.component';
import { ConceptBriefComponent } from '../../shared/chapter-layout/concept-brief.component';
import { PedagogyPanelComponent } from '../../shared/ui/pedagogy-panel.component';

interface EvolutionStep {
  structure: string;
  path: string;
  limit: string;
  gain: string;
  accent: string;
  borderAccent: string;
}

interface DecisionRow {
  structure: string;
  quand: string;
  condition: string;
  accent: string;
}


@Component({
  selector: 'app-conclusion',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ChapterLayoutComponent,
    ConceptBriefComponent,
    ChapterMetricsComponent,
    PedagogyPanelComponent
  ],
  template: `
    <app-chapter-layout>

      <!-- HEADER -->
      <div chapter-header class="chapter-header">
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div class="max-w-4xl">
            <p class="chapter-kicker text-emerald-400">Conclusion generale</p>
            <h1 class="mt-1 text-2xl font-bold text-white">Trois structures, une contrainte qui evolue</h1>
            <p class="mt-2 text-sm leading-relaxed text-slate-300">
              La contrainte dominante glisse des comparaisons en memoire vers les acces disque -
              le B+Tree repond a chaque etape de la progression.
            </p>
          </div>
          <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <strong>Reponse :</strong> 2-3 acces disque par recherche sur 1 million de lignes.
          </div>
        </div>
      </div>

      <!-- CONCEPT -->
      <app-concept-brief
        chapter-concept
        concept="Chaque structure repond a la limite de la precedente."
        problemSolved="La progression BST vers AVL vers B+Tree suit l'evolution de la contrainte dominante : comparaisons, equilibrage, pages disque."
        demoQuestion="Comparez les trois structures cles, le tableau de decision et les perspectives au-dela du B+Tree PostgreSQL."
        accent="emerald" />

      <!-- VISUAL -->
      <div chapter-visual class="flex h-full min-h-[20rem] flex-col gap-5">

        <ng-container *ngIf="!recapMode()">

          <!-- 3 cartes de structures -->
          <div class="grid gap-4 lg:grid-cols-3">

            <div class="flex flex-col rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
              <p class="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">BST</p>
              <p class="mt-2 text-lg font-bold text-white">O(log n) en theorie</p>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-400">Degenere sur donnees ordonnees - les series temporelles sont le pire cas.</p>
              <div class="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
                <p class="font-mono text-xs text-rose-300">h = n minus 1 dans le pire cas</p>
              </div>
            </div>

            <div class="flex flex-col rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5">
              <p class="font-mono text-xs font-bold uppercase tracking-wider text-orange-400">AVL</p>
              <p class="mt-2 text-lg font-bold text-white">O(log n) garanti</p>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-400">Resout le BST en RAM - mais 1 noeud = 1 acces disque, prohibitif en base.</p>
              <div class="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
                <p class="font-mono text-xs text-orange-300">h log2 n garanti</p>
              </div>
            </div>

            <div class="flex flex-col rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-5">
              <p class="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">B+Tree</p>
              <p class="mt-2 text-lg font-bold text-white">2-3 acces disque</p>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-400">Noeud = page disque, feuilles chainees pour les requetes de plage.</p>
              <div class="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <p class="font-mono text-xs text-emerald-300">PostgreSQL - CREATE INDEX</p>
              </div>
            </div>

          </div>

          <!-- 3 metriques cles + encart conclusion -->
          <div class="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_2fr]">

            <div class="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 text-center">
              <p class="text-xs text-slate-500">Lecture</p>
              <p class="mt-1 text-3xl font-black text-emerald-400">x7 700</p>
              <p class="mt-1 text-[0.65rem] text-slate-500">0,017 ms vs 132 ms</p>
            </div>

            <div class="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 text-center">
              <p class="text-xs text-slate-500">Ecriture</p>
              <p class="mt-1 text-3xl font-black text-rose-400">x2,3</p>
              <p class="mt-1 text-[0.65rem] text-slate-500">569 ms vs 1 294 ms</p>
            </div>

            <div class="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 text-center">
              <p class="text-xs text-slate-500">Selectivite limite</p>
              <p class="mt-1 text-3xl font-black text-slate-300">~10 %</p>
              <p class="mt-1 text-[0.65rem] text-slate-500">Au-dela Seq Scan</p>
            </div>

            <div class="flex flex-col justify-center rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 px-5 py-4">
              <p class="text-sm font-bold text-white">Un index n'est pas une solution universelle</p>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">La selectivite de la colonne, la nature de la requete et le volume de resultats determinent si l'optimiseur l'utilise.</p>
            </div>

          </div>

        </ng-container>

        <ng-container *ngIf="recapMode()">

          <!-- Recap : 5 cartes de chapitres navigables -->
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <a *ngFor="let step of evolutionSteps"
               [routerLink]="step.path"
               class="group flex flex-col rounded-2xl border bg-slate-950/40 p-4 transition hover:-translate-y-1 hover:border-white/25"
               [ngClass]="step.borderAccent">
              <span class="font-mono text-xs font-bold" [ngClass]="step.accent">{{ step.structure }}</span>
              <span class="mt-2 text-sm font-semibold text-white">{{ step.gain }}</span>
              <span class="mt-2 flex-1 text-xs text-slate-500">{{ step.limit }}</span>
              <span class="mt-3 text-xs font-semibold text-slate-400 transition-colors group-hover:text-white">Revoir</span>
            </a>
          </div>

          <div class="flex flex-wrap justify-center gap-4">
            <a routerLink="/intro" class="glass-button-secondary px-6 py-2.5 text-sm">Retour au sommaire</a>
          </div>

        </ng-container>

      </div>

      <!-- CONTROLS -->
      <div chapter-controls class="control-panel">
        <div class="flex flex-wrap items-center gap-5">
          <div>
            <p class="text-sm font-semibold text-white">Mode d'affichage</p>
            <p class="mt-0.5 text-xs text-slate-400">Basculez entre la reponse finale et le recapitulatif par chapitre.</p>
          </div>
          <button type="button" (click)="recapMode.set(!recapMode())"
            class="rounded-xl border px-5 py-2.5 text-sm font-semibold transition"
            [ngClass]="recapMode()
              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
              : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'">
            {{ recapMode() ? 'Voir la reponse finale' : 'Recapitulatif par chapitre' }}
          </button>
        </div>
      </div>

      <!-- METRICS -->
      <app-chapter-metrics chapter-metrics [metrics]="summaryMetrics" />

      <!-- CHARTS -->
      <div chapter-charts class="space-y-8">

        <ng-container *ngIf="!recapMode()">

          <!-- Tableau de decision -->
          <section class="space-y-4 border-t border-white/10 pt-6">
            <div>
              <p class="chapter-kicker text-emerald-400">Quand utiliser quelle structure ?</p>
              <h2 class="mt-1 text-xl font-bold text-white">Tableau de d&#233;cision</h2>
            </div>
            <div class="overflow-x-auto rounded-2xl border border-white/10">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-white/10 bg-slate-950/60 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th class="px-4 py-3">Structure / Operation</th>
                    <th class="px-4 py-3">Cas d'usage</th>
                    <th class="px-4 py-3">Condition</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr *ngFor="let row of decisionTable" class="transition-colors hover:bg-white/[0.02]">
                    <td class="px-4 py-3 font-mono text-xs font-bold" [ngClass]="row.accent">{{ row.structure }}</td>
                    <td class="px-4 py-3 text-slate-300">{{ row.quand }}</td>
                    <td class="px-4 py-3 text-slate-400">{{ row.condition }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Question ouverte -->
          <section class="space-y-4 border-t border-white/10 pt-6">
            <div>
              <p class="chapter-kicker text-slate-400">Pour aller plus loin</p>
              <h2 class="mt-1 text-xl font-bold text-white">Une question ouverte</h2>
            </div>
            <div class="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-7 sm:p-10">
              <p class="text-xl font-semibold leading-relaxed text-white sm:text-2xl">
                {{ openingQuestion }}
              </p>
            </div>
          </section>

        </ng-container>

      </div>

      <!-- CONCLUSION -->
      <app-pedagogy-panel
        chapter-conclusion
        observation="Le B+Tree minimise les entrees-sorties disque, mais son benefice depend de la selectivite de la requete."
        explanation="L'optimiseur PostgreSQL arbitre entre Index Scan et Seq Scan selon le cout estime - le seuil est autour de 10 % des lignes retournees."
        takeaway="Choisir une structure d'index, c'est choisir le cout dominant que l'on veut reduire - et accepter le compromis sur l'autre."
        accent="emerald" />

    </app-chapter-layout>
  `
})
export class ConclusionComponent {
  readonly recapMode = signal(false);

  readonly evolutionSteps: readonly EvolutionStep[] = [
    {
      structure: 'BST',
      path: '/bst',
      limit: 'Degenere sur donnees ordonnees - series temporelles = pire cas.',
      gain: 'O(log n) en theorie',
      accent: 'text-rose-300',
      borderAccent: 'border-rose-500/30'
    },
    {
      structure: 'AVL',
      path: '/avl',
      limit: '1 noeud = 1 acces disque, prohibitif en base de donnees.',
      gain: 'O(log n) garanti en memoire',
      accent: 'text-orange-300',
      borderAccent: 'border-orange-500/30'
    },
    {
      structure: 'B-Tree',
      path: '/btree',
      limit: 'Cles dans les noeuds internes reduisent la capacite des feuilles.',
      gain: 'Plusieurs cles par page disque',
      accent: 'text-amber-300',
      borderAccent: 'border-amber-500/30'
    },
    {
      structure: 'B+Tree',
      path: '/bplustree',
      limit: 'Surcout d\'ecriture x2,3 a maintenir sur chaque insertion.',
      gain: '2-3 acces disque, feuilles chainees',
      accent: 'text-emerald-300',
      borderAccent: 'border-emerald-500/30'
    },
    {
      structure: 'PostgreSQL',
      path: '/postgres-bridge',
      limit: 'Un index disponible n\'est pas toujours utilise par le planner.',
      gain: 'Planner optimise selon la selectivite',
      accent: 'text-blue-300',
      borderAccent: 'border-blue-500/30'
    }
  ];

  readonly decisionTable: readonly DecisionRow[] = [
    {
      structure: 'AVL',
      quand: 'Donnees dynamiques en memoire vive',
      condition: 'Pas d\'acces disque, mise a jour frequente',
      accent: 'text-orange-300'
    },
    {
      structure: 'B-Tree',
      quand: 'Recherches par egalite sur disque',
      condition: 'Donnees peu ordonnees, cles courtes',
      accent: 'text-amber-300'
    },
    {
      structure: 'B+Tree',
      quand: 'Index PostgreSQL, requetes de plage',
      condition: 'CREATE INDEX, ORDER BY, BETWEEN',
      accent: 'text-emerald-300'
    },
    {
      structure: 'Index Scan',
      quand: 'Ligne cible tres selective',
      condition: 'Moins de 10 % des tuples retournes',
      accent: 'text-violet-300'
    },
    {
      structure: 'Seq Scan',
      quand: 'Lecture de la majorite des lignes',
      condition: 'Selectivite superieure a 10 %, table petite',
      accent: 'text-slate-400'
    }
  ];

  readonly openingQuestion = "Si l'index B+Tree multiplie la vitesse de lecture par 7 700 mais ralentit les ecritures d'un facteur 2,3, quel ratio lectures/ecritures le justifie - et que faire quand les insertions IoT dominent ?";

  get summaryMetrics(): readonly ChapterMetric[] {
    return [
      {
        label: 'Gain lecture',
        value: 'x7 700',
        explanation: '0,017 ms avec index vs 132 ms sans index sur 1 million de lignes.',
        accent: 'emerald'
      },
      {
        label: 'Surcout ecriture',
        value: 'x2,3',
        explanation: '569 ms sans index vs 1 294 ms avec index pour 1 000 insertions.',
        accent: 'rose'
      },
      {
        label: 'Selectivite limite',
        value: '~10 %',
        explanation: "Au-dela de 10 % des lignes retournees, le planner prefere Seq Scan.",
        accent: 'slate'
      }
    ];
  }
}
