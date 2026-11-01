import { Component, computed, input, signal } from '@angular/core';
import { PaymentAccount } from '../../../core/models/api.models';
import { formatEgyptPhone } from '../../utils/format';

@Component({
  selector: 'app-payment-accounts',
  templateUrl: './payment-accounts.html',
  styleUrl: './payment-accounts.scss',
})
export class PaymentAccounts {
  accounts = input.required<PaymentAccount[]>();
  copiedId = signal<number | null>(null);

  // Same order every time (InstaPay, wallet, bank), so the cards match the design
  sorted = computed(() =>
    [...this.accounts()].sort((a, b) => (a.accountType?.id ?? 0) - (b.accountType?.id ?? 0))
  );

  // Egyptian phone numbers are shown as +2 01..., anything else as it is
  display(account: PaymentAccount): string {
    return formatEgyptPhone(account.ipan);
  }

  // Label above the value, worded like the Figma design
  label(account: PaymentAccount): string {
    switch (account.accountType?.id) {
      case 1: return 'عنوان الدفع (IPA)';
      case 2: return 'رقم المحفظة / التليفون';
      case 3: return 'رقم الحساب / الأيبان (IBAN)';
      default: return 'المعرف المالي';
    }
  }

  async copy(account: PaymentAccount) {
    try {
      await navigator.clipboard.writeText(this.display(account));
      this.copiedId.set(account.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    } catch {
      // clipboard can be blocked, the text can still be selected by hand
    }
  }
}