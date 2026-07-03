import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { NichoService } from '../../../core/services/nicho.service';
import { AuthService } from '../../../core/auth/authservices';
import { Lead, Actividad, Oportunidad, Cliente } from '../../../models/crm.models';

const I = (p: string) =>
  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${p}</svg>`;

@Component({ selector: 'app-dashboard', standalone: false, templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.scss'] })
export class DashboardComponent implements OnInit {
  leads: Lead[] = []; oportunidades: Oportunidad[] = []; actividades: Actividad[] = []; clientes: Cliente[] = [];
  kpis: any[] = []; recentLeads: Lead[] = []; recentActivities: Actividad[] = [];

  saludo = ''; nombre = ''; empresa = ''; fechaHoy = ''; saludoIcon = '';

  etapas = ['prospeccion','contacto','propuesta','negociacion','cierre'];

  private etapaOpacity = [0.25, 0.42, 0.60, 0.78, 1];

  etapaBarStyle(etapa: string): string {
    const idx = this.etapas.indexOf(etapa);
    const op = this.etapaOpacity[idx] ?? 1;
    const c = this.nicho.config.color;
    return `background:${c}${Math.round(op * 255).toString(16).padStart(2,'0')}`;
  }

  etapaCardStyle(etapa: string): string {
    const idx = this.etapas.indexOf(etapa);
    const op = this.etapaOpacity[idx] ?? 1;
    const c = this.nicho.config.color;
    return `background:${c}12;border:1px solid ${c}${Math.round(op * 80).toString(16).padStart(2,'0')}`;
  }

  etapaValueStyle(etapa: string): string {
    return `color:${this.nicho.config.color}`;
  }
  estatusColors: Record<string,string> = {
    nuevo:'badge-blue', contactado:'badge-amber', calificado:'badge-green', perdido:'badge-red', convertido:'badge-emerald'
  };

  constructor(private crm: CrmService, public nicho: NichoService, private auth: AuthService) {}

  ngOnInit() {
    const s = this.auth.session;
    this.nombre  = s?.nombre  || 'Usuario';
    this.empresa = s?.empresa || '';
    const h = new Date().getHours();
    if (h < 12)      { this.saludo = 'Buenos días';   this.saludoIcon = '☀️'; }
    else if (h < 19) { this.saludo = 'Buenas tardes'; this.saludoIcon = '🌤️'; }
    else             { this.saludo = 'Buenas noches';  this.saludoIcon = '🌙'; }
    this.fechaHoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

    this.crm.cargarLeads().subscribe(r => { this.leads = r.data; this.refresh(); });
    this.crm.cargarOportunidades().subscribe(r => { this.oportunidades = r.data; this.refresh(); });
    this.crm.cargarActividades().subscribe(r => { this.actividades = r.data; this.refresh(); });
    this.crm.cargarClientes().subscribe(r => { this.clientes = r.data; this.refresh(); });
  }

  refresh() {
    const cfg = this.nicho.config;
    const pending = this.actividades.filter(a => a.estado !== 'completada').length;
    const pipeline = this.oportunidades.reduce((s,o) => s+(o.valor??0), 0);
    const ganadas  = this.oportunidades.filter(o => o.etapa==='cierre').length;
    const tasa     = this.oportunidades.length ? Math.round(ganadas/this.oportunidades.length*100) : 0;

    this.kpis = [
      { title: cfg.kpiLeads,         value: this.leads.length,             svg: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'), color:'kpi-blue'   },
      { title: cfg.kpiOportunidades, value: this.oportunidades.length,     svg: I('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),                                                                        color:'kpi-amber'  },
      { title: cfg.kpiClientes,      value: this.clientes.length,          svg: I('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),                                                                                  color:'kpi-green'  },
      { title: cfg.kpiPipeline,      value: '$'+pipeline.toLocaleString(), svg: I('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/>'),                                                                color:'kpi-purple' },
      { title: cfg.kpiPendientes,    value: pending,                       svg: I('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),    color:'kpi-red'    },
      { title: cfg.kpiTasa,          value: tasa+'%',                      svg: I('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),                                                                                  color:'kpi-teal'   },
    ];
    this.recentLeads      = [...this.leads].sort((a,b)=>b.id_lead-a.id_lead).slice(0,5);
    this.recentActivities = [...this.actividades].sort((a,b)=>b.id_actividad-a.id_actividad).slice(0,5);
  }

  etapaCount(e: string) { return this.oportunidades.filter(o=>o.etapa===e).length; }
  etapaValue(e: string) { return this.oportunidades.filter(o=>o.etapa===e).reduce((s,o)=>s+(o.valor??0),0); }
}
