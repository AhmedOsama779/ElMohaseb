import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryItem } from '../../core/models/api.models';
import { Category } from '../../core/services/category';
import { toProxyUrl } from '../../shared/utils/url';


@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private categoryService = inject(Category);

  categories = signal<CategoryItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  toProxyUrl = toProxyUrl;
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
  }
}