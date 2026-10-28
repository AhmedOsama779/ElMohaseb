import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactInfo } from '../../core/models/api.models';
import { Catalog } from '../../core/services/catalog';
import { arabicError } from '../../shared/utils/errors';

const DEFAULT_INTRO =
  'مكتب "المحاسب" هو بيت خبرة واستشارات محاسبية وقانونية معتمد، متخصص في تيسير تأسيس الشركات بكافة أشكالها القانونية، وإدارة المنظومة الضريبية وإعداد الإقرارات، ومراجعة وتدقيق القوائم المالية، ومسك الدفاتر المنتظمة. كما نعمل على إنجاز المعاملات والإجراءات الإدارية لدى الجهات الحكومية والرقابية للشركات الناشئة والمؤسسات القائمة، لنمكّن رواد الأعمال وأصحاب الأعمال من التفرغ لتنمية مشاريعهم وفق أعلى معايير الالتزام المالي والمؤسسي المعمول بها في جمهورية مصر العربية.';

  @Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  private catalog = inject(Catalog);

  contact = signal<ContactInfo | null>(null);
  loading = signal(true);
  needsLogin = signal(false);
  error = signal<string | null>(null);
  // The admin's text when there is one (visitors who can't load it see the default)
intro = computed(() => this.contact()?.contactText?.trim() || DEFAULT_INTRO);

  // Only the channels the admin actually filled in
  socials = computed(() => {
    const c = this.contact();
    if (!c) return [];
    const all = [
      { label: 'واتساب مباشر', url: c.whatsAppUrl },
      { label: 'فيسبوك', url: c.facebookUrl },
      { label: 'منصة إكس', url: c.xUrl },
      { label: 'يوتيوب', url: c.youtubeUrl },
    ];
    return all.filter((s): s is { label: string; url: string } => !!s.url);
  });

  constructor() {
    this.catalog.getContact().subscribe({
      next: info => {
        this.contact.set(info);
        this.loading.set(false);
      },
      error: err => {
        if (err.status === 401) {
          this.needsLogin.set(true);
        } else if (err.status === 404) {
          this.error.set('بيانات التواصل غير متاحة حاليًا.');
        } else {
          this.error.set(arabicError(err));
        }
        this.loading.set(false);
      },
    });
  }
}