import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/authservices';
import { ThemeService } from '../../core/theme.service';
import { NotifyService } from '../../core/services/notify.service';
import { REGIMENES_FISCALES_SAT } from '../../core/constants/sat.constants';
import {
  ALMACEN_OPS_LABELS, FARM_ATENCION_LABELS, FARM_ESPECIALIDADES_LABELS,
  HOTEL_AMENIDADES_LABELS, REST_CANALES_LABELS, STARTUP_METRICAS_LABELS, TIENDA_CANALES_LABELS,
} from '../../core/services/nicho.service';

interface PerfilNegocioCampo { label: string; texto?: string; lista?: string[]; labelsMap?: Record<string, string>; }

type TabConfiguracion = 'general' | 'cuenta' | 'notificaciones' | 'apariencia' | 'seguridad' | 'negocio' | 'fiscal';

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

  // Fiscal (datos del emisor para timbrado real de CFDI, ver Facturación en ERP)
  regimenesFiscales = REGIMENES_FISCALES_SAT;
  fiscalRfc = '';
  fiscalRazonSocial = '';
  fiscalRegimen = '';
  fiscalCodigoPostal = '';
  guardandoFiscal = false;
  errorFiscal = '';

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
    { id: 'negocio' as const, label: 'Negocio', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>' },
    { id: 'fiscal' as const, label: 'Fiscal', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>' },
  ];

  saved = false;
  errorCuenta = '';
  errorGeneral = '';
  logoPreview: string | null = null;

  get esAdmin(): boolean { return !!this.auth.session?.es_admin; }

  get perfilNegocioCampos(): PerfilNegocioCampo[] {
    const d = this.auth.session?.nichoData;
    if (!d) return [];
    switch (d.nicho) {
      case 'hotel':
        return [
          { label: 'Tipo de propiedad', texto: d.hotelTipo || '—' },
          { label: 'Habitaciones', texto: d.hotelHabitaciones != null ? String(d.hotelHabitaciones) : '—' },
          { label: 'Tipos de habitación', lista: d.hotelTiposHabitacion || [] },
          { label: 'Amenidades', lista: d.hotelAmenidades || [], labelsMap: HOTEL_AMENIDADES_LABELS },
        ];
      case 'restaurante':
        return [
          { label: 'Tipo de restaurante', texto: d.restTipo || '—' },
          { label: 'Mesas', texto: d.restMesas != null ? String(d.restMesas) : '—' },
          { label: 'Canales de venta', lista: d.restCanales || [], labelsMap: REST_CANALES_LABELS },
        ];
      case 'almacen':
        return [
          { label: 'Tipo de almacén', texto: d.almacenTipo || '—' },
          { label: 'Capacidad', texto: d.almacenSkus || '—' },
          { label: 'Operaciones', lista: d.almacenOps || [], labelsMap: ALMACEN_OPS_LABELS },
        ];
      case 'farmacia':
        return [
          { label: 'Tipo de farmacia', texto: d.farmTipo || '—' },
          { label: 'Modos de atención', lista: d.farmAtencion || [], labelsMap: FARM_ATENCION_LABELS },
          { label: 'Especialidades', lista: d.farmEspecialidades || [], labelsMap: FARM_ESPECIALIDADES_LABELS },
        ];
      case 'startup':
        return [
          { label: 'Etapa', texto: d.startupEtapa || '—' },
          { label: 'Modelo de negocio', texto: d.startupModelo || '—' },
          { label: 'Métricas clave', lista: d.startupMetricas || [], labelsMap: STARTUP_METRICAS_LABELS },
        ];
      case 'tienda':
        return [
          { label: 'Tipo de tienda', texto: d.tiendaTipo || '—' },
          { label: 'Canales de venta', lista: d.tiendaCanales || [], labelsMap: TIENDA_CANALES_LABELS },
        ];
      default:
        return [];
    }
  }

  perfilNegocioLabel(campo: PerfilNegocioCampo, id: string): string {
    return campo.labelsMap?.[id] || id;
  }

  constructor(
    private auth: AuthService,
    public theme: ThemeService,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
  ) {}

  // Angular sanitiza (y descarta) cualquier <svg> pasado a [innerHTML] sin esto.
  safe(html: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(html); }

  goBack() { this.location.back(); }
  goToRoles() { this.router.navigate(['/admin/roles']); }

  setActiveTab(tab: TabConfiguracion) {
    this.activeTab = tab;
    localStorage.setItem('configuracionActiveTab', tab);
  }

  ngOnInit() {
    const tabsPermitidos: TabConfiguracion[] = ['general', 'cuenta', 'notificaciones', 'apariencia', 'seguridad'];
    if (this.esAdmin) tabsPermitidos.push('negocio', 'fiscal');
    const tabGuardado = localStorage.getItem('configuracionActiveTab') as TabConfiguracion | null;
    if (tabGuardado && tabsPermitidos.includes(tabGuardado)) this.activeTab = tabGuardado;

    // Deep-link desde cualquier link con ?tab=. Pisa el tab guardado.
    const tabDeep = this.route.snapshot.queryParamMap.get('tab') as TabConfiguracion | null;
    if (tabDeep && tabsPermitidos.includes(tabDeep)) this.activeTab = tabDeep;

    const session = this.auth.session;
    if (session) {
      this.nombre = session.nombre;
      this.email = session.email;
      this.telefono = session.telefono || '';
      this.nombreEmpresa = session.empresa || '';
      this.sector = session.sector || '';
      this.idioma = session.idioma || 'es';
      this.zonaHoraria = session.zonaHoraria || 'America/Mexico_City';
      this.moneda = session.nichoData?.moneda || 'MXN';
      this.nichoSeleccionado = session.nichoData?.nicho || '';
      if (session.nichoData?.modulos) this.modulosNegocio = { ...session.nichoData.modulos };
      this.fiscalRfc = session.fiscal?.rfc || '';
      this.fiscalRazonSocial = session.fiscal?.razonSocial || '';
      this.fiscalRegimen = session.fiscal?.regimenFiscal || '';
      this.fiscalCodigoPostal = session.fiscal?.codigoPostal || '';
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

  guardarFiscal() {
    if (this.guardandoFiscal) return;

    this.guardandoFiscal = true;
    this.errorFiscal = '';
    this.auth.actualizarTenant({
      fiscal: {
        rfc: this.fiscalRfc,
        razonSocial: this.fiscalRazonSocial,
        regimenFiscal: this.fiscalRegimen,
        codigoPostal: this.fiscalCodigoPostal,
      },
    }).subscribe({
      next: () => {
        this.guardandoFiscal = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 2500);
      },
      error: err => {
        this.guardandoFiscal = false;
        this.errorFiscal = err?.error?.message || 'No se pudo actualizar la configuración fiscal.';
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
    this.auth.actualizarPerfil({ nombre: this.nombre, email: this.email, telefono: this.telefono || null }).subscribe({
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
