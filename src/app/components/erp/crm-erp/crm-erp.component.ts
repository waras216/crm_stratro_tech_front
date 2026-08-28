import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpInteraccion } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-crm',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <h2 class="m-0 text-lg font-bold text-slate-800">CRM - Relaciones con Clientes</h2>
      <div *ngIf="cargando" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div *ngFor="let _ of [1,2,3]" class="h-[68px] rounded-xl skeleton"></div>
      </div>
      <div *ngIf="!cargando" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1 hover-lift"><p class="text-xs text-slate-500 m-0">Contactos</p><p class="text-2xl font-bold text-indigo-600 m-0">{{ resumen.contactos }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2 hover-lift"><p class="text-xs text-slate-500 m-0">Oportunidades</p><p class="text-2xl font-bold text-amber-600 m-0">{{ resumen.oportunidades }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3 hover-lift"><p class="text-xs text-slate-500 m-0">Tickets Abiertos</p><p class="text-2xl font-bold text-red-500 m-0">{{ resumen.ticketsAbiertos }}</p></div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 scale-in delay-3">
        <h3 class="text-sm font-bold text-slate-700 m-0 mb-4">Interacciones Recientes</h3>
        <div class="flex flex-col gap-3">
          <div *ngFor="let i of interacciones" class="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{{ i.cliente.charAt(0) }}</div>
            <div class="flex-1"><p class="text-sm font-medium text-slate-700 m-0">{{ i.cliente }}</p><p class="text-[10px] text-slate-400 m-0">{{ i.tipo }} - {{ i.asunto }}</p></div>
            <span class="text-[10px] text-slate-400">{{ i.fecha }}</span>
          </div>
          <app-empty-state *ngIf="!cargando && !interacciones.length" titulo="Sin interacciones todavía" subtitulo="Las interacciones con clientes del CRM van a aparecer aquí." color="indigo">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </app-empty-state>
        </div>
      </div>
    </div>
  `,
})
export class ErpCrmComponent implements OnInit {
  interacciones: ErpInteraccion[] = [];
  resumen = { contactos: 0, oportunidades: 0, ticketsAbiertos: 0 };
  cargando = true;

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarCrmResumen().subscribe(r => { this.resumen = r; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarCrmInteracciones().subscribe(data => { this.interacciones = data; this.cdr.detectChanges(); });
  }
}
