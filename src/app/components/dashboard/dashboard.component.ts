import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';
import { Lead, Actividad, Oportunidad } from '../../models/crm.models';

@Component({ selector: 'app-dashboard', standalone: false, templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.scss'] })
export class DashboardComponent implements OnInit {
  leads: Lead[] = [];
  oportunidades: Oportunidad[] = [];
  actividades: Actividad[] = [];
  clientes: any[] = [];

  kpis: any[] = [];
  recentLeads: Lead[] = [];
  recentActivities: Actividad[] = [];
  etapas = ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre', 'ganada', 'perdida'];

  etapaColors: Record<string, string> = {
    prospeccion: 'badge-slate', contacto: 'badge-blue', propuesta: 'badge-amber',
    negociacion: 'badge-purple', cierre: 'badge-teal', ganada: 'badge-emerald', perdida: 'badge-red',
  };
  estatusColors: Record<string, string> = {
    nuevo: 'badge-blue', contactado: 'badge-amber', calificado: 'badge-green',
    perdido: 'badge-red', convertido: 'badge-emerald',
  };

  constructor(private crm: CrmService) {}

  ngOnInit() {
    this.crm.leads$.subscribe(l => { this.leads = l; this.refresh(); });
    this.crm.oportunidades$.subscribe(o => { this.oportunidades = o; this.refresh(); });
    this.crm.actividades$.subscribe(a => { this.actividades = a; this.refresh(); });
    this.crm.clientes$.subscribe(c => { this.clientes = c; this.refresh(); });
  }

  refresh() {
    const pending = this.actividades.filter(a => !a.completada).length;
    const valorPipeline = this.oportunidades.reduce((s, o) => s + o.valor, 0);
    const ganadas = this.oportunidades.filter(o => o.etapa === 'ganada').length;
    const tasa = this.oportunidades.length > 0 ? Math.round((ganadas / this.oportunidades.length) * 100) : 0;

    this.kpis = [
      { title: 'Total Leads', value: this.leads.length, icon: '👥', color: 'kpi-blue', trend: '+12%', up: true },
      { title: 'Oportunidades', value: this.oportunidades.length, icon: '🎯', color: 'kpi-amber', trend: '+5%', up: true },
      { title: 'Clientes', value: this.clientes.length, icon: '✔', color: 'kpi-green', trend: '+8%', up: true },
      { title: 'Valor Pipeline', value: '$' + valorPipeline.toLocaleString(), icon: '$', color: 'kpi-purple', trend: '+15%', up: true },
      { title: 'Actividades Pendientes', value: pending, icon: '⏰', color: 'kpi-red', trend: '-3%', up: false },
      { title: 'Tasa de Cierre', value: tasa + '%', icon: '📈', color: 'kpi-teal', trend: '+2%', up: true },
    ];
    this.recentLeads = [...this.leads].sort((a, b) => b.id - a.id).slice(0, 5);
    this.recentActivities = [...this.actividades].sort((a, b) => b.id_pk - a.id_pk).slice(0, 5);
  }

  etapaCount(etapa: string) { return this.oportunidades.filter(o => o.etapa === etapa).length; }
  etapaValue(etapa: string) { return this.oportunidades.filter(o => o.etapa === etapa).reduce((s, o) => s + o.valor, 0); }
}
