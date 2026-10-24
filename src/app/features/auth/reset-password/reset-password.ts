import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { PASSWORD_RULES, passwordsMatch, strongPassword } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  rules = PASSWORD_RULES;
  showPassword = signal(false);
  showConfirm = signal(false);
  loading = signal(false);
  serverError = signal<string | null>(null);

  form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, strongPassword]],
      passwordConfirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  private passwordValue = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  passed = computed(() => this.rules.map(rule => rule.test(this.passwordValue())));
  passedCount = computed(() => this.passed().filter(Boolean).length);

  constructor() {
    // No verified email means the user skipped the earlier steps
    if (!this.auth.resetData) {
      this.router.navigateByUrl('/forgot-password');
    }
  }

  get c() {
    return this.form.controls;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.auth.resetData;
    if (!data) {
      this.router.navigateByUrl('/forgot-password');
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    // The API only takes email + password
    this.auth.resetPassword({ email: data.email, password: this.c.password.value }).subscribe({
      next: () => {
        this.auth.resetData = null;
        this.router.navigateByUrl('/login');
      },
      error: err => {
        this.serverError.set(err.error?.message ?? 'تعذر تغيير كلمة المرور، حاول مرة أخرى');
        this.loading.set(false);
      },
    });
  }
}