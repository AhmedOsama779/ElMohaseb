import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyRequest,
} from '../models/api.models';

export const OTP_LIFETIME_SECONDS = 300;
// The server only issues a new code when the current one has 2 minutes or less left
export const OTP_REISSUE_WINDOW_SECONDS = 120;
// So the resend button unlocks once the code has 2 minutes left (3 minutes after sending)
export const RESEND_COOLDOWN_SECONDS = OTP_LIFETIME_SECONDS - OTP_REISSUE_WINDOW_SECONDS;

const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

// Reads the middle part of a JWT (the payload). This is only for showing the user's info,
// the real security check always happens on the server.
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  token = signal<string | null>(localStorage.getItem('token'));
  private payload = computed(() => {
    const token = this.token();
    return token ? decodeJwt(token) : null;
  });

  user = computed(() => {
    const p = this.payload();
    return p ? { name: (p[CLAIM_NAME] ?? '') as string, email: (p[CLAIM_EMAIL] ?? '') as string } : null;
  });
  role = computed(() => (this.payload()?.[CLAIM_ROLE] ?? null) as string | null);


  // Holds email + otp between the OTP page and the reset page (lost on refresh, which is fine)
  resetData: { email: string; otp: string } | null = null;

  constructor() {
  // A token left over from an old session may be expired: remove it so the app starts logged out
  if (this.token() && !this.isLoggedIn()) {
    this.logout();
  }
  }
  // A method, not a signal, so the expiry time is checked again on every call
  isLoggedIn(): boolean {
    const p = this.payload();
    if (!p) return false;
    return !p['exp'] || p['exp'] * 1000 > Date.now();
  }
  isAdmin(): boolean {
  return this.isLoggedIn() && this.role() === 'Admin';
}

  logout() {
    localStorage.removeItem('token');
    this.token.set(null);
    this.resetData = null;
  }

  register(body: RegisterRequest) {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/Register`, body)
      .pipe(tap(() => this.markOtpSent(body.email)));
  }

  login(body: LoginRequest) {
    return this.http.post<ApiResponse<string>>(`${this.base}/Login`, body).pipe(
      tap(res => {
        // Some APIs answer HTTP 200 and put the failure in the "code" field, so check it too
        if (res.code !== 200 || !res.data) throw { status: res.code, error: res };
        localStorage.setItem('token', res.data);
        this.token.set(res.data);
      })
    );
  }

 forgot(email: string) {
  return this.http.post<ApiResponse<unknown>>(`${this.base}/Forget`, { email }).pipe(
    tap(() => {
      // Only restart our timers if the server really issued a new code
      if (this.otpSecondsLeft(email) <= OTP_REISSUE_WINDOW_SECONDS) this.markOtpSent(email);
    })
  );
}


  verify(body: VerifyRequest) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/Verify`, body);
  }

  resetPassword(body: ResetPasswordRequest) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/ResetPassword`, body);
  }

  // Seconds left before the last code sent to this email expires (0 if none or expired)
  otpSecondsLeft(email: string): number {
    return this.remaining(email, OTP_LIFETIME_SECONDS);
  }

  // Seconds left before the user may ask for another code
  resendSecondsLeft(email: string): number {
    return this.remaining(email, RESEND_COOLDOWN_SECONDS);
  }

  private remaining(email: string, totalSeconds: number): number {
    const sentAt = Number(sessionStorage.getItem(this.otpKey(email)) ?? 0);
    return Math.max(0, Math.ceil((sentAt + totalSeconds * 1000 - Date.now()) / 1000));
  }

  private markOtpSent(email: string) {
    sessionStorage.setItem(this.otpKey(email), String(Date.now()));
  }

  private otpKey(email: string) {
    return `otp-sent:${email.toLowerCase()}`;
  }
}