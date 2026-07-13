import { Component, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-forgot-password', standalone: false, templateUrl: './forgot-password.component.html', styleUrls: ['./forgot-password.component.scss'] })
export class AuthForgotPasswordComponent {
  email    = '';
  error    = '';
  sent     = false;
  loading  = false;

  constructor(private auth: AuthService, private cdr: ChangeDetectorRef) {}

  submit() {
    this.error = '';
    if (!this.email) { this.error = 'Ingresa tu email'; return; }
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: ok => {
        this.loading = false;
        if (!ok) { this.error = 'No pudimos enviar el enlace de recuperación'; this.cdr.detectChanges(); return; }
        this.sent = true;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.error = 'Error de conexión con el servidor'; this.cdr.detectChanges(); },
    });
  }
}
