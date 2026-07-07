import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpEnvio } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-scm',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <h2 class="m-0 text-lg font-bold text-slate-800">Cadena de Suministro</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">En Tránsito</p><p class="text-2xl font-bold text-teal-600 m-0">{{ enTransito.length }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Entregados</p><p class="text-2xl font-bold text-emerald-600 m-0">{{ entregados }}</p></div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 scale-in delay-3">
        <h3 class="text-sm font-bold text-slate-700 m-0 mb-4">Envíos en Tránsito</h3>
        <div class="flex flex-col gap-3">
          <div *ngFor="let e of enTransito" class="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100 text-teal-600 text-xs font-bold">E{{ e.id }}</div>
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-slate-700 m-0">{{ e.destino }}</p><p class="text-[10px] text-slate-400 m-0">{{ e.transportista }}</p></div>
            <div class="text-right"><p class="text-xs font-semibold text-slate-700 m-0">{{ e.eta }}</p><p class="text-[10px] text-slate-400 m-0">ETA</p></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ErpScmComponent implements OnInit {
  envios: ErpEnvio[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarEnvios().subscribe();
    this.erpService.envios$.subscribe(data => { this.envios = data; this.cdr.detectChanges(); });
  }

  get enTransito() { return this.envios.filter(e => e.estado === 'en_transito'); }
  get entregados() { return this.envios.filter(e => e.estado === 'entregado').length; }
}
