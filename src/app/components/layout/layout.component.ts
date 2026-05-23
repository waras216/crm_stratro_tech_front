import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModuloCRM } from '../../models/crm.models';

interface MenuItem { id: ModuloCRM; label: string; icon: string; }

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  @Input() moduloActivo: ModuloCRM = 'dashboard';
  @Output() navigate = new EventEmitter<ModuloCRM>();

  collapsed = false;
  mobileOpen = false;

  menuItems: MenuItem[] = [
    { id: 'dashboard',     label: 'Dashboard',     icon: '⊞' },
    { id: 'leads',         label: 'Leads',          icon: '👥' },
    { id: 'oportunidades', label: 'Oportunidades',  icon: '🎯' },
    { id: 'clientes',      label: 'Clientes',       icon: '✔️' },
    { id: 'actividades',   label: 'Actividades',    icon: '📋' },
    { id: 'marketing',     label: 'Marketing',      icon: '📣' },
    { id: 'automatizar',   label: 'Automatizar',    icon: '⚡' },
    { id: 'reportes',      label: 'Reportes',       icon: '📊' },
    { id: 'integraciones', label: 'Integraciones',  icon: '🔌' },
  ];

  onNavigate(id: ModuloCRM) {
    this.navigate.emit(id);
    this.mobileOpen = false;
  }

  getActiveLabel(): string {
    return this.menuItems.find(m => m.id === this.moduloActivo)?.label ?? '';
  }
}
