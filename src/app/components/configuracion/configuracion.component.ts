import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/authservices';
import { ThemeService } from '../../core/theme.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../models/crm.models';

@Component({
  selector: 'app-configuracion',
  standalone: false,
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
})
export class ConfiguracionComponent implements OnInit {
  activeTab: 'general' | 'cuenta' | 'notificaciones' | 'apariencia' | 'seguridad' | 'equipo' = 'general';

  // General
  nombreEmpresa = '';
  sector = '';
  moneda = 'MXN';
  idioma = 'es';
  zonaHoraria = 'America/Mexico_City';

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
  ];

  saved = false;
  logoPreview: string | null = null;

  // Equipo
  usuarios: Usuario[] = [];
  cargandoUsuarios = false;
  errorEquipo = '';
  invitando = false;
  nuevoUsuario = { nombre: '', email: '', password: '', es_admin: false };

  get esAdmin(): boolean { return !!this.auth.session?.es_admin; }
  get maxUsuarios(): number | null { return this.auth.session?.plan?.max_usuarios ?? null; }
  get limiteAlcanzado(): boolean { return this.maxUsuarios !== null && this.usuarios.length >= this.maxUsuarios; }
  get miIdUsuario(): number | undefined { return this.auth.session?.id_usuario; }

  constructor(
    private auth: AuthService,
    public theme: ThemeService,
    private location: Location,
    private usuarioService: UsuarioService,
  ) {}

  goBack() { this.location.back(); }

  ngOnInit() {
    const session = this.auth.session;
    if (session) {
      this.nombre = session.nombre;
      this.email = session.email;
      this.nombreEmpresa = session.empresa || '';
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
    this.logoPreview = this.auth.getLogo();
    this.applyStoredStyles();
    if (this.esAdmin) this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargandoUsuarios = true;
    this.usuarioService.cargarUsuarios().subscribe({
      next: usuarios => { this.usuarios = usuarios; this.cargandoUsuarios = false; },
      error: () => { this.cargandoUsuarios = false; },
    });
  }

  invitarUsuario() {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email || !this.nuevoUsuario.password) return;
    this.errorEquipo = '';
    this.invitando = true;
    this.usuarioService.invitarUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.invitando = false;
        this.nuevoUsuario = { nombre: '', email: '', password: '', es_admin: false };
      },
      error: err => {
        this.invitando = false;
        this.errorEquipo = err?.error?.message || 'No se pudo invitar al usuario';
      },
    });
  }

  toggleAdmin(usuario: Usuario) {
    this.errorEquipo = '';
    this.usuarioService.actualizarUsuario(usuario.id_usuario, { es_admin: !usuario.es_admin }).subscribe({
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo actualizar el usuario'; },
    });
  }

  eliminarUsuario(usuario: Usuario) {
    if (!confirm(`¿Eliminar a ${usuario.nombre} del equipo?`)) return;
    this.errorEquipo = '';
    this.usuarioService.eliminarUsuario(usuario.id_usuario).subscribe({
      error: err => { this.errorEquipo = err?.error?.message || 'No se pudo eliminar al usuario'; },
    });
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      this.auth.setLogo(this.logoPreview);
    };
    reader.readAsDataURL(file);
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

    // General
    const session = this.auth.session;
    if (session) {
      session.nombre = this.nombre;
      session.empresa = this.nombreEmpresa;
      localStorage.setItem('crm_session', JSON.stringify(session));
    }

    // Notificaciones
    localStorage.setItem('notifEmail', String(this.notifEmail));
    localStorage.setItem('notifPush', String(this.notifPush));
    localStorage.setItem('notifLeads', String(this.notifLeads));
    localStorage.setItem('notifActividades', String(this.notifActividades));
    localStorage.setItem('notifReportes', String(this.notifReportes));

    // Seguridad
    localStorage.setItem('dosFactores', String(this.dosFactores));
    localStorage.setItem('sesionActiva', String(this.sesionActiva));

    this.saved = true;
    setTimeout(() => this.saved = false, 2500);
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
