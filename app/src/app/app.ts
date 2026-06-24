import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

interface DemoChapter {
  path: string;
  number: string;
  title: string;
  subtitle: string;
  part: string;
  accent: 'slate' | 'rose' | 'orange' | 'amber' | 'violet' | 'blue' | 'emerald';
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly chapters: readonly DemoChapter[] = [
    { path: '/intro', number: '00', title: 'Introduction', subtitle: 'Le fil du mémoire', part: 'Ouverture', accent: 'slate' },
    { path: '/bst', number: '01', title: 'Limites du BST', subtitle: 'Données pathologiques', part: 'Partie I', accent: 'rose' },
    { path: '/avl', number: '02', title: 'Équilibrage AVL', subtitle: 'Hauteur garantie', part: 'Partie I', accent: 'orange' },
    { path: '/btree', number: '03', title: 'Pages B-Tree', subtitle: 'Raisonner en blocs', part: 'Partie II', accent: 'amber' },
    { path: '/bplustree', number: '04', title: 'Index B+Tree', subtitle: 'Routage et plages', part: 'Partie II', accent: 'violet' },
    { path: '/write-cost', number: '05', title: 'Coût des écritures', subtitle: 'Le prix des index', part: 'Partie II', accent: 'rose' },
    { path: '/postgres-bridge', number: '06', title: 'Planner PostgreSQL', subtitle: 'Choisir le bon plan', part: 'Partie III', accent: 'blue' },
    { path: '/conclusion', number: '07', title: 'Conclusion', subtitle: 'Réponse à la problématique', part: 'Conclusion', accent: 'emerald' }
  ];

  readonly currentPath = signal(this.router.url.split('?')[0] || '/intro');
  readonly presentationMode = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly isFullscreen = signal(false);
  readonly currentIndex = computed(() => Math.max(0, this.chapters.findIndex(chapter => chapter.path === this.currentPath())));
  readonly currentChapter = computed(() => this.chapters[this.currentIndex()]);
  readonly progress = computed(() => ((this.currentIndex() + 1) / this.chapters.length) * 100);

  constructor() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.currentPath.set(event.urlAfterRedirects.split('?')[0]);
      this.mobileMenuOpen.set(false);
    });
  }

  togglePresentation(): void {
    this.presentationMode.update(value => !value);
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  navigateRelative(offset: number): void {
    const destination = this.chapters[this.currentIndex() + offset];
    if (destination) void this.router.navigateByUrl(destination.path);
  }

  async toggleFullscreen(): Promise<void> {
    if (this.document.fullscreenElement) {
      await this.document.exitFullscreen();
    } else {
      await this.document.documentElement.requestFullscreen();
    }
  }

  chapterAccentClass(accent: DemoChapter['accent']): string {
    return {
      slate: 'bg-slate-400', rose: 'bg-rose-400', orange: 'bg-orange-400',
      amber: 'bg-amber-400', violet: 'bg-violet-400', blue: 'bg-blue-400',
      emerald: 'bg-emerald-400'
    }[accent];
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(Boolean(this.document.fullscreenElement));
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      this.navigateRelative(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      this.navigateRelative(-1);
    } else if (event.key.toLowerCase() === 'p') {
      this.togglePresentation();
    } else if (event.key.toLowerCase() === 'f') {
      void this.toggleFullscreen();
    }
  }
}
