import { Component, OnInit } from '@angular/core';
import { NichoService } from '../../../core/services/nicho.service';

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
        </div>
      </div>
    </div>
  `,
})
export class ErpDashboardComponent implements OnInit {
  kpis: any[] = [];
  modulos: any[] = [];
  actividad: any[] = [];

  constructor(private nichoSvc: NichoService) {}

  ngOnInit() {
    const cfg = this.nichoSvc.config;
    this.kpis = cfg.erpKpis.map(k => ({
      ...k,
      icon: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${k.svg}</svg>`
    }));
    this.modulos = cfg.erpModulos;
    this.actividad = cfg.erpActividad;
  }
}
