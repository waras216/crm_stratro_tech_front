import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/authservices';
import { ThemeService } from '../../core/theme.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { RolService } from '../../core/services/rol.service';
import { Usuario, Rol } from '../../models/crm.models';

type TabConfiguracion = 'general' | 'cuenta' | 'notificaciones' | 'apariencia' | 'seguridad' | 'equipo' | 'negocio';

@Component({
  selector: 'app-configuracion',
  standalone: false,
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
})
export class ConfiguracionComponent implements OnInit {
  activeTab: TabConfiguracion = 'general';

  // General
  nombreEmpresa = '';
  sector = '';
  moneda = 'MXN';
  idioma = 'es';
  zonaHoraria = 'America/Mexico_City';

  // Negocio (nicho + módulos contratados, solo admin)
  nichos = ['hotel', 'restaurante', 'almacen', 'farmacia', 'startup', 'tienda'];
  nichoSeleccionado = '';
  modulosNegocio = { crm: true, pos: false, erp: false };
  guardandoNegocio = false;
  errorNegocio = '';

  get modulosNegocioValidos(): boolean {
    return this.modulosNegocio.crm || this.modulosNegocio.pos || this.modulosNegocio.erp;
  }

  // Cuenta
  nombre = '';
  email = '';
  telefono = '';

  // Notificaciones
  notifEmail = true;
  notifPush = true;
  notifLeads = true;
  notifActividades = true;
  notifReportes = false;

  // Apariencia
  tema: 'light' | 'dark' | 'system' = 'light';
  sidebarCompacto = false;
  animaciones = true;
  colorAccent = '#6366f1';
  fontSize: 'small' | 'medium' | 'large' = 'medium';
  densidad: 'compact' | 'normal' | 'comfortable' = 'normal';
  borderRadius: 'none' | 'small' | 'medium' | 'large' = 'medium';

  colores = [
    { val: '#6366f1', label: 'Indigo' },
    { val: '#8b5cf6', label: 'Violeta' },
    { val: '#ec4899', label: 'Rosa' },
    { val: '#059669', label: 'Esmeralda' },
    { val: '#0891b2', label: 'Cyan' },
    { val: '#d97706', label: 'Ámbar' },
  ];

  // Seguridad
  dosFactores = false;
  sesionActiva = true;

  monedas = ['MXN', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'PEN'];
  idiomas = [{ val: 'es', label: 'Español' }, { val: 'en', label: 'English' }];
  zonas = ['America/Mexico_City', 'America/Bogota', 'America/Buenos_Aires', 'America/New_York', 'Europe/Madrid'];

