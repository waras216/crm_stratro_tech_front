import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ErpService } from '../../../core/services/erp-service';
import { ErpDashboardActividad, ErpDashboardModulo, ErpDashboardTendencia } from '../../../models/erp.models';

const ICONS: Record<string, string> = {
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
};

// Iconos por módulo (reemplazan los emojis del backend). Mismo estilo trazo
// que ICONS arriba — paths de Feather/Lucide para los conocidos, o un glifo
// simple propio cuando no hay un ícono estándar (Mesas, Habitaciones, Recetas).
const ICONS_MODULO: Record<string, string> = {
  Inventario: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  Compras: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  Finanzas: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  Ventas: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  RRHH: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  Fabricación: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  SCM: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  Proyectos: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  Mesas: '<rect x="3" y="6" width="18" height="3" rx="1"/><line x1="6" y1="9" x2="6" y2="20"/><line x1="18" y1="9" x2="18" y2="20"/>',
  Habitaciones: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 13h18"/><path d="M7 13V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/><path d="M3 18v3"/><path d="M21 18v3"/>',
  Recetas: '<rect x="2" y="8" width="20" height="8" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/>',
};

@Component({
  selector: 'app-erp-dashboard',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">

      <!-- Skeleton de carga -->
      <ng-container *ngIf="cargando">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div *ngFor="let _ of [1,2,3,4]" class="bg-white rounded-xl p-4 border border-slate-100 h-[68px] skeleton"></div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-slate-100 h-48 skeleton"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div *ngFor="let _ of [1,2,3,4,5,6]" class="bg-white rounded-xl p-5 border border-slate-100 h-[96px] skeleton"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="!cargando">
        <!-- KPIs -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div *ngFor="let k of kpis; let i = index" class="bg-white rounded-xl p-4 border border-slate-100 card-enter hover-lift" [style.animation-delay]="(i*0.06)+'s'">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" [ngClass]="k.bg">
                <span [innerHTML]="safe(k.icon)"></span>
              </div>
              <div class="min-w-0">
                <p class="text-xl font-bold m-0 leading-tight" [ngClass]="k.color">{{ k.value }}</p>
                <p class="text-[11px] text-slate-500 m-0">{{ k.label }}</p>
                <span *ngIf="k.delta !== null && k.delta !== undefined" class="inline-flex items-center gap-0.5 text-[10px] font-semibold mt-0.5" [ngClass]="k.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" [style.transform]="k.delta < 0 ? 'rotate(180deg)' : null">
                    <path d="M12 4l8 8h-6v8h-4v-8H4z"/>
                  </svg>
                  {{ k.delta >= 0 ? '+' : '' }}{{ k.delta }}% vs. mes anterior
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ingresos vs Egresos (últimos 6 meses) -->
        <div class="bg-white rounded-xl p-5 border border-slate-100 scale-in delay-5">
          <div class="flex items-start justify-between gap-3 mb-1 flex-wrap">
            <div>
              <h3 class="text-sm font-bold text-slate-800 m-0">Ingresos vs Egresos</h3>
              <p class="text-[11px] text-slate-400 m-0 mt-0.5">Últimos 6 meses · Balance del mes:
                <span class="font-semibold" [ngClass]="balanceMes >= 0 ? 'text-emerald-600' : 'text-rose-500'">{{ balanceMes >= 0 ? '+' : '-' }}\${{ money(absBalanceMes) }}</span>
              </p>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-slate-500 flex-shrink-0">
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Ingresos</span>
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-400"></span>Egresos</span>
            </div>
          </div>

          <div *ngIf="maxTendencia > 0; else sinTendencia" class="flex items-end justify-between gap-1 sm:gap-3 h-40 mt-5">
            <div *ngFor="let t of tendencia" class="flex-1 flex flex-col items-center gap-2 h-full">
              <div class="flex items-end justify-center gap-1 h-full w-full">
                <div *ngIf="t.ingresos > 0" class="group relative w-3 sm:w-4 bg-emerald-500 rounded-t-[3px] transition-[height] duration-500" [style.height.%]="pct(t.ingresos)">
                  <div class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Ingresos: \${{ money(t.ingresos) }}
                  </div>
                </div>
                <div *ngIf="t.egresos > 0" class="group relative w-3 sm:w-4 bg-rose-400 rounded-t-[3px] transition-[height] duration-500" [style.height.%]="pct(t.egresos)">
                  <div class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Egresos: \${{ money(t.egresos) }}
                  </div>
                </div>
              </div>
              <span class="text-[10px] text-slate-400">{{ t.mes }}</span>
            </div>
          </div>
          <ng-template #sinTendencia>
            <p class="text-xs text-slate-400 m-0 text-center py-10">Sin movimientos contables registrados todavía.</p>
          </ng-template>
        </div>

        <!-- Módulos resumen -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div *ngFor="let m of modulos; let i = index" class="relative overflow-hidden bg-white rounded-xl p-5 border border-slate-100 hover-lift card-enter" [style.animation-delay]="(i*0.05+0.2)+'s'">
            <span class="absolute inset-y-0 left-0 w-1" [ngClass]="m.bg.replace('100','400')"></span>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center" [ngClass]="[m.bg, m.bg.replace('bg-','text-').replace('100','600')]" [innerHTML]="safe(m.icono)"></div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-800 m-0 truncate">{{ m.titulo }}</p>
                <p class="text-[10px] text-slate-400 m-0 mt-0.5 truncate">{{ m.subtitulo }}</p>
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
          <div class="flex flex-col gap-1">
            <div *ngFor="let a of actividad" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div class="w-2 h-2 rounded-full flex-shrink-0" [ngClass]="a.dot"></div>
              <p class="text-xs text-slate-600 m-0 flex-1 truncate">{{ a.texto }}</p>
              <span class="text-[10px] text-slate-400 flex-shrink-0">{{ a.tiempo }}</span>
            </div>
            <p *ngIf="!actividad.length" class="text-xs text-slate-400 m-0 text-center py-4">Sin actividad reciente todavía.</p>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class ErpDashboardComponent implements OnInit {
  cargando = true;
  kpis: any[] = [];
  modulos: ErpDashboardModulo[] = [];
  actividad: ErpDashboardActividad[] = [];
  tendencia: ErpDashboardTendencia[] = [];
  maxTendencia = 0;
  balanceMes = 0;
  absBalanceMes = 0;

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {}

  // Angular sanitiza (y descarta) cualquier <svg> pasado a [innerHTML] sin esto.
  safe(html?: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(html ?? ''); }

  ngOnInit() {
    this.erpService.cargarDashboardResumen().subscribe(res => {
      this.kpis = res.kpis.map(k => ({
        ...k,
        icon: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${ICONS[k.icon] ?? ''}</svg>`
      }));
      this.modulos = res.modulos.map(m => ({
        ...m,
        icono: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${ICONS_MODULO[m.titulo] ?? ''}</svg>`,
      }));
      this.actividad = res.actividad;
      this.tendencia = res.tendencia ?? [];
      this.maxTendencia = Math.max(0, ...this.tendencia.flatMap(t => [t.ingresos, t.egresos]));

      const mesActual = this.tendencia[this.tendencia.length - 1];
      this.balanceMes = mesActual ? mesActual.ingresos - mesActual.egresos : 0;
      this.absBalanceMes = Math.abs(this.balanceMes);

      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  pct(valor: number): number {
    if (this.maxTendencia <= 0) return 0;
    const pct = (valor / this.maxTendencia) * 100;
    return valor > 0 ? Math.max(pct, 2) : 0;
  }

  money(valor: number): string {
    return Math.round(valor).toLocaleString();
  }
}
