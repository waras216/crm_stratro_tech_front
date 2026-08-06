import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';
import { environment } from '../../../../environments/environment';

@Component({ selector: 'app-auth-login', standalone: false, templateUrl: './login.component.html', styleUrls: ['./login.component.scss'] })
export class AuthLoginComponent {
  email    = '';
  password = '';
  error    = '';
  loading  = false;

  modo: 'email' | 'pin' = 'email';
  pin = '';
  usuariosPin: { id_usuario: number; nombre: string }[] = [];
  usuarioSeleccionado: { id_usuario: number; nombre: string } | null = null;
  cargandoUsuariosPin = false;

  get puedeUsarPin(): boolean { return !!this.auth.terminalTenantId; }

  constructor(public auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    if (this.auth.isLoggedIn && this.auth.isOnboarded) this.router.navigate(['/crm']);
  }

  entrarModoPin() {
    this.modo = 'pin';
    this.error = '';
    this.usuarioSeleccionado = null;
    this.pin = '';
    this.cargandoUsuariosPin = true;
    this.auth.cargarUsuariosPin().subscribe({
      next: usuarios => { this.usuariosPin = usuarios; this.cargandoUsuariosPin = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoUsuariosPin = false; this.cdr.detectChanges(); },
    });
  }

  elegirUsuarioPin(u: { id_usuario: number; nombre: string }) {
    this.usuarioSeleccionado = u;
    this.pin = '';
    this.error = '';
  }

  volverAListaPin() {
    this.usuarioSeleccionado = null;
    this.pin = '';
    this.error = '';
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
        this.router.navigate([this.auth.session?.soloPos ? '/pos' : '/crm']);
      },
      error: () => { this.loading = false; this.error = 'Error de conexión con el servidor'; this.cdr.detectChanges(); },
    });
  }

  digitoPin(d: string) {
    if (!this.usuarioSeleccionado || this.pin.length >= 8) return;
    this.pin += d;
    this.error = '';
    if (this.pin.length >= 4) this.submitPin();
  }

  borrarDigitoPin() { this.pin = this.pin.slice(0, -1); }

  submitPin() {
    if (!this.usuarioSeleccionado) return;
    this.error = '';
    this.loading = true;
    this.auth.pinLogin(this.usuarioSeleccionado.id_usuario, this.pin).subscribe({
      next: ok => {
        this.loading = false;
        this.pin = '';
        if (!ok) { this.error = 'PIN incorrecto'; this.cdr.detectChanges(); return; }
        this.router.navigate([this.auth.session?.soloPos ? '/pos' : '/crm']);
      },
      error: () => { this.loading = false; this.pin = ''; this.error = 'Error de conexión con el servidor'; this.cdr.detectChanges(); },
    });
  }

  /** Redirect de página completa -- GoogleAuthController (backend, routes/web.php)
   * maneja todo el intercambio OAuth2 y regresa a /auth/social-callback. */
  continuarConGoogle() {
    window.location.href = `${environment.apiUrl.replace(/\/api$/, '')}/auth/google/redirect`;
  }
}
