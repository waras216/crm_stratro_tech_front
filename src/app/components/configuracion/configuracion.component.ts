import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/authservices';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-configuracion',
  standalone: false,
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
})
export class ConfiguracionComponent implements OnInit {
  activeTab: 'general' | 'cuenta' | 'notificaciones' | 'apariencia' | 'seguridad' = 'general';

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
  ];

  saved = false;
  logoPreview: string | null = null;

  constructor(private auth: AuthService, public theme: ThemeService) {}

  ngOnInit() {
    const session = this.auth.session;
    if (session) {
      this.nombre = session.nombre;
      this.email = session.email;
      this.nombreEmpresa = session.empresa || '';
    }
    this.tema = this.theme.isDark ? 'dark' : 'light';
    this.animaciones = localStorage.getItem('animaciones') !== 'false';
    this.logoPreview = this.auth.getLogo();
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

  guardar() {
    if ((this.tema === 'dark') !== this.theme.isDark) {
      this.theme.toggle();
    }
    localStorage.setItem('animaciones', String(this.animaciones));
    this.saved = true;
    setTimeout(() => this.saved = false, 2500);
  }

  logout() {
    this.auth.logout();
  }
}
