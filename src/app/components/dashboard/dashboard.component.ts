import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../core/services/crm-service';
import { Lead, Actividad, Oportunidad, Cliente } from '../../models/crm.models';

const I = (p: string) =>
  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${p}</svg>`;

@Component({ selector: 'app-dashboard', standalone: false, templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.scss'] })
export class DashboardComponent implements OnInit {
  leads: Lead[] = []; oportunidades: Oportunidad[] = []; actividades: Actividad[] = []; clientes: Cliente[] = [];
  kpis: any[] = []; recentLeads: Lead[] = []; recentActivities: Actividad[] = [];

  etapas = ['prospeccion','contacto','propuesta','negociacion','cierre'];
  etapaColors: Record<string,string> = {
    prospeccion:'col-slate', contacto:'col-blue', propuesta:'col-amber', negociacion:'col-purple', cierre:'col-teal'
  };
  etapaBarColor: Record<string,string> = {
    prospeccion:'bg-slate-400', contacto:'bg-blue-500', propuesta:'bg-amber-400', negociacion:'bg-purple-500', cierre:'bg-teal-500'
  };
  estatusColors: Record<string,string> = {
    nuevo:'badge-blue', contactado:'badge-amber', calificado:'badge-green', perdido:'badge-red', convertido:'badge-emerald'
  };

  constructor(private crm: CrmService) {}
  ngOnInit() {
    this.crm.cargarLeads().subscribe(r => { this.leads = r.data; this.refresh(); });
    this.crm.cargarOportunidades().subscribe(r => { this.oportunidades = r.data; this.refresh(); });
    this.crm.cargarActividades().subscribe(r => { this.actividades = r.data; this.refresh(); });
    this.crm.cargarClientes().subscribe(r => { this.clientes = r.data; this.refresh(); });
  }

  refresh() {
    const pending = this.actividades.filter(a => !a.completada).length;
    const pipeline = this.oportunidades.reduce((s,o) => s+(o.valor??0), 0);
    const ganadas  = this.oportunidades.filter(o => o.etapa==='cierre').length;
    const tasa     = this.oportunidades.length ? Math.round(ganadas/this.oportunidades.length*100) : 0;

    this.kpis = [
      { title:'Total Leads',            value:this.leads.length,            svg:I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'), color:'kpi-blue',   trend:'+12%', up:true  },
      { title:'Oportunidades',          value:this.oportunidades.length,    svg:I('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),                                                                        color:'kpi-amber',  trend:'+5%',  up:true  },
      { title:'Clientes',               value:this.clientes.length,         svg:I('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),                                                                                  color:'kpi-green',  trend:'+8%',  up:true  },
      { title:'Valor Pipeline',         value:'$'+pipeline.toLocaleString(),svg:I('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>'),                                                                color:'kpi-purple', trend:'+15%', up:true  },
      { title:'Actividades Pendientes', value:pending,                      svg:I('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),    color:'kpi-red',    trend:'-3%',  up:false },
      { title:'Tasa de Cierre',         value:tasa+'%',                     svg:I('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),                                                                                  color:'kpi-teal',   trend:'+2%',  up:true  },
    ];
    this.recentLeads      = [...this.leads].sort((a,b)=>b.id_lead-a.id_lead).slice(0,5);
    this.recentActivities = [...this.actividades].sort((a,b)=>b.id_pk-a.id_pk).slice(0,5);
  }

  etapaCount(e: string) { return this.oportunidades.filter(o=>o.etapa===e).length; }
  etapaValue(e: string) { return this.oportunidades.filter(o=>o.etapa===e).reduce((s,o)=>s+(o.valor??0),0); }
}
