import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { Integracion } from '../../../models/crm.models';

@Component({ selector: 'app-integraciones', standalone: false, templateUrl: './integraciones.component.html', styleUrls: ['./integraciones.component.scss'] })
export class IntegracionesComponent implements OnInit {
  integraciones: Integracion[] = [];
  selected: Integracion | null = null;
  cargando = false;

  tipoConfig: Record<string, { icon: string; color: string; bg: string }> = {
    whatsapp:      { icon: '💬', color: '#16a34a', bg: '#dcfce7' },
    email:         { icon: '✉️', color: '#dc2626', bg: '#fee2e2' },
    calendario:    { icon: '📅', color: '#2563eb', bg: '#dbeafe' },
    almacenamiento:{ icon: '💾', color: '#ca8a04', bg: '#fef9c3' },
    otro:          { icon: '🔌', color: '#64748b', bg: '#f1f5f9' },
  };

  estadoConfig: Record<string, { icon: string; color: string; label: string }> = {
    conectada:    { icon: '✅', color: '#16a34a', label: 'Conectada' },
    desconectada: { icon: '⭕', color: '#94a3b8', label: 'Desconectada' },
    error:        { icon: '⚠️', color: '#dc2626', label: 'Error' },
  };

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.crm.cargarIntegraciones().subscribe({
      next: res => { this.integraciones = res.data ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  toggle(id: number) { this.crm.toggleIntegracion(id).subscribe(() => this.cargar()); }
  openConfig(integ: Integracion) { this.selected = integ; }
  closeConfig() { this.selected = null; }

  configEntries(integ: Integracion): {k: string; v: string}[] {
    if (!integ.configuracion) return [];
    return Object.entries(integ.configuracion)
      .filter(([, v]) => v && v.trim() !== '')
      .map(([k, v]) => ({ k, v: v as string }));
  }

  getIntegById(id: number) { return this.integraciones.find(i => i.id === id); }
}