  tabs = [
    { id: 'general' as const, label: 'General', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>' },
    { id: 'cuenta' as const, label: 'Cuenta', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
    { id: 'apariencia' as const, label: 'Apariencia', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17.1 13.1A7.5 7.5 0 0 0 12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.7 0 3.3-.4 4.7-1.2"/><path d="M19 17l3 3-3 3"/></svg>' },
    { id: 'seguridad' as const, label: 'Seguridad', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { id: 'equipo' as const, label: 'Equipo', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id: 'negocio' as const, label: 'Negocio', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>' },
  ];

  saved = false;
  errorCuenta = '';
  errorGeneral = '';
  logoPreview: string | null = null;

  // Equipo
  usuarios: Usuario[] = [];
  cargandoUsuarios = false;
  errorEquipo = '';
  invitando = false;
  modoInvitar: 'con_correo' | 'cajero' = 'con_correo';
  nuevoUsuario: { nombre: string; email: string; password: string; es_admin: boolean; id_rol: number | null } =
    { nombre: '', email: '', password: '', es_admin: false, id_rol: null };
  erroresNuevoUsuario: { nombre?: string; email?: string; password?: string } = {};
  roles: Rol[] = [];
  avisoEquipo = '';

  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get rolesAsignables(): Rol[] { return this.roles.filter(r => !r.es_sistema); }

  // Editar usuario existente
  dialogUsuarioOpen = false;
  editandoUsuario: Usuario | null = null;
  formUsuario = { nombre: '', email: '', password: '' };
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

  get esAdmin(): boolean { return !!this.auth.session?.es_admin; }
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
    public theme: ThemeService,
    private location: Location,
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private cdr: ChangeDetectorRef,
  ) {}

  goBack() { this.location.back(); }

  setActiveTab(tab: TabConfiguracion) {
    this.activeTab = tab;
    localStorage.setItem('configuracionActiveTab', tab);
  }

  ngOnInit() {
    const tabsPermitidos: TabConfiguracion[] = ['general', 'cuenta', 'notificaciones', 'apariencia', 'seguridad'];
    if (this.esAdmin) tabsPermitidos.push('equipo', 'negocio');
    const tabGuardado = localStorage.getItem('configuracionActiveTab') as TabConfiguracion | null;
    if (tabGuardado && tabsPermitidos.includes(tabGuardado)) this.activeTab = tabGuardado;

    const session = this.auth.session;
    if (session) {
      this.nombre = session.nombre;
      this.email = session.email;
      this.nombreEmpresa = session.empresa || '';
      this.sector = session.sector || '';
      this.idioma = session.idioma || 'es';
      this.zonaHoraria = session.zonaHoraria || 'America/Mexico_City';
      this.moneda = session.nichoData?.moneda || 'MXN';
      this.nichoSeleccionado = session.nichoData?.nicho || '';
      if (session.nichoData?.modulos) this.modulosNegocio = { ...session.nichoData.modulos };
    }
    this.tema = (localStorage.getItem('tema') as any) || (this.theme.isDark ? 'dark' : 'light');
    this.sidebarCompacto = localStorage.getItem('sidebarCompacto') === 'true';
    this.animaciones = localStorage.getItem('animaciones') !== 'false';
    this.colorAccent = localStorage.getItem('colorAccent') || '#6366f1';
    this.fontSize = (localStorage.getItem('fontSize') as any) || 'medium';
    this.densidad = (localStorage.getItem('densidad') as any) || 'normal';
    this.borderRadius = (localStorage.getItem('borderRadius') as any) || 'medium';
    this.notifEmail = localStorage.getItem('notifEmail') !== 'false';
    this.notifPush = localStorage.getItem('notifPush') !== 'false';
    this.notifLeads = localStorage.getItem('notifLeads') !== 'false';
    this.notifActividades = localStorage.getItem('notifActividades') !== 'false';
    this.notifReportes = localStorage.getItem('notifReportes') === 'true';
    this.dosFactores = localStorage.getItem('dosFactores') === 'true';
    this.sesionActiva = localStorage.getItem('sesionActiva') !== 'false';
    this.logoPreview = this.auth.session?.logo ?? null;
    this.applyStoredStyles();
    if (this.esAdmin) {
      this.cargarUsuarios();
      this.rolService.cargarRoles().subscribe({ next: roles => this.roles = roles });
    }
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
        this.nuevoUsuario = { nombre: '', email: '', password: '', es_admin: false, id_rol: null };
        this.erroresNuevoUsuario = {};
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

  restablecerDosFa(usuario: Usuario) {
    if (!confirm(`¿Restablecer la verificación en dos pasos de ${usuario.nombre}? Va a necesitar configurarla de nuevo para poder entrar.`)) return;
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
    this.formUsuario = { nombre: u.nombre, email: u.email ?? '', password: '' };
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

  eliminarUsuario(usuario: Usuario) {
    if (!confirm(`¿Eliminar a ${usuario.nombre} del equipo?`)) return;
    this.errorEquipo = '';
    this.usuarioService.eliminarUsuario(usuario.id_usuario).subscribe({
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo eliminar al usuario'; },
    });
  }

  subiendoLogo = false;

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.subiendoLogo = true;
    this.auth.subirLogoEmpresa(file).subscribe({
      next: ok => {
        this.subiendoLogo = false;
        if (ok) this.logoPreview = this.auth.session?.logo ?? null;
        else this.errorGeneral = 'No se pudo subir el logo.';
      },
      error: () => { this.subiendoLogo = false; this.errorGeneral = 'No se pudo subir el logo.'; },
    });
  }

  eliminarLogo() {
    this.auth.eliminarLogoEmpresa().subscribe(() => { this.logoPreview = null; });
  }

  guardarNegocio() {
    if (this.guardandoNegocio || !this.modulosNegocioValidos) return;

    this.guardandoNegocio = true;
    this.errorNegocio = '';
    this.auth.actualizarTenant({ nicho: this.nichoSeleccionado, modulos: this.modulosNegocio }).subscribe({
      next: () => {
        this.guardandoNegocio = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 2500);
      },
      error: err => {
        this.guardandoNegocio = false;
        this.errorNegocio = err?.error?.message || 'No se pudo actualizar la configuración del negocio.';
      },
    });
  }

  cambiarTema(t: 'light' | 'dark' | 'system') {
    this.tema = t;
  }

  toggleSidebarCompacto() {
    this.sidebarCompacto = !this.sidebarCompacto;
  }

  toggleAnimaciones() {
    this.animaciones = !this.animaciones;
  }

  cambiarColor(color: string) {
    this.colorAccent = color;
  }

  cambiarFontSize(size: 'small' | 'medium' | 'large') {
    this.fontSize = size;
  }

  cambiarDensidad(d: 'compact' | 'normal' | 'comfortable') {
    this.densidad = d;
  }

  cambiarBorderRadius(r: 'none' | 'small' | 'medium' | 'large') {
    this.borderRadius = r;
  }

  guardar() {
    // Tema
    const shouldBeDark = this.tema === 'dark' || (this.tema === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (shouldBeDark !== this.theme.isDark) {
      this.theme.toggle();
    }
    localStorage.setItem('tema', this.tema);

    // Apariencia
    localStorage.setItem('colorAccent', this.colorAccent);
    localStorage.setItem('fontSize', this.fontSize);
    localStorage.setItem('densidad', this.densidad);
    localStorage.setItem('borderRadius', this.borderRadius);
    localStorage.setItem('sidebarCompacto', String(this.sidebarCompacto));
    localStorage.setItem('animaciones', String(this.animaciones));

    // Aplicar CSS variables
    document.documentElement.style.setProperty('--accent', this.colorAccent);
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font', sizes[this.fontSize]);
    const spacings = { compact: '0.25rem', normal: '0.5rem', comfortable: '0.75rem' };
    document.documentElement.style.setProperty('--spacing', spacings[this.densidad]);
    const radii = { none: '0', small: '0.375rem', medium: '0.75rem', large: '1.25rem' };
    document.documentElement.style.setProperty('--radius', radii[this.borderRadius]);
    document.documentElement.classList.toggle('no-animations', !this.animaciones);

    // General (sector/idioma/zona horaria/moneda/nombre de empresa)
    this.errorGeneral = '';
    this.auth.actualizarTenant({
      sector: this.sector,
      idioma: this.idioma,
      zonaHoraria: this.zonaHoraria,
      moneda: this.moneda,
      empresa: this.nombreEmpresa,
    }).subscribe({
      next: () => {
        this.saved = true;
        setTimeout(() => this.saved = false, 2500);
      },
      error: err => {
        this.errorGeneral = err?.error?.message || 'No se pudo actualizar la configuración general.';
      },
    });

    // Notificaciones
    localStorage.setItem('notifEmail', String(this.notifEmail));
    localStorage.setItem('notifPush', String(this.notifPush));
    localStorage.setItem('notifLeads', String(this.notifLeads));
    localStorage.setItem('notifActividades', String(this.notifActividades));
    localStorage.setItem('notifReportes', String(this.notifReportes));

    // Seguridad
    localStorage.setItem('dosFactores', String(this.dosFactores));
    localStorage.setItem('sesionActiva', String(this.sesionActiva));

    // Cuenta (nombre/email persisten en el backend)
    this.errorCuenta = '';
    this.auth.actualizarPerfil({ nombre: this.nombre, email: this.email }).subscribe({
      next: () => {
        this.saved = true;
        setTimeout(() => this.saved = false, 2500);
      },
      error: err => {
        this.errorCuenta = err?.error?.message || 'No se pudo actualizar tu perfil.';
      },
    });
  }

  private applyStoredStyles() {
    document.documentElement.style.setProperty('--accent', this.colorAccent);
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font', sizes[this.fontSize]);
    const spacings = { compact: '0.25rem', normal: '0.5rem', comfortable: '0.75rem' };
    document.documentElement.style.setProperty('--spacing', spacings[this.densidad]);
    const radii = { none: '0', small: '0.375rem', medium: '0.75rem', large: '1.25rem' };
    document.documentElement.style.setProperty('--radius', radii[this.borderRadius]);
    document.documentElement.classList.toggle('no-animations', !this.animaciones);
  }

  logout() {
    this.auth.logout();
  }
}
