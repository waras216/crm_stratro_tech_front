import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';

@Component({ selector: 'app-reportes', standalone: false, templateUrl: './reportes.component.html', styleUrls: ['./reportes.component.scss'] })
export class ReportesComponent implements OnInit {
  leads: any[] = []; oportunidades: any[] = []; clientes: any[] = []; actividades: any[] = [];

  leadsBySource: {key: string; val: number}[] = [];
  leadsByStatus: {key: string; val: number}[] = [];
  oppsByStage: {key: string; val: number}[] = [];
  oppsByPipeline: {key: string; val: number}[] = [];
  clientsBySector: {key: string; val: number}[] = [];
  activitiesByType: {key: string; val: number}[] = [];

  totalValue = 0; avgValue = 0; completedActs = 0; pendingActs = 0;

  constructor(private crm: CrmService) {}
  ngOnInit() {
    this.crm.leads$.subscribe(l => { this.leads = l; this.refresh(); });
    this.crm.oportunidades$.subscribe(o => { this.oportunidades = o; this.refresh(); });
    this.crm.clientes$.subscribe(c => { this.clientes = c; this.refresh(); });
    this.crm.actividades$.subscribe(a => { this.actividades = a; this.refresh(); });
  }

  toArr(obj: Record<string, number>) { return Object.entries(obj).map(([k, v]) => ({key: k, val: v})).sort((a, b) => b.val - a.val); }
  group(arr: any[], key: string) { const r: Record<string, number> = {}; arr.forEach(i => r[i[key]] = (r[i[key]] || 0) + 1); return r; }

  maxVal(arr: {val: number}[]) { return arr.length ? Math.max(...arr.map(i => i.val)) : 1; }

  refresh() {
    this.leadsBySource = this.toArr(this.group(this.leads, 'fuente'));
    this.leadsByStatus = this.toArr(this.group(this.leads, 'estatus'));
    this.oppsByStage = this.toArr(this.group(this.oportunidades, 'etapa'));
    this.oppsByPipeline = this.toArr(this.group(this.oportunidades, 'pipeline'));
    this.clientsBySector = this.toArr(this.group(this.clientes, 'sector_empresarial'));
    this.activitiesByType = this.toArr(this.group(this.actividades, 'tipo_actividad'));
    this.totalValue = this.oportunidades.reduce((s: number, o: any) => s + o.valor, 0);
    this.avgValue = this.oportunidades.length ? this.totalValue / this.oportunidades.length : 0;
    this.completedActs = this.actividades.filter((a: any) => a.completada).length;
    this.pendingActs = this.actividades.filter((a: any) => !a.completada).length;
  }

  barWidth(val: number, arr: {val: number}[]) { const m = this.maxVal(arr); return m > 0 ? (val / m * 100) + '%' : '0%'; }
  ganadas() { return this.oportunidades.filter((o: any) => o.etapa === 'ganada').reduce((s: number, o: any) => s + o.valor, 0); }
  enProgreso() { return this.oportunidades.filter((o: any) => o.etapa !== 'ganada' && o.etapa !== 'perdida').reduce((s: number, o: any) => s + o.valor, 0); }
}
