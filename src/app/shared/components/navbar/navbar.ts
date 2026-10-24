import { Component, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class Navbar {
  auth = inject(Auth);
  private router = inject(Router);
  private el = inject(ElementRef<HTMLElement>);

  menuOpen = signal(false);

  // Close the menu when the user clicks anywhere outside the navbar
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  logout() {
    this.auth.logout();
    this.menuOpen.set(false);
    this.router.navigateByUrl('/login');
  }
}