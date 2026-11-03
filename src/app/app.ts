import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { WhatsappButton } from './shared/components/whatsapp-button/whatsapp-button';
import { Validity } from './core/services/validity';
import { Suspended } from './shared/components/suspended/suspended';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar ,WhatsappButton , Suspended],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  protected validity = inject(Validity);
  
}