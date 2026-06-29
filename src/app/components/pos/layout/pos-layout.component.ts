import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/auth/authservices';
import { ThemeService } from '../../../core/theme.service';
import { NichoService } from '../../../core/services/nicho.service';

export type PosTab = 'terminal' | 'historial';

interface MenuItem { id: PosTab; label: string; svg: SafeHtml; }

const I = (path: string) =>
  `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg>`;

@Component({
  selector: 'app-pos-layout',
  standalone: false,
  templateUrl: './pos-layout.component.html',
  styleUrls: ['./pos-layout.component.scss'],
})
export class PosLayoutComponent implements OnInit {
  @Input() tabActivo: PosTab = 'terminal';
  @Output() cambiarTab = new EventEmitter<PosTab>();

  now = new Date();
  cajero = 'Administrador';
  collapsed = false;
  mobileOpen = false;
  menuItems: MenuItem[];
  logo: string | null = null;
  userEmail = '';

  get darkMode() { return this.theme.isDark; }

  constructor(private sanitizer: DomSanitizer, private router: Router, private auth: AuthService, public theme: ThemeService, private nichoSvc: NichoService) {
    this.menuItems = [];
  }

  ngOnInit() {
    this.theme.init();
    this.logo = this.auth.getLogo();
    const s = this.auth.session;
    this.cajero = s?.nombre || 'Administrador';
    this.userEmail = s?.email || '';
    const cfg = this.nichoSvc.config;
    this.menuItems = ([
      { id: 'terminal',  label: cfg.posTerminal,  svg: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
      { id: 'historial', label: cfg.posHistorial, svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>' },
    ] as { id: PosTab; label: string; svg: string }[]).map(item => ({
      ...item,
      svg: this.sanitizer.bypassSecurityTrustHtml(I(item.svg))
    }));
  }

  toggleTheme() {
    this.theme.toggle();
  }

  isActive(id: PosTab): boolean {
    return this.tabActivo === id;
  }

  getActiveLabel(): string {
    return this.menuItems.find(m => this.isActive(m.id))?.label ?? 'Punto de Venta';
  }

  onNavigate(id: PosTab) {
    this.cambiarTab.emit(id);
    this.mobileOpen = false;
  }
}
