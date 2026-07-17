import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './authservices';

@Injectable({ providedIn: 'root' })
export class AdminTenantGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn) { this.router.navigate(['/auth/login']); return false; }
    if (!this.auth.session?.es_admin && !this.auth.session?.es_superadmin) { this.router.navigate(['/']); return false; }
    return true;
  }
}
