import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RolService } from '../../../core/services/rol.service';
import { NotifyService } from '../../../core/services/notify.service';
import { Usuario, Rol } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-usuarios',
  standalone: false,
  templateUrl: './usuarios.component.html',
  animations: [modalLeave],
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargandoUsuarios = false;
  errorEquipo = '';
  invitarOpen = false;
  invitando = false;
  modoInvitar: 'con_correo' | 'cajero' = 'con_correo';
  nuevoUsuario: { nombre: string; email: string; password: string; es_admin: boolean; id_rol: number | null } =
    { nombre: '', email: '', password: '', es_admin: false, id_rol: null };
  erroresNuevoUsuario: { nombre?: string; email?: string; password?: string } = {};
  roles: Rol[] = [];
  avisoEquipo = '';

  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get rolesAsignables(): Rol[] { return this.roles.filter(r => r.clave !== 'tenant.admin'); }
  rolMiembroId(): number | null { return this.roles.find(r => r.clave === 'tenant.miembro')?.id_rol ?? null; }

  // Editar usuario existente
  dialogUsuarioOpen = false;
  editandoUsuario: Usuario | null = null;
  formUsuario = { nombre: '', email: '', telefono: '', password: '' };
  errorDialogUsuario = '';
  guardandoUsuario = false;

  // Configurar/restablecer 2FA (login rápido de cajero)
  dialogDosFaOpen = false;
  dosFaUsuario: Usuario | null = null;
  dosFaQr: string | null = null;
  dosFaSecret = '';
  dosFaCodigo = '';
  errorDosFa = '';
  cargandoDosFa = false;
  confirmandoDosFa = false;

  estadoBadgeClase(u: Usuario): string {
    return u.estado === 'ocupado' ? 'badge-amber' : u.estado === 'suspendido' ? 'badge-red' : 'badge-green';
  }

  get maxUsuarios(): number | null { return this.auth.session?.plan?.max_usuarios ?? null; }
  get limiteAlcanzado(): boolean { return this.maxUsuarios !== null && this.usuarios.length >= this.maxUsuarios; }
  get miIdUsuario(): number | undefined { return this.auth.session?.id_usuario; }

  // Terminal POS (vínculo dispositivo↔tenant para login rápido por 2FA)
  get terminalVinculada(): boolean { return this.auth.terminalVinculadaAMiTenant; }
  get terminalVinculadaAOtroTenant(): boolean {
    const idTerminal = this.auth.terminalTenantId;
    return idTerminal !== null && idTerminal !== this.auth.session?.id_tenant;
  }

  vincularTerminal() {
    this.auth.vincularTerminal();
    this.avisoEquipo = 'Esta terminal quedó configurada para tu negocio: ya puede usarse el login rápido por 2FA.';
  }

  desvincularTerminal() {
    this.auth.desvincularTerminal();
    this.avisoEquipo = 'Esta terminal ya no ofrecerá login por 2FA hasta que la vuelvas a configurar.';
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private cdr: ChangeDetectorRef,
    private notify: NotifyService,
  ) {}

  goToRoles() { this.router.navigate(['/admin/roles']); }

  abrirInvitar() {
    this.modoInvitar = 'con_correo';
    this.nuevoUsuario = { nombre: '', email: '', password: '', es_admin: false, id_rol: this.rolMiembroId() };
    this.erroresNuevoUsuario = {};
    this.errorEquipo = '';
    this.invitarOpen = true;
  }

  cerrarInvitar() {
    this.invitarOpen = false;
  }

  ngOnInit() {
    this.cargarUsuarios();
    this.rolService.cargarRoles().subscribe({
      next: roles => {
        this.roles = roles;
        // Preseleccionar "Miembro" (todos los permisos) en vez de dejar el
        // select en un valor implícito -- así el admin ve explícitamente
        // qué rol se le va a asignar al usuario nuevo.
        if (this.nuevoUsuario.id_rol === null) {
          this.nuevoUsuario.id_rol = this.rolMiembroId();
        }
      },
    });
  }

  cargarUsuarios() {
    this.cargandoUsuarios = true;
    this.usuarioService.cargarUsuarios().subscribe({
      next: usuarios => { this.usuarios = usuarios; this.cargandoUsuarios = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoUsuarios = false; this.cdr.detectChanges(); },
    });
  }

  validarNuevoUsuario(): boolean {
    const errores: typeof this.erroresNuevoUsuario = {};
    const u = this.nuevoUsuario;

    if (!u.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
    else if (u.nombre.trim().length < 2) errores.nombre = 'El nombre es muy corto.';

    if (this.modoInvitar === 'con_correo') {
      if (!u.email.trim()) errores.email = 'El correo es obligatorio.';
      else if (!this.EMAIL_REGEX.test(u.email.trim())) errores.email = 'Ese correo no es válido.';

      if (!u.password) errores.password = 'La contraseña es obligatoria.';
      else if (u.password.length < 6) errores.password = 'Mínimo 6 caracteres.';
    }

    this.erroresNuevoUsuario = errores;
    return Object.keys(errores).length === 0;
  }

  invitarUsuario() {
    if (!this.validarNuevoUsuario()) return;
    this.errorEquipo = '';
    this.avisoEquipo = '';
    this.invitando = true;

    const payload = this.modoInvitar === 'cajero'
      ? { ...this.nuevoUsuario, email: '', password: '' }
      : this.nuevoUsuario;

    this.usuarioService.invitarUsuario(payload).subscribe({
      next: nuevo => {
        this.invitando = false;
        if (nuevo.cuenta_existente) {
          this.avisoEquipo = `${nuevo.email} ya tenía una cuenta en STRATO — se agregó a tu equipo con su contraseña existente. La contraseña que escribiste aquí no se usó.`;
        }
        this.nuevoUsuario = { nombre: '', email: '', password: '', es_admin: false, id_rol: this.rolMiembroId() };
        this.erroresNuevoUsuario = {};
        this.invitarOpen = false;
        this.cargarUsuarios();
        // Un cajero (sin correo) solo puede entrar configurando su 2FA, y
        // eso requiere escanear un QR -- no puede pasarse en el alta misma.
        // Se lo ofrecemos al toque para no obligar a un segundo viaje a
        // "Editar" después.
        if (nuevo.id_usuario) this.iniciarConfiguracion2fa(nuevo);
        this.cdr.detectChanges();
      },
      error: err => {
        this.invitando = false;
        this.errorEquipo = err?.error?.message || 'No se pudo invitar al usuario';
        this.cdr.detectChanges();
      },
    });
  }

  /** Abre el diálogo de enrolamiento 2FA para este usuario: genera un
   * secreto nuevo y muestra el QR para escanear con una app tipo Google
   * Authenticator. El secreto viaja solo en memoria del componente hasta
   * confirmarConfiguracion2fa() -- nunca se persiste sin confirmar. */
  iniciarConfiguracion2fa(usuario: Usuario) {
    this.dosFaUsuario = usuario;
    this.dosFaQr = null;
    this.dosFaSecret = '';
    this.dosFaCodigo = '';
    this.errorDosFa = '';
    this.dialogDosFaOpen = true;
    this.cargandoDosFa = true;
    this.usuarioService.iniciarDosFa(usuario.id_usuario).subscribe({
      next: res => { this.dosFaQr = res.qr; this.dosFaSecret = res.secret; this.cargandoDosFa = false; this.cdr.detectChanges(); },
      error: err => { this.cargandoDosFa = false; this.errorDosFa = err?.error?.message || 'No se pudo generar el código 2FA'; this.cdr.detectChanges(); },
    });
  }

  confirmarConfiguracion2fa() {
    if (!this.dosFaUsuario || this.dosFaCodigo.length !== 6) return;
    this.errorDosFa = '';
    this.confirmandoDosFa = true;
    this.usuarioService.confirmarDosFa(this.dosFaUsuario.id_usuario, this.dosFaSecret, this.dosFaCodigo).subscribe({
      next: () => { this.confirmandoDosFa = false; this.cerrarDialogDosFa(); this.cargarUsuarios(); },
      error: err => { this.confirmandoDosFa = false; this.errorDosFa = err?.error?.message || 'Código incorrecto'; this.cdr.detectChanges(); },
    });
  }

  async restablecerDosFa(usuario: Usuario) {
    const ok = await this.notify.confirm(`¿Restablecer la verificación en dos pasos de ${usuario.nombre}? Va a necesitar configurarla de nuevo para poder entrar.`, { danger: true, confirmText: 'Restablecer' });
    if (!ok) return;
    this.errorEquipo = '';
    this.usuarioService.restablecerDosFa(usuario.id_usuario).subscribe({
      next: () => { this.cargarUsuarios(); },
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo restablecer el 2FA'; this.cdr.detectChanges(); },
    });
  }

  cerrarDialogDosFa() {
    this.dialogDosFaOpen = false;
    this.dosFaUsuario = null;
    this.dosFaQr = null;
    this.dosFaSecret = '';
    this.dosFaCodigo = '';
    this.errorDosFa = '';
  }

  abrirEditarUsuario(u: Usuario) {
    this.editandoUsuario = u;
    this.formUsuario = { nombre: u.nombre, email: u.email ?? '', telefono: u.telefono ?? '', password: '' };
    this.errorDialogUsuario = '';
    this.dialogUsuarioOpen = true;
  }

  cerrarEditarUsuario() {
    this.dialogUsuarioOpen = false;
    this.editandoUsuario = null;
  }

  guardarUsuario() {
    if (!this.editandoUsuario) return;
    // Un cajero (sin correo) no tiene correo que editar -- solo un usuario
    // "con correo" lo requiere obligatoriamente.
    const esCajero = !this.editandoUsuario.email;
    if (!this.formUsuario.nombre || (!esCajero && !this.formUsuario.email)) {
      this.errorDialogUsuario = 'Nombre y correo son obligatorios.';
      return;
    }

    const payload: Partial<Usuario> & { password?: string } = {
      nombre: this.formUsuario.nombre,
      telefono: this.formUsuario.telefono || null,
    };
    if (!esCajero) payload.email = this.formUsuario.email;
    if (this.formUsuario.password) payload.password = this.formUsuario.password;

    this.errorDialogUsuario = '';
    this.guardandoUsuario = true;
    this.usuarioService.actualizarUsuario(this.editandoUsuario.id_usuario, payload).subscribe({
      next: () => {
        this.guardandoUsuario = false;
        this.cerrarEditarUsuario();
        this.cargarUsuarios();
      },
      error: err => {
        this.guardandoUsuario = false;
        this.errorDialogUsuario = err?.error?.message || 'No se pudo actualizar el usuario';
      },
    });
  }

  toggleAdmin(usuario: Usuario) {
    this.errorEquipo = '';
    this.usuarioService.actualizarUsuario(usuario.id_usuario, { es_admin: !usuario.es_admin }).subscribe({
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo actualizar el usuario'; },
    });
  }

  cambiarEstado(usuario: Usuario, estado: string) {
    if (!estado || estado === usuario.estado) return;
    this.errorEquipo = '';
    this.usuarioService.actualizarUsuario(usuario.id_usuario, { estado } as Partial<Usuario>).subscribe({
      next: () => { usuario.estado = estado as Usuario['estado']; },
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo actualizar el estado'; },
    });
  }

  cambiarMiEstado(estado: 'activo' | 'ocupado') {
    if (estado === this.auth.session?.estado) return;
    this.errorEquipo = '';
    this.auth.cambiarMiEstado(estado).subscribe({
      next: () => {
        const mio = this.usuarios.find(u => u.id_usuario === this.miIdUsuario);
        if (mio) mio.estado = estado;
      },
      error: () => { this.errorEquipo = 'No se pudo actualizar tu estado'; },
    });
  }

  async eliminarUsuario(usuario: Usuario) {
    const ok = await this.notify.confirm(`¿Eliminar a ${usuario.nombre} del equipo?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.errorEquipo = '';
    this.usuarioService.eliminarUsuario(usuario.id_usuario).subscribe({
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo eliminar al usuario'; },
    });
  }
}
