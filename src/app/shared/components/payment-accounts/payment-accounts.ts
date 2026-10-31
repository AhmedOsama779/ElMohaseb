import { Component, input, signal } from '@angular/core';
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

  // Egyptian phone numbers are shown as +2 01..., anything else as it is
  display(account: PaymentAccount): string {
    return formatEgyptPhone(account.ipan);
  }

  label(account: PaymentAccount): string {
    switch (account.accountType?.id) {
      case 1: return 'المعرف المالي للتحويل';
      case 2: return 'رقم التليفون / المحفظة';
      case 3: return 'رقم الحساب / الأيبان IBAN';
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