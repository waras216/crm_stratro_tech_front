import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-login', standalone: false, templateUrl: './login.component.html', styleUrls: ['./login.component.scss'] })
export class AuthLoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn && this.auth.isOnboarded) this.router.navigate(['/crm']);
  }

  submit() {
    this.error = '';
    if (!this.email || !this.password) { this.error = 'Completa todos los campos'; return; }
    const ok = this.auth.login(this.email, this.password);
    if (!ok) { this.error = 'Credenciales incorrectas'; return; }
    if (!this.auth.isOnboarded) { this.router.navigate(['/auth/onboarding']); return; }
    this.router.navigate(['/crm']);
  }
}
