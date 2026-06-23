import { Component } from '@angular/core';

@Component({
  selector: 'app-erp-ventas',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="m-0 text-lg font-bold text-slate-800">Ventas</h2>
          <p class="text-xs text-slate-500 m-0 mt-1">Pedidos, presupuestos y facturación</p>
        </div>
        <button class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Nuevo Pedido</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1">
          <p class="text-xs text-slate-500 m-0">Pedidos Hoy</p>
          <p class="text-2xl font-bold text-amber-600 m-0">24</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2">
          <p class="text-xs text-slate-500 m-0">Facturado (Mes)</p>
          <p class="text-2xl font-bold text-emerald-600 m-0">$580K</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3">
          <p class="text-xs text-slate-500 m-0">Por Cobrar</p>
          <p class="text-2xl font-bold text-red-600 m-0">$124K</p>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden scale-in delay-3">
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">Pedido</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Cliente</th>
            <th class="text-right px-4 py-3 font-medium text-slate-500">Total</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Estado</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of pedidos" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 font-mono text-xs">#{{ p.id }}</td>
              <td class="px-4 py-3 font-medium">{{ p.cliente }}</td>
              <td class="px-4 py-3 text-right font-medium">\${{ p.total.toLocaleString() }}</td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="p.estado==='enviado'?'badge-green':p.estado==='pendiente'?'badge-amber':'badge-blue'">{{ p.estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ErpVentasComponent {
  pedidos = [
    { id: 3021, cliente: 'TechCorp SA', total: 45000, estado: 'enviado' },
    { id: 3020, cliente: 'Retail Plus', total: 12800, estado: 'pendiente' },
    { id: 3019, cliente: 'Innovatech', total: 78500, estado: 'facturado' },
    { id: 3018, cliente: 'Global Foods', total: 23400, estado: 'enviado' },
    { id: 3017, cliente: 'Servicios MX', total: 9200, estado: 'pendiente' },
  ];
}
