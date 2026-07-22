import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-social-callback', standalone: false, templateUrl: './social-callback.component.html', styleUrls: ['./social-callback.component.scss'] })
export class AuthSocialCallbackComponent implements OnInit {
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      this.error = error;
      return;
    }

    if (!token) {
      this.error = 'No recibimos un token de sesión válido';
      return;
    }

    this.auth.iniciarSesionConToken(token).subscribe(ok => {
      if (!ok) {
        this.error = 'No pudimos iniciar tu sesión. Intenta de nuevo.';
        return;
      }
      this.router.navigate([this.auth.isOnboarded ? '/crm' : '/auth/onboarding']);
    });
  }
}
