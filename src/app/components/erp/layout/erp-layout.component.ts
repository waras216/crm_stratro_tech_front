import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/auth/authservices';
import { ThemeService } from '../../../core/theme.service';

export type ErpTab = 'dashboard' | 'finanzas' | 'compras' | 'ventas' | 'inventario' | 'fabricacion' | 'scm' | 'rrhh' | 'crm' | 'proyectos';

interface MenuItem { id: ErpTab; label: string; svg: SafeHtml; }

const I = (path: string) =>
  `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg>`;

@Component({
  selector: 'app-erp-layout',
  standalone: false,
  templateUrl: './erp-layout.component.html',
  styleUrls: ['./erp-layout.component.scss'],
})
export class ErpLayoutComponent implements OnInit {
  @Input() tabActivo: ErpTab = 'dashboard';
  @Output() cambiarTab = new EventEmitter<ErpTab>();

  collapsed = false;
  mobileOpen = false;
  menuItems: MenuItem[];
  logo: string | null = null;
  userName = '';
  userEmail = '';

  get darkMode() { return this.theme.isDark; }

  constructor(private sanitizer: DomSanitizer, private router: Router, private auth: AuthService, public theme: ThemeService) {
    this.menuItems = ([
      { id: 'dashboard',   label: 'Dashboard',    svg: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
      { id: 'finanzas',    label: 'Finanzas',     svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { id: 'compras',     label: 'Compras',      svg: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' },
      { id: 'ventas',      label: 'Ventas',       svg: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>' },
      { id: 'inventario',  label: 'Inventario',   svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
      { id: 'fabricacion', label: 'Fabricación',  svg: '<path d="M2 20h20"/><path d="M5 20V8l5 4V8l5 4V4l5 4v12"/>' },
      { id: 'scm',         label: 'Cadena Sumin.',svg: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>' },
      { id: 'rrhh',        label: 'RRHH',         svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
      { id: 'crm',         label: 'CRM',          svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
      { id: 'proyectos',   label: 'Proyectos',    svg: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' },
    ] as { id: ErpTab; label: string; svg: string }[]).map(item => ({
      ...item,
      svg: this.sanitizer.bypassSecurityTrustHtml(I(item.svg))
    }));
  }

  ngOnInit() {
    this.theme.init();
    this.logo = this.auth.getLogo();
    const s = this.auth.session;
    this.userName = s?.nombre || 'Administrador';
    this.userEmail = s?.email || '';
  }

  toggleTheme() {
    this.theme.toggle();
  }

  isActive(id: ErpTab): boolean {
    return this.tabActivo === id;
  }

  getActiveLabel(): string {
    return this.menuItems.find(m => this.isActive(m.id))?.label ?? 'ERP';
  }

  onNavigate(id: ErpTab) {
    this.cambiarTab.emit(id);
    this.mobileOpen = false;
  }
}
