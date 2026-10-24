import { AbstractControl, ValidationErrors } from '@angular/forms';

export const PASSWORD_RULES = [
  { text: 'أن تتكون من 8 أحرف وأرقام على الأقل.', test: (v: string) => v.length >= 8 && /\d/.test(v) },
  { text: 'أن تحتوي على رمز خاص واحد على الأقل (@, #, $, %, ...).', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { text: 'أن تحتوي على حرف كبير واحد على الأقل (A-Z).', test: (v: string) => /[A-Z]/.test(v) },
];

export function strongPassword(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  return PASSWORD_RULES.every(rule => rule.test(value)) ? null : { weak: true };
}

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('passwordConfirmation')?.value;
  return password === confirmation ? null : { mismatch: true };
}