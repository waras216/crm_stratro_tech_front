import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-reset-password', standalone: false, templateUrl: './reset-password.component.html', styleUrls: ['./reset-password.component.scss'] })
export class AuthResetPasswordComponent implements OnInit {
  email                = '';
  token                = '';
  password             = '';
  passwordConfirmation = '';
  error                = '';
  loading              = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.email = params.get('email') ?? '';
    this.token = params.get('token') ?? '';
    if (!this.email || !this.token) {
      this.error = 'El enlace de recuperación no es válido';
    }
  }

  submit() {
    this.error = '';
    if (!this.password || !this.passwordConfirmation) { this.error = 'Completa todos los campos'; return; }
    if (this.password.length < 6) { this.error = 'La contraseña debe tener al menos 6 caracteres'; return; }
    if (this.password !== this.passwordConfirmation) { this.error = 'Las contraseñas no coinciden'; return; }

    this.loading = true;
    this.auth.resetPassword(this.email, this.token, this.password, this.passwordConfirmation).subscribe({
      next: ok => {
        this.loading = false;
        if (!ok) { this.error = 'El enlace de recuperación es inválido o expiró'; this.cdr.detectChanges(); return; }
        this.router.navigate(['/auth/login']);
      },
      error: () => { this.loading = false; this.error = 'Error de conexión con el servidor'; this.cdr.detectChanges(); },
    });
  }
}
