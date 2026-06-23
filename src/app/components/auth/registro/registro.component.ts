import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-registro', standalone: false, templateUrl: './registro.component.html', styleUrls: ['./registro.component.scss'] })
export class AuthRegistroComponent {
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    if (!this.nombre || !this.apellido || !this.email || !this.password) { this.error = 'Completa todos los campos'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'Las contraseñas no coinciden'; return; }
    if (this.password.length < 6) { this.error = 'La contraseña debe tener al menos 6 caracteres'; return; }
    const ok = this.auth.registro(this.nombre + ' ' + this.apellido, this.email, this.password);
    if (!ok) { this.error = 'Este email ya está registrado'; return; }
    this.router.navigate(['/auth/onboarding']);
  }

  socialLogin(provider: 'google' | 'facebook' | 'apple') {
    // Mock: simula registro social directo
    const mockName = provider.charAt(0).toUpperCase() + provider.slice(1) + ' User';
    const mockEmail = `user@${provider}.com`;
    this.auth.registro(mockName, mockEmail, 'social_' + provider);
    this.router.navigate(['/auth/onboarding']);
  }
}
