import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Auth } from '../../../core/services/auth';
import { Catalog } from '../../../core/services/catalog';

// Only real web links are accepted, so a bad value in the data can never become a "javascript:" link
function safeUrl(url: string | null | undefined): string | null {
  const value = url?.trim();
  return value && /^https?:\/\//i.test(value) ? value : null;
}

@Component({
  selector: 'app-whatsapp-button',
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.scss',
})
export class WhatsappButton {
  private auth = inject(Auth);
  private catalog = inject(Catalog);

  // Loaded again when the visitor logs in or out, because the contact API may need a token
  private contact = toSignal(
    toObservable(this.auth.token).pipe(
      switchMap(() => this.catalog.getContact().pipe(catchError(() => of(null))))
    ),
    { initialValue: null }
  );

  url = computed(() => safeUrl(this.contact()?.whatsAppUrl) ?? safeUrl(environment.whatsappUrl));
}