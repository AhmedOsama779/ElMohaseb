import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;

  // Remember the page, so after logging in the visitor lands where they clicked
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};