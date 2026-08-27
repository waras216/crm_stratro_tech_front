import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { Lead, Oportunidad, Cliente, Actividad } from '../../../models/crm.models';
import { DateRange } from '../../shared/date-range/date-range.component';

@Component({ selector: 'app-reportes', standalone: false, templateUrl: './reportes.component.html', styleUrls: ['./reportes.component.scss'] })
export class ReportesComponent implements OnInit {
  leads: Lead[] = []; oportunidades: Oportunidad[] = []; clientes: Cliente[] = []; actividades: Actividad[] = [];
  leadsBySource: {key: string; val: number}[] = [];
  leadsByStatus: {key: string; val: number}[] = [];
  oppsByStage: {key: string; val: number}[] = [];
  oppsByPipeline: {key: string; val: number}[] = [];
  clientsBySector: {key: string; val: number}[] = [];
  activitiesByType: {key: string; val: number}[] = [];
  totalValue = 0; avgValue = 0; completedActs = 0; pendingActs = 0;
  leadsCount = 0; oportunidadesCount = 0; clientesCount = 0; actividadesCount = 0;

  // Filtro de periodo (aplica sobre la fecha propia de cada entidad; ver filtrarPorRango)
  rango: DateRange = { desde: null, hasta: null };

  // Tooltip flotante compartido por todas las gráficas de barras de progreso
  tooltip = { visible: false, x: 0, y: 0, label: '', value: 0, pct: 0 };

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private exportSvc: ReportExportService) {}

  ngOnInit() {
    this.crm.cargarLeads(1, '', '', 500).subscribe(res => { this.leads = res.data; this.refresh(); });
    this.crm.cargarOportunidades().subscribe(res => { this.oportunidades = res.data; this.refresh(); });
    this.crm.cargarClientes(1, '', '', 500).subscribe(res => { this.clientes = res.data; this.refresh(); });
    this.crm.cargarActividades().subscribe(res => { this.actividades = res.data; this.refresh(); });
  }

  toArr(obj: Record<string, number>) { return Object.entries(obj).map(([k, v]) => ({key: k, val: v})).sort((a, b) => b.val - a.val); }
  group(arr: any[], key: string) { const r: Record<string, number> = {}; arr.forEach(i => { r[i[key]] = (r[i[key]] || 0) + 1; }); return r; }
  maxVal(arr: {val: number}[]) { return arr.length ? Math.max(...arr.map(i => i.val)) : 1; }

  // Filtra por el rango de fechas seleccionado en <app-date-range>. Sin rango, devuelve todo.
  private filtrarPorRango<T>(arr: T[], fechaFn: (item: T) => string | null | undefined): T[] {
    if (!this.rango.desde && !this.rango.hasta) return arr;
    return arr.filter(item => {
      const raw = fechaFn(item);
      if (!raw) return false;
      const fecha = raw.slice(0, 10);
      if (this.rango.desde && fecha < this.rango.desde) return false;
      if (this.rango.hasta && fecha > this.rango.hasta) return false;
      return true;
    });
  }

  get leadsFiltrados()         { return this.filtrarPorRango(this.leads, l => l.fecha_creacion || l.created_at); }
  get oportunidadesFiltradas() { return this.filtrarPorRango(this.oportunidades, o => o.created_at); }
  get clientesFiltrados()      { return this.filtrarPorRango(this.clientes, c => c.fecha_registro || c.created_at); }
  get actividadesFiltradas()   { return this.filtrarPorRango(this.actividades, a => a.fecha_inicio); }

  onRangeChange(r: DateRange) { this.rango = r; this.refresh(); }

  refresh() {
    const leads = this.leadsFiltrados;
    const oportunidades = this.oportunidadesFiltradas;
    const clientes = this.clientesFiltrados;
    const actividades = this.actividadesFiltradas;

    this.leadsBySource    = this.toArr(this.group(leads, 'fuente'));
    this.leadsByStatus    = this.toArr(this.group(leads, 'estado'));
    this.oppsByStage      = this.toArr(this.group(oportunidades, 'etapa'));
    this.oppsByPipeline   = this.toArr(this.group(oportunidades.map(o => ({ pipeline: o.pipeline?.nombre ?? 'Sin pipeline' })), 'pipeline'));
    this.clientsBySector  = this.toArr(this.group(clientes.map(c => ({ sector_empresarial: c.sector_empresarial ?? 'Sin sector' })), 'sector_empresarial'));
    this.activitiesByType = this.toArr(this.group(actividades, 'tipo'));
    this.totalValue    = oportunidades.reduce((s, o) => s + Number(o.valor ?? 0), 0);
    this.avgValue      = oportunidades.length ? this.totalValue / oportunidades.length : 0;
    this.completedActs = actividades.filter(a => a.estado === 'completada').length;
    this.pendingActs   = actividades.filter(a => a.estado !== 'completada').length;
    this.leadsCount = leads.length; this.oportunidadesCount = oportunidades.length;
    this.clientesCount = clientes.length; this.actividadesCount = actividades.length;
    this.cdr.detectChanges();
  }

  barWidth(val: number, arr: {val: number}[]) { const m = this.maxVal(arr); return m > 0 ? (val / m * 100) + '%' : '0%'; }
  ganadas()    { return this.oportunidadesFiltradas.filter(o => o.estado === 'ganada').reduce((s, o) => s + Number(o.valor ?? 0), 0); }
  enProgreso() { return this.oportunidadesFiltradas.filter(o => o.estado === 'abierta').reduce((s, o) => s + Number(o.valor ?? 0), 0); }

  // Tooltip flotante de las gráficas de barras de progreso
  showTooltip(event: MouseEvent, item: {key: string; val: number}, arr: {val: number}[]) {
    const total = arr.reduce((s, i) => s + i.val, 0);
    this.tooltip = {
      visible: true, x: event.clientX, y: event.clientY,
      label: item.key, value: item.val,
      pct: total > 0 ? Math.round((item.val / total) * 100) : 0,
    };
  }

  moveTooltip(event: MouseEvent) {
    if (!this.tooltip.visible) return;
    this.tooltip.x = event.clientX; this.tooltip.y = event.clientY;
  }

  hideTooltip() { this.tooltip.visible = false; }

  private buildExportData() {
    const toRows = (arr: {key: string; val: number}[]) => arr.map(i => ({ label: i.key, value: i.val }));
    const leads = this.leadsFiltrados, oportunidades = this.oportunidadesFiltradas, clientes = this.clientesFiltrados;
    const periodo = this.rango.desde || this.rango.hasta
      ? ` (${this.rango.desde ?? '…'} a ${this.rango.hasta ?? '…'})` : '';
    return {
      title: `Reportes CRM${periodo}`,
      kpis: [
        { label: 'Total Leads', value: this.leadsCount },
        { label: 'Oportunidades', value: this.oportunidadesCount },
        { label: 'Valor Total Pipeline', value: this.totalValue },
        { label: 'Actividades Completadas', value: `${this.completedActs}/${this.actividadesCount}` },
        { label: 'Valor Promedio', value: this.avgValue },
        { label: 'Ganadas', value: this.ganadas() },
        { label: 'En Progreso', value: this.enProgreso() },
        { label: 'Total Clientes', value: this.clientesCount },
      ],
      sections: [
        { heading: 'Leads por Fuente', rows: toRows(this.leadsBySource) },
        { heading: 'Leads por Estado', rows: toRows(this.leadsByStatus) },
        { heading: 'Oportunidades por Etapa', rows: toRows(this.oppsByStage) },
        { heading: 'Oportunidades por Pipeline', rows: toRows(this.oppsByPipeline) },
        { heading: 'Clientes por Sector', rows: toRows(this.clientsBySector) },
        { heading: 'Actividades por Tipo', rows: toRows(this.activitiesByType) },
      ],
      tables: [
        {
          heading: 'Detalle de Leads',
          columns: ['Nombre', 'Fuente', 'Estado', 'Email', 'Teléfono', 'Valor Estimado'],
          rows: leads.map(l => [
            l.nombre || l.titulo, l.fuente, l.estado, l.email ?? '—', l.telefono ?? '—', Number(l.valor_estimado ?? 0),
          ]),
        },
        {
          heading: 'Detalle de Oportunidades',
          columns: ['Título', 'Cliente', 'Pipeline', 'Etapa', 'Estado', 'Valor'],
          rows: oportunidades.map(o => [
            o.titulo, o.cliente?.nombre ?? 'Sin cliente', o.pipeline?.nombre ?? 'Sin pipeline', o.etapa, o.estado ?? 'abierta', Number(o.valor ?? 0),
          ]),
        },
        {
          heading: 'Detalle de Clientes',
          columns: ['Nombre', 'Tipo', 'Sector', 'Teléfono', 'Email'],
          rows: clientes.map(c => [
            c.nombre, c.tipo, c.sector_empresarial ?? '—', c.telefono ?? '—', c.email ?? '—',
          ]),
        },
      ],
    };
  }

  exportarPdf()   { this.exportSvc.exportPdf(this.buildExportData()); }
  exportarExcel() { this.exportSvc.exportExcel(this.buildExportData()); }
}