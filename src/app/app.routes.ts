import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { AuthShell } from './features/auth/auth-shell/auth-shell';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { VerifyOtp } from './features/auth/verify-otp/verify-otp';
import { Home } from './features/home/home';
import { CategoryPage } from './features/category-page/category-page';
import { MyOrders } from './features/my-orders/my-orders';
import { PayRemaining } from './features/pay-remaining/pay-remaining';
import { About } from './features/about/about';






export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: AuthShell,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
    ],
  },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'verify-otp', component: VerifyOtp },
  { path: 'reset-password', component: ResetPassword },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'categories/:id', component: CategoryPage, canActivate: [authGuard] },
  { path: 'orders', component: MyOrders, canActivate: [authGuard] },
  { path: 'orders/:id/pay', component: PayRemaining, canActivate: [authGuard] },
  { path: 'about', component: About },
  
 
];