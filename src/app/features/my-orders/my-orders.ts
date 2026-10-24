import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PagedResult, RequestOrder } from '../../core/models/api.models';
import { Catalog } from '../../core/services/catalog';

type Filter = 'all' | 'unpaid' | 'paid';

// Arabic month names but Latin digits, like "24 يناير 2025"
const dateFormat = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const relativeFormat = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' });

@Component({
  selector: 'app-my-orders',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders {
  private catalog = inject(Catalog);
  private latestRequest = 0;
  private router = inject(Router);


  readonly pageSize = 10;
  readonly year = new Date().getFullYear();


  filter = signal<Filter>('all');
  pageNumber = signal(1);

  data = signal<PagedResult<RequestOrder> | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  unpaidCount = signal(0);
  paidCount = signal(0);
  allCount = computed(() => this.unpaidCount() + this.paidCount());

  items = computed(() => this.data()?.items ?? []);

  // "عرض 1-4 من إجمالي 4 طلبات"
  range = computed(() => {
    const d = this.data();
    if (!d || !d.items.length) return null;
    const from = (d.pageNumber - 1) * d.pageSize + 1;
    return { from, to: from + d.items.length - 1, total: d.totalCount };
  });

  // Up to 5 page numbers around the current page
  pages = computed(() => {
    const d = this.data();
    if (!d) return [];
    const start = Math.max(1, Math.min(d.pageNumber - 2, d.totalPages - 4));
    const end = Math.min(d.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  constructor() {
    // The tab counts come from the totals of two small requests
    forkJoin([
      this.catalog.getMyOrders(1, 1, false),
      this.catalog.getMyOrders(1, 1, true),
    ]).subscribe({
      next: ([unpaid, paid]) => {
        this.unpaidCount.set(unpaid.totalCount);
        this.paidCount.set(paid.totalCount);
      },
      error: () => {}, // the counts are decoration, the list below reports real errors
    });

    this.load();
  }

  
  setFilter(filter: Filter) {
    if (filter === this.filter()) return;
    this.filter.set(filter);
    this.pageNumber.set(1);
    this.load();
  }

  goTo(page: number) {
    const total = this.data()?.totalPages ?? 1;
    if (page < 1 || page > total || page === this.pageNumber()) return;
    this.pageNumber.set(page);
    this.load();
  }

  formatDate(iso: string): string {
    return dateFormat.format(new Date(iso));
  }

  // Recent updates read like "قبل ساعتين", older ones show the date
  formatUpdated(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return relativeFormat.format(-minutes, 'minute');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return relativeFormat.format(-hours, 'hour');
    return this.formatDate(iso);
  }
  open(order: RequestOrder) {
  if (order.isPaidComplete) return; // only unpaid requests have a page to open
  this.router.navigate(['/orders', order.requestID, 'pay']);
}
  

  private load() {
    const id = ++this.latestRequest;
    this.loading.set(true);
    this.error.set(null);

    const f = this.filter();
    const completePaid = f === 'all' ? undefined : f === 'paid';

    this.catalog.getMyOrders(this.pageNumber(), this.pageSize, completePaid).subscribe({
      next: res => {
        if (id !== this.latestRequest) return; // a newer request replaced this one
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        if (id !== this.latestRequest) return;
        this.error.set('تعذر تحميل الطلبات، حاول مرة أخرى');
        this.loading.set(false);
      },
    });
  }
}