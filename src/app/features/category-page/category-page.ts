import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategoryItem, DocumentStatus, PaymentInfo, RequestCreated } from '../../core/models/api.models';
import { Catalog } from '../../core/services/catalog';
import { Category } from '../../core/services/category';
import { formatEgyptPhone } from '../../shared/utils/format';
import { toProxyUrl } from '../../shared/utils/url';
import { arabicError } from '../../shared/utils/errors';


const MAX_BYTES = 5 * 1024 * 1024;
const DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const RECEIPT_TYPES = ['image/jpeg', 'image/png'];
// The "IPAN" from the API is the Egyptian phone number linked to InstaPay.
// Show it as +2 followed by the local number (01xxxxxxxxx)


@Component({
  selector: 'app-category-page',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './category-page.html',
  styleUrl: './category-page.scss',
})
export class CategoryPage {
  private route = inject(ActivatedRoute);
  private categories = inject(Category);
  private catalog = inject(Catalog);

  private categoryId = Number(this.route.snapshot.paramMap.get('id'));

  category = signal<CategoryItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedId = signal<number | null>(null);
  selectedService = computed(
    () => this.category()?.services.find(s => s.id === this.selectedId()) ?? null
  );

  statuses = signal<DocumentStatus[]>([]);
  statusLoading = signal(false);
  blockedMessage = signal<string | null>(null);
  pendingDocs = computed(() => this.statuses().filter(d => !d.isUploaded));

  payment = signal<PaymentInfo | null>(null);
  paymentNumber = computed(() => formatEgyptPhone(this.payment()?.ipan));
  copied = signal(false);

  files = signal<Record<number, File | undefined>>({});
  receipt = signal<File | null>(null);
  fileErrors = signal<Record<string, string | undefined>>({});

  submitting = signal(false);
  submitErrors = signal<string[]>([]);
  created = signal<RequestCreated | null>(null);

  canSubmit = computed(() => {
    if (this.submitting() || this.blockedMessage() || !this.selectedService() || !this.receipt()) {
      return false;
    }
    return this.pendingDocs()
      .filter(d => d.isMandatory)
      .every(d => !!this.files()[d.id]);
  });
toProxyUrl = toProxyUrl;
  constructor() {
    // The categories list already includes each category's services
    this.categories.getAll(1, 50).subscribe({
      next: page => {
        const found = page.items.find(c => c.id === this.categoryId) ?? null;
        this.category.set(found);
        this.loading.set(false);
        if (found?.services.length) this.selectService(found.services[0].id);
      },
      error: () => {
        this.error.set('تعذر تحميل الخدمات، حاول مرة أخرى');
        this.loading.set(false);
      },
    });

    this.catalog.getPaymentInfo().subscribe({
      next: info => this.payment.set(info),
      error: () => this.payment.set(null), // 404 means the admin hasn't added payment info yet
    });
  }

  selectService(id: number) {
    this.selectedId.set(id);
    this.files.set({});
    this.receipt.set(null);
    this.fileErrors.set({});
    this.submitErrors.set([]);
    this.blockedMessage.set(null);
    this.statuses.set([]);
    this.statusLoading.set(true);

    this.catalog.getDocumentStatus(id).subscribe({
      next: list => {
        if (this.selectedId() !== id) return; // the user already picked another service
        this.statuses.set(list);
        this.statusLoading.set(false);
      },
      error: err => {
        if (this.selectedId() !== id) return;
        // 400 means an earlier request for this service still needs completing
        this.blockedMessage.set(err.error?.message ?? 'تعذر تحميل حالة المستندات');
        this.statuses.set(err.error?.data ?? []);
        this.statusLoading.set(false);
      },
    });
  }

  // The text and colour of the "current upload status" pill in the documents table
  statusOf(d: DocumentStatus): { text: string; kind: 'done' | 'ready' | 'waiting' | 'optional' } {
    if (d.isUploaded) return { text: 'تم الرفع', kind: 'done' };
    if (this.files()[d.id]) return { text: 'جاهز للإرسال', kind: 'ready' };
    return d.isMandatory
      ? { text: 'بالانتظار الرفع', kind: 'waiting' }
      : { text: 'اختياري لم يتم الرفع', kind: 'optional' };
  }

  onDocChosen(docId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const problem = this.check(file, DOC_TYPES);
    this.setFileError(`doc-${docId}`, problem);
    if (problem) {
      input.value = '';
      return;
    }
    this.files.update(f => ({ ...f, [docId]: file }));
  }

  onReceiptChosen(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const problem = this.check(file, RECEIPT_TYPES);
    this.setFileError('receipt', problem);
    if (problem) {
      input.value = '';
      return;
    }
    this.receipt.set(file);
  }

 async copyIpan() {
  const phone = this.paymentNumber();
  if (!phone) return;
  try {
    await navigator.clipboard.writeText(phone);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  } catch {
    // clipboard can be blocked, the user can still select the text by hand
  }
}

  submit() {
    const service = this.selectedService();
    const receipt = this.receipt();
    if (!service || !receipt || !this.canSubmit()) return;

    const docs = this.pendingDocs()
      .filter(d => this.files()[d.id])
      .map(d => ({ id: d.id, file: this.files()[d.id]! }));

    this.submitting.set(true);
    this.submitErrors.set([]);

    this.catalog.submitRequest(service.id, receipt, docs).subscribe({
      next: res => {
        this.created.set(res.data);
        this.submitting.set(false);
      },
      error: err => {
        const errors: string[] = err.error?.errors;
        this.submitErrors.set(
          errors?.length ? errors : [err.error?.message ?? 'تعذر إرسال الطلب، حاول مرة أخرى']
        );
        this.submitting.set(false);
      },
    });
  }

  private check(file: File, allowed: string[]): string | null {
    if (!allowed.includes(file.type)) return 'نوع الملف غير مدعوم';
    if (file.size > MAX_BYTES) return 'حجم الملف أكبر من 5 ميجابايت';
    return null;
  }

  private setFileError(key: string, problem: string | null) {
    this.fileErrors.update(e => ({ ...e, [key]: problem ?? undefined }));
  }
}