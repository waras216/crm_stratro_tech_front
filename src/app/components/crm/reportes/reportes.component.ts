import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { Lead, Oportunidad, Cliente, Actividad } from '../../../models/crm.models';

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

  refresh() {
    this.leadsBySource    = this.toArr(this.group(this.leads, 'fuente'));
    this.leadsByStatus    = this.toArr(this.group(this.leads, 'estado'));
    this.oppsByStage      = this.toArr(this.group(this.oportunidades, 'etapa'));
    this.oppsByPipeline   = this.toArr(this.group(this.oportunidades.map(o => ({ pipeline: o.pipeline?.nombre ?? 'Sin pipeline' })), 'pipeline'));
    this.clientsBySector  = this.toArr(this.group(this.clientes.map(c => ({ sector_empresarial: c.sector_empresarial ?? 'Sin sector' })), 'sector_empresarial'));
    this.activitiesByType = this.toArr(this.group(this.actividades, 'tipo'));
    this.totalValue    = this.oportunidades.reduce((s, o) => s + Number(o.valor ?? 0), 0);
    this.avgValue      = this.oportunidades.length ? this.totalValue / this.oportunidades.length : 0;
    this.completedActs = this.actividades.filter(a => a.estado === 'completada').length;
    this.pendingActs   = this.actividades.filter(a => a.estado !== 'completada').length;
    this.cdr.detectChanges();
  }

  barWidth(val: number, arr: {val: number}[]) { const m = this.maxVal(arr); return m > 0 ? (val / m * 100) + '%' : '0%'; }
  ganadas()    { return this.oportunidades.filter(o => o.estado === 'ganada').reduce((s, o) => s + Number(o.valor ?? 0), 0); }
  enProgreso() { return this.oportunidades.filter(o => o.estado === 'abierta').reduce((s, o) => s + Number(o.valor ?? 0), 0); }

  private buildExportData() {
    const toRows = (arr: {key: string; val: number}[]) => arr.map(i => ({ label: i.key, value: i.val }));
    return {
      title: 'Reportes CRM',
      kpis: [
        { label: 'Total Leads', value: this.leads.length },
        { label: 'Oportunidades', value: this.oportunidades.length },
        { label: 'Valor Total Pipeline', value: this.totalValue },
        { label: 'Actividades Completadas', value: `${this.completedActs}/${this.actividades.length}` },
        { label: 'Valor Promedio', value: this.avgValue },
        { label: 'Ganadas', value: this.ganadas() },
        { label: 'En Progreso', value: this.enProgreso() },
        { label: 'Total Clientes', value: this.clientes.length },
      ],
      sections: [
        { heading: 'Leads por Fuente', rows: toRows(this.leadsBySource) },
        { heading: 'Leads por Estado', rows: toRows(this.leadsByStatus) },
        { heading: 'Oportunidades por Etapa', rows: toRows(this.oppsByStage) },
        { heading: 'Oportunidades por Pipeline', rows: toRows(this.oppsByPipeline) },
        { heading: 'Clientes por Sector', rows: toRows(this.clientsBySector) },
        { heading: 'Actividades por Tipo', rows: toRows(this.activitiesByType) },
      ],
    };
  }

  exportarPdf()   { this.exportSvc.exportPdf(this.buildExportData()); }
  exportarExcel() { this.exportSvc.exportExcel(this.buildExportData()); }
}