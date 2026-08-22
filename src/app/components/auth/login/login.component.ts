import { Component, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';
import { environment } from '../../../../environments/environment';

@Component({ selector: 'app-auth-login', standalone: false, templateUrl: './login.component.html', styleUrls: ['./login.component.scss'] })
export class AuthLoginComponent {
  email    = '';
  password = '';
  error    = '';
  loading  = false;

  modo: 'email' | 'dosfa' = 'email';
  codigo = '';
  usuariosDosFa: { id_usuario: number; nombre: string }[] = [];
  usuarioSeleccionado: { id_usuario: number; nombre: string } | null = null;
  cargandoUsuariosDosFa = false;

  @ViewChild('codigoInput') codigoInputRef?: ElementRef<HTMLInputElement>;

  get puedeUsarDosFa(): boolean { return !!this.auth.terminalTenantId; }

  constructor(public auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    if (this.auth.isLoggedIn && this.auth.isOnboarded) this.router.navigate(['/crm']);
  }

  entrarModoDosFa() {
    this.modo = 'dosfa';
    this.error = '';
    this.usuarioSeleccionado = null;
    this.codigo = '';
    this.cargandoUsuariosDosFa = true;
    this.auth.cargarUsuariosDosFa().subscribe({
      next: usuarios => { this.usuariosDosFa = usuarios; this.cargandoUsuariosDosFa = false; this.cdr.detectChanges(); },
      error: () => {
        this.cargandoUsuariosDosFa = false;
        this.error = 'Error de conexión con el servidor. Intenta de nuevo.';
        this.cdr.detectChanges();
      },
    });
  }

  elegirUsuarioDosFa(u: { id_usuario: number; nombre: string }) {
    this.usuarioSeleccionado = u;
    this.codigo = '';
    this.error = '';
    setTimeout(() => this.codigoInputRef?.nativeElement.focus());
  }

  volverAListaDosFa() {
    this.usuarioSeleccionado = null;
    this.codigo = '';
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

  onCodigoChange(value: string) {
    this.codigo = value.replace(/\D/g, '').slice(0, 6);
    this.error = '';
    if (this.codigo.length === 6) this.submitDosFa();
  }

  submitDosFa() {
    if (!this.usuarioSeleccionado) return;
    this.error = '';
    this.loading = true;
    this.auth.loginDosFa(this.usuarioSeleccionado.id_usuario, this.codigo).subscribe({
      next: ok => {
        this.loading = false;
        this.codigo = '';
        if (!ok) { this.error = 'Código incorrecto'; this.cdr.detectChanges(); return; }
        this.router.navigate([this.auth.session?.soloPos ? '/pos' : '/crm']);
      },
      error: () => { this.loading = false; this.codigo = ''; this.error = 'Error de conexión con el servidor'; this.cdr.detectChanges(); },
    });
  }

  /** Redirect de página completa -- GoogleAuthController (backend, routes/web.php)
   * maneja todo el intercambio OAuth2 y regresa a /auth/social-callback. */
  continuarConGoogle() {
    window.location.href = `${environment.apiUrl.replace(/\/api$/, '')}/auth/google/redirect`;
  }
}
