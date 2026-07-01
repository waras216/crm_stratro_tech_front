import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-registro', standalone: false, templateUrl: './registro.component.html', styleUrls: ['./registro.component.scss'] })
export class AuthRegistroComponent {
  nombre          = '';
  apellido        = '';
  email           = '';
  password        = '';
  confirmPassword = '';
  error           = '';
  loading         = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    if (!this.nombre || !this.apellido || !this.email || !this.password) { this.error = 'Completa todos los campos'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'Las contraseñas no coinciden'; return; }
    if (this.password.length < 6) { this.error = 'La contraseña debe tener al menos 6 caracteres'; return; }
    this.loading = true;
    this.auth.registro(this.nombre + ' ' + this.apellido, this.email, this.password).subscribe({
      next: ok => {
        this.loading = false;
        if (!ok) { this.error = 'Este email ya está registrado o error del servidor'; return; }
        this.router.navigate(['/auth/onboarding']);
      },
      error: () => { this.loading = false; this.error = 'Error de conexión con el servidor'; },
    });
  }

  socialLogin(provider: 'google' | 'facebook' | 'apple') {
    const mockName  = provider.charAt(0).toUpperCase() + provider.slice(1) + ' User';
    const mockEmail = `user@${provider}.com`;
    this.auth.registro(mockName, mockEmail, 'social_' + provider).subscribe(() => {
      this.router.navigate(['/auth/onboarding']);
    });
  }
}
