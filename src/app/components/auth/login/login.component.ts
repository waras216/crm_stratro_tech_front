import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-login', standalone: false, templateUrl: './login.component.html', styleUrls: ['./login.component.scss'] })
export class AuthLoginComponent {
  email    = '';
  password = '';
  error    = '';
  loading  = false;

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    if (this.auth.isLoggedIn && this.auth.isOnboarded) this.router.navigate(['/crm']);
  }

  submit() {
    this.error = '';
    if (!this.email || !this.password) { this.error = 'Completa todos los campos'; return; }
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: ok => {
        this.loading = false;
        if (!ok) { this.error = 'Credenciales incorrectas'; this.cdr.detectChanges(); return; }
        if (!this.auth.isOnboarded) { this.router.navigate(['/auth/onboarding']); return; }
        this.router.navigate(['/crm']);
      },
      error: () => { this.loading = false; this.error = 'Error de conexión con el servidor'; this.cdr.detectChanges(); },
    });
  }
}
