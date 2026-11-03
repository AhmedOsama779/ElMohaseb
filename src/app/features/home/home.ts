import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryItem, ClientItem } from '../../core/models/api.models';
import { Category } from '../../core/services/category';
import { Clients } from '../../core/services/clients';
import { toProxyUrl } from '../../shared/utils/url';

const AUTOPLAY_MS = 4000;

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: { '(window:resize)': 'onResize()' },
})
export class Home {
  private categoryService = inject(Category);
  private clientsService = inject(Clients);

  categories = signal<CategoryItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  toProxyUrl = toProxyUrl;

  // ---------- clients slideshow ----------
  clients = signal<ClientItem[]>([]);
  perView = signal(this.calcPerView());   // how many logos fit on screen
  page = signal(0);
  paused = signal(false);                 // true while the mouse is over the slideshow
  brokenLogos = signal<number[]>([]);     // clients whose logo failed to load
  
  private timer: ReturnType<typeof setInterval> | null = null;
  private reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  canSlide = computed(() => this.clients().length > this.perView());
  pages = computed(() => Math.max(1, Math.ceil(this.clients().length / this.perView())));
  dots = computed(() => Array.from({ length: this.pages() }, (_, i) => i));

  // Index of the first visible logo. The last page is clamped so it never shows empty space.
  private offset = computed(() =>
    Math.min(this.page() * this.perView(), Math.max(0, this.clients().length - this.perView()))
  );
  // The page is right-to-left, so a positive shift reveals the next logos on the left
  trackTransform = computed(() => `translateX(${this.offset() * (100 / this.perView())}%)`);

  constructor() {
    this.categoryService.getAll().subscribe({
      next: page => {
        this.categories.set(page.items.filter(c => c.isValid !== false));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل الخدمات، حاول مرة أخرى');
        this.loading.set(false);
      },
    });

    // The slideshow is a bonus: if it can't load, the section is simply not shown
    this.clientsService.getAll(1, 50).subscribe({
      next: page => this.clients.set(page.items ?? []),
      error: () => this.clients.set([]),
    });

    this.startTimer();
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

    // Used by the automatic timer: moves one step without touching the timer
  private advance() {
    this.page.update(p => (p + 1) % this.pages());
  }

  // The methods below are for the visitor's clicks, so they restart the 4-second countdown from zero
  next() {
    this.advance();
    this.startTimer();
  }

  prev() {
    this.page.update(p => (p - 1 + this.pages()) % this.pages());
    this.startTimer();
  }

  goTo(index: number) {
    this.page.set(index);
    this.startTimer();
  }

  private startTimer() {
    this.stopTimer();
    if (this.reduceMotion) return;
    this.timer = setInterval(() => {
      if (!this.paused() && this.canSlide()) this.advance();
    }, AUTOPLAY_MS);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onResize() {
    this.perView.set(this.calcPerView());
    this.page.update(p => Math.min(p, this.pages() - 1));
  }

  isBroken(id: number) {
    return this.brokenLogos().includes(id);
  }

  markBroken(id: number) {
    this.brokenLogos.update(list => [...list, id]);
  }

  private calcPerView(): number {
    const width = window.innerWidth;
    if (width >= 1000) return 4;
    if (width >= 700) return 3;
    if (width >= 480) return 2;
    return 1;
  }
}