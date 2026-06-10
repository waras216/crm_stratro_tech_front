import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModuloCRM } from '../../models/crm.models';

interface MenuItem { id: ModuloCRM; label: string; svg: SafeHtml; }

const I = (path: string) =>
  `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg>`;

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  @Input() moduloActivo: ModuloCRM = 'dashboard';
  @Output() navigate = new EventEmitter<ModuloCRM>();

  collapsed  = false;
  mobileOpen = false;
  darkMode   = false;
  menuItems: MenuItem[];

  constructor(private sanitizer: DomSanitizer) {
    this.menuItems = ([
      { id: 'dashboard',     label: 'Dashboard',      svg: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
      { id: 'leads',         label: 'Leads',           svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
      { id: 'oportunidades', label: 'Oportunidades',   svg: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
      { id: 'clientes',      label: 'Clientes',        svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
      { id: 'actividades',   label: 'Actividades',     svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>' },
      { id: 'marketing',     label: 'Marketing',       svg: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
      { id: 'automatizar',   label: 'Automatizar',     svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
      { id: 'reportes',      label: 'Reportes',        svg: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
      { id: 'integraciones', label: 'Integraciones',   svg: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>' },
    ] as { id: ModuloCRM; label: string; svg: string }[]).map(item => ({
      ...item,
      svg: this.sanitizer.bypassSecurityTrustHtml(I(item.svg))
    }));
  }

  ngOnInit() {
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.darkMode);
  }

  onNavigate(id: ModuloCRM) { this.navigate.emit(id); this.mobileOpen = false; }
  getActiveLabel() { return this.menuItems.find(m => m.id === this.moduloActivo)?.label ?? ''; }
}
