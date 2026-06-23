import { Component } from '@angular/core';

@Component({
  selector: 'app-erp-fabricacion',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="m-0 text-lg font-bold text-slate-800">Fabricación</h2>
          <p class="text-xs text-slate-500 m-0 mt-1">Órdenes de producción, BOM y calidad</p>
        </div>
        <button class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Orden de Producción</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1">
          <p class="text-xs text-slate-500 m-0">En Proceso</p><p class="text-2xl font-bold text-amber-600 m-0">12</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2">
          <p class="text-xs text-slate-500 m-0">Completadas (Mes)</p><p class="text-2xl font-bold text-emerald-600 m-0">89</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3">
          <p class="text-xs text-slate-500 m-0">Tasa Calidad</p><p class="text-2xl font-bold text-blue-600 m-0">98.2%</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-4">
          <p class="text-xs text-slate-500 m-0">BOMs Activos</p><p class="text-2xl font-bold text-purple-600 m-0">34</p>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden scale-in delay-4">
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">OF</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Producto</th>
            <th class="text-right px-4 py-3 font-medium text-slate-500">Cantidad</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Progreso</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Estado</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let o of ordenes" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 font-mono text-xs">OF-{{ o.id }}</td>
              <td class="px-4 py-3 font-medium">{{ o.producto }}</td>
              <td class="px-4 py-3 text-right">{{ o.cantidad }}</td>
              <td class="px-4 py-3"><div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-amber-500 rounded-full" [style.width]="o.progreso+'%'"></div></div></td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="o.estado==='completada'?'badge-green':'badge-amber'">{{ o.estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ErpFabricacionComponent {
  ordenes = [
    { id: 120, producto: 'Widget Pro X', cantidad: 500, progreso: 100, estado: 'completada' },
    { id: 121, producto: 'Sensor T-200', cantidad: 1200, progreso: 72, estado: 'en proceso' },
    { id: 122, producto: 'Módulo A1', cantidad: 300, progreso: 45, estado: 'en proceso' },
    { id: 123, producto: 'Placa Base v3', cantidad: 800, progreso: 20, estado: 'en proceso' },
  ];
}
