import { Component } from '@angular/core';

@Component({
  selector: 'app-erp-scm',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <h2 class="m-0 text-lg font-bold text-slate-800">Cadena de Suministro</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">En Tránsito</p><p class="text-2xl font-bold text-teal-600 m-0">45</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Entregados (Mes)</p><p class="text-2xl font-bold text-emerald-600 m-0">312</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3"><p class="text-xs text-slate-500 m-0">Tasa Puntualidad</p><p class="text-2xl font-bold text-blue-600 m-0">96%</p></div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-5 scale-in delay-3">
        <h3 class="text-sm font-bold text-slate-700 m-0 mb-4">Envíos en Tránsito</h3>
        <div class="flex flex-col gap-3">
          <div *ngFor="let e of envios" class="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100 text-teal-600 text-xs font-bold">{{ e.id }}</div>
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-slate-700 m-0">{{ e.destino }}</p><p class="text-[10px] text-slate-400 m-0">{{ e.transportista }}</p></div>
            <div class="text-right"><p class="text-xs font-semibold text-slate-700 m-0">{{ e.eta }}</p><p class="text-[10px] text-slate-400 m-0">ETA</p></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ErpScmComponent {
  envios = [
    { id: 'E1', destino: 'Almacén Central CDMX', transportista: 'DHL Express', eta: 'Mañana 10:00' },
    { id: 'E2', destino: 'Sucursal Monterrey', transportista: 'Fedex', eta: 'Jue 14:30' },
    { id: 'E3', destino: 'Cliente - TechCorp', transportista: 'Estafeta', eta: 'Vie 09:00' },
    { id: 'E4', destino: 'Planta Guadalajara', transportista: 'UPS', eta: 'Lun 16:00' },
  ];
}
