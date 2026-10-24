import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { of, switchMap, tap } from 'rxjs';
import { LookupItem } from '../../../core/models/api.models';
import { Auth } from '../../../core/services/auth';
import { Lookup } from '../../../core/services/lookup';
import { passwordsMatch , strongPassword } from '../../../shared/validators/password.validators';


@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private lookup = inject(Lookup);
  private auth = inject(Auth);
  private router = inject(Router);

  countries = signal<LookupItem[]>([]);
  cities = signal<LookupItem[]>([]);
  loading = signal(false);
  serverError = signal<string | null>(null);

  form = this.fb.nonNullable.group(
    {
      fullname: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      waPhone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
      country: [0, [Validators.min(1)]],
      city: [0, [Validators.min(1)]],
      password: ['', [Validators.required, strongPassword]],
      passwordConfirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  constructor() {
    // Load countries once when the page opens
    this.lookup.getCountries().subscribe(list => this.countries.set(list));

    // When the country changes: reset the city, then load that country's cities
    this.form.controls.country.valueChanges
      .pipe(
        tap(() => {
          this.form.controls.city.setValue(0);
          this.cities.set([]);
        }),
        switchMap(id => (id > 0 ? this.lookup.getCities(id) : of([])))
      )
      .subscribe(list => this.cities.set(list));
  }

  get c() {
    return this.form.controls;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () =>
  this.router.navigate(['/verify-otp'], {
    queryParams: { email: this.c.email.value, flow: 'register' },
  }),
      error: err => {
        this.serverError.set(err.error?.message ?? 'حدث خطأ، حاول مرة أخرى');
        this.loading.set(false);
      },
    });
  }
}