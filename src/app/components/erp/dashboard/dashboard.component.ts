import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpDashboardActividad, ErpDashboardModulo } from '../../../models/erp.models';

const ICONS: Record<string, string> = {
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
};

@Component({
  selector: 'app-erp-dashboard',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let k of kpis; let i = index" class="bg-white rounded-xl p-4 border border-slate-100 card-enter" [style.animation-delay]="(i*0.06)+'s'">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" [ngClass]="k.bg">
              <span [innerHTML]="k.icon"></span>
            </div>
            <div>
              <p class="text-xl font-bold m-0" [ngClass]="k.color">{{ k.value }}</p>
              <p class="text-[11px] text-slate-500 m-0">{{ k.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Módulos resumen -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngFor="let m of modulos; let i = index" class="bg-white rounded-xl p-5 border border-slate-100 hover-lift card-enter" [style.animation-delay]="(i*0.05+0.2)+'s'">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-sm" [ngClass]="m.bg">{{ m.emoji }}</div>
            <div>
              <p class="text-sm font-bold text-slate-800 m-0">{{ m.titulo }}</p>
              <p class="text-[10px] text-slate-400 m-0 mt-0.5">{{ m.subtitulo }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-slate-50">
            <span class="text-xs font-semibold" [ngClass]="m.statColor">{{ m.stat }}</span>
            <span class="text-[10px] text-slate-400">{{ m.extra }}</span>
          </div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div class="bg-white rounded-xl p-5 border border-slate-100 scale-in delay-6">
        <h3 class="text-sm font-bold text-slate-800 m-0 mb-4">Actividad Reciente</h3>
        <div class="flex flex-col gap-2">
          <div *ngFor="let a of actividad" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <div class="w-2 h-2 rounded-full flex-shrink-0" [ngClass]="a.dot"></div>
            <p class="text-xs text-slate-600 m-0 flex-1">{{ a.texto }}</p>
            <span class="text-[10px] text-slate-400">{{ a.tiempo }}</span>
          </div>
          <p *ngIf="!actividad.length" class="text-xs text-slate-400 m-0 text-center py-4">Sin actividad reciente todavía.</p>
        </div>
      </div>
    </div>
  `,
})
export class ErpDashboardComponent implements OnInit {
  kpis: any[] = [];
  modulos: ErpDashboardModulo[] = [];
  actividad: ErpDashboardActividad[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarDashboardResumen().subscribe(res => {
      this.kpis = res.kpis.map(k => ({
        ...k,
        icon: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${ICONS[k.icon] ?? ''}</svg>`
      }));
      this.modulos = res.modulos;
      this.actividad = res.actividad;
      this.cdr.detectChanges();
    });
  }
}
