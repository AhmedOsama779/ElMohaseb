import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PaymentInfo, RequestDetails } from '../../core/models/api.models';
import { Catalog } from '../../core/services/catalog';
import { formatDate, formatEgyptPhone } from '../../shared/utils/format';

const MAX_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png'];

@Component({
  selector: 'app-pay-remaining',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './pay-remaining.html',
  styleUrl: './pay-remaining.scss',
})
export class PayRemaining {
  private route = inject(ActivatedRoute);
  private catalog = inject(Catalog);

  private requestId = Number(this.route.snapshot.paramMap.get('id'));
  formatDate = formatDate;

  request = signal<RequestDetails | null>(null);
  serviceName = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  payment = signal<PaymentInfo | null>(null);
  phone = computed(() => formatEgyptPhone(this.payment()?.ipan));
  copied = signal(false);

  receipt = signal<File | null>(null);
  fileError = signal<string | null>(null);
  dragging = signal(false);

  submitting = signal(false);
  submitErrors = signal<string[]>([]);
  done = signal(false);

  canSubmit = computed(
    () => !!this.request() && !!this.receipt() && !this.submitting()
  );

  constructor() {
    forkJoin({
      details: this.catalog.getRequest(this.requestId),
      // The details endpoint has no service name, so we find it in the orders list
      list: this.catalog.getMyOrders(1, 50).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ details, list }) => {
        this.request.set(details);
        const match = list?.items.find(o => o.requestID === this.requestId);
        this.serviceName.set(match?.service ?? null);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(
          err.status === 404
            ? 'لم يتم العثور على هذا الطلب'
            : 'تعذر تحميل بيانات الطلب، حاول مرة أخرى'
        );
        this.loading.set(false);
      },
    });

    this.catalog.getPaymentInfo().subscribe({
      next: info => this.payment.set(info),
      error: () => this.payment.set(null), // 404 means the admin hasn't added payment info yet
    });
  }

  onFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.accept(input.files?.[0]);
    input.value = ''; // so the same file can be chosen again
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // required, otherwise the browser refuses the drop
    this.dragging.set(true);
  }

  onDragLeave() {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    this.accept(event.dataTransfer?.files?.[0]);
  }

  async copyPhone() {
    const phone = this.phone();
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
    const request = this.request();
    const file = this.receipt();
    if (!request || !file || !this.canSubmit()) return;

    this.submitting.set(true);
    this.submitErrors.set([]);

    this.catalog.payRemaining(request.id, request.orderCode, file).subscribe({
      next: () => {
        this.done.set(true);
        this.submitting.set(false);
      },
      error: err => {
        const errors: string[] = err.error?.errors;
        this.submitErrors.set(
          errors?.length ? errors : [err.error?.message ?? 'تعذر إرسال الإيصال، حاول مرة أخرى']
        );
        this.submitting.set(false);
      },
    });
  }

  private accept(file: File | undefined) {
    if (!file) return;

    if (!RECEIPT_TYPES.includes(file.type)) {
      this.fileError.set('نوع الملف غير مدعوم، المسموح JPG أو PNG فقط');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.fileError.set('حجم الملف أكبر من 5 ميجابايت');
      return;
    }

    this.fileError.set(null);
    this.receipt.set(file);
  }
}