import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private router = inject(Router);


  // Shown after the user verifies their email
  justVerified = this.route.snapshot.queryParamMap.get('verified') === '1';

  loading = signal(false);
  serverError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    // Hide the error as soon as the user edits a field
    this.form.valueChanges.subscribe(() => this.serverError.set(null));
  }

  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
     next: () => this.router.navigateByUrl(this.auth.isAdmin() ? '/admin/orders' : '/home'),
      error: err => {
  this.loading.set(false);

  const body = err.error;
  const notVerified = body?.status === 7 || /verify/i.test(body?.message ?? '');
  if (notVerified) {
    // The account exists but the email was never confirmed
    this.router.navigate(['/verify-otp'], {
      queryParams: { email: this.email.value, flow: 'register' },
    });
    return;
  }

  this.serverError.set(this.messageFor(err));
},
    });
  }

  private messageFor(err: { status?: number }): string {
    if (err.status === 0) return 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت';
    if (err.status && err.status >= 500) return 'حدث خطأ في الخادم، حاول مرة أخرى لاحقًا';
    // One generic message on purpose: it doesn't reveal whether the email or the password was wrong
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }
}