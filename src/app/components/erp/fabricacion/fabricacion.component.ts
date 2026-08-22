import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpOrdenProduccion } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-fabricacion',
  standalone: false,
  animations: [modalLeave],
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="m-0 text-lg font-bold text-slate-800">Fabricación</h2>
          <p class="text-xs text-slate-500 m-0 mt-1">Órdenes de producción, BOM y calidad</p>
        </div>
        <button *appPuede="'erp_fabricacion.crear'" (click)="openNew()" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700 transition-all hover:scale-105 active:scale-95" style="box-shadow:0 4px 12px rgba(217,119,6,.35)">+ Orden de Producción</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1" style="box-shadow:var(--shadow-card)">
          <p class="text-xs text-slate-500 m-0">En Proceso</p><p class="text-2xl font-bold text-amber-600 m-0">{{ enProceso }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2" style="box-shadow:var(--shadow-card)">
          <p class="text-xs text-slate-500 m-0">Completadas</p><p class="text-2xl font-bold text-emerald-600 m-0">{{ completadas }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3" style="box-shadow:var(--shadow-card)">
          <p class="text-xs text-slate-500 m-0">Total Órdenes</p><p class="text-2xl font-bold text-blue-600 m-0">{{ ordenes.length }}</p>
        </div>
      </div>
      <div *ngIf="cargando" class="flex flex-col gap-2">
        <div *ngFor="let _ of [1,2,3]" class="h-12 rounded-lg skeleton"></div>
      </div>

      <div *ngIf="!cargando" class="bg-white border border-slate-200 rounded-xl overflow-hidden scale-in delay-4">
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">OF</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Producto</th>
            <th class="text-right px-4 py-3 font-medium text-slate-500">Cantidad</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Progreso</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Estado</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let o of ordenes" class="border-b border-slate-100 hover:bg-slate-50 fade-up">
              <td class="px-4 py-3 font-mono text-xs">OF-{{ o.id }}</td>
              <td class="px-4 py-3 font-medium">{{ o.producto }}</td>
              <td class="px-4 py-3 text-right">{{ o.cantidad }}</td>
              <td class="px-4 py-3"><div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-amber-500 rounded-full" [style.width]="o.progreso+'%'"></div></div></td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="o.estado==='completada'?'badge-green':'badge-amber'">{{ o.estado }}</span></td>
            </tr>
            <tr *ngIf="ordenes.length === 0">
              <td colspan="5" class="text-center py-10 text-slate-400 text-xs">Sin órdenes de producción todavía.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div *ngIf="dialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="dialogOpen=false"></div>
    <div *ngIf="dialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-md z-[101] shadow-2xl p-6 modal-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="m-0 text-lg font-semibold">Nueva Orden de Producción</h3>
        <button (click)="dialogOpen=false" class="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 p-1 -m-1">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="flex flex-col gap-3">
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.producto" placeholder="Producto" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" [(ngModel)]="form.cantidad" placeholder="Cantidad" />
        <p *ngIf="error" class="text-xs text-red-600 m-0">{{ error }}</p>
        <button (click)="submit()" [disabled]="saving" class="w-full py-2.5 bg-amber-600 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">{{ saving ? 'Guardando...' : 'Crear Orden' }}</button>
      </div>
    </div>
  `,
})
export class ErpFabricacionComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form = { producto: '', cantidad: '' };
  ordenes: ErpOrdenProduccion[] = [];
  cargando = true;

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef, private notify: NotifyService) {}

  ngOnInit() {
    this.erpService.cargarOrdenesProduccion().subscribe();
    this.erpService.ordenesProduccion$.subscribe(data => { this.ordenes = data; this.cargando = false; this.cdr.detectChanges(); });
  }

  get enProceso() { return this.ordenes.filter(o => o.estado === 'en proceso').length; }
  get completadas() { return this.ordenes.filter(o => o.estado === 'completada').length; }

  openNew() { this.form = { producto: '', cantidad: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.producto) { this.error = 'El producto es obligatorio.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addOrdenProduccion({
      producto: this.form.producto,
      cantidad: Number(this.form.cantidad) || 0,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.dialogOpen = false;
        this.notify.success('Orden de producción creada');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.error = 'No se pudo guardar la orden. Intenta de nuevo.';
        this.notify.error(this.error);
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }
}
