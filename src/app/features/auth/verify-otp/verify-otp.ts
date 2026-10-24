import { afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

const OTP_LENGTH = 6;

@Component({
  selector: 'app-verify-otp',
  imports: [RouterLink],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.scss',
})
export class VerifyOtp implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  isRegister = this.route.snapshot.queryParamMap.get('flow') === 'register';

  boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  digits = signal<string[]>(Array(OTP_LENGTH).fill(''));
  code = computed(() => this.digits().join(''));
  isComplete = computed(() => this.code().length === OTP_LENGTH);

  secondsLeft = signal(0);   // time until the code expires
  resendLeft = signal(0);    // time until resend is allowed
  expired = computed(() => this.secondsLeft() <= 0);
  canResend = computed(() => this.resendLeft() <= 0);
  timeText = computed(() => this.format(this.secondsLeft()));
  resendText = computed(() => this.format(this.resendLeft()));

  loading = signal(false);
  serverError = signal<string | null>(null);

  private timerId?: ReturnType<typeof setInterval>;

  constructor() {
    if (!this.email) {
      this.router.navigateByUrl(this.isRegister ? '/login' : '/forgot-password');
      return;
    }
    this.startTimer();
    afterNextRender(() => this.focus(0));
  }

  ngOnDestroy() {
    clearInterval(this.timerId);
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1); // digits only, one char
    input.value = value;

    this.digits.update(d => {
      const copy = [...d];
      copy[index] = value;
      return copy;
    });

    if (value && index < OTP_LENGTH - 1) this.focus(index + 1);
  }

  onKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      this.focus(index - 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;

    const next = Array(OTP_LENGTH).fill('');
    [...text].forEach((ch, i) => (next[i] = ch));
    this.digits.set(next);
    this.boxes().forEach((b, i) => (b.nativeElement.value = next[i]));
    this.focus(Math.min(text.length, OTP_LENGTH - 1));
  }

  verify() {
    if (!this.isComplete() || this.loading()) return;

    this.loading.set(true);
    this.serverError.set(null);

    this.auth.verify({ email: this.email, otp: this.code() }).subscribe({
      next: () => {
        if (this.isRegister) {
          // Account verified, now the user can sign in
          this.router.navigate(['/login'], { queryParams: { verified: 1 } });
        } else {
          this.auth.resetData = { email: this.email, otp: this.code() };
          this.router.navigateByUrl('/reset-password');
        }
      },
      error: err => {
        this.serverError.set(err.error?.message ?? 'الرمز غير صحيح أو منتهي الصلاحية');
        this.loading.set(false);
      },
    });
  }

resend() {
  this.serverError.set(null);

  // Forget is the resend endpoint for both flows
  this.auth.forgot(this.email).subscribe({
    next: () => {
      this.clearBoxes();
      this.startTimer();
    },
    error: err => this.serverError.set(err.error?.message ?? 'تعذر إرسال الرمز، حاول مرة أخرى'),
  });
}

  // Remaining times are always recalculated from the saved "sent at" timestamp,
  // so they can't drift and they survive a page refresh
  private startTimer() {
    clearInterval(this.timerId);
    this.tick();
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  private tick() {
    this.secondsLeft.set(this.auth.otpSecondsLeft(this.email));
    this.resendLeft.set(this.auth.resendSecondsLeft(this.email));
    if (this.secondsLeft() <= 0 && this.resendLeft() <= 0) clearInterval(this.timerId);
  }

  private format(totalSeconds: number) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  private clearBoxes() {
    this.digits.set(Array(OTP_LENGTH).fill(''));
    this.boxes().forEach(b => (b.nativeElement.value = ''));
    this.focus(0);
  }

  private focus(index: number) {
    this.boxes()[index]?.nativeElement.focus();
  }
}