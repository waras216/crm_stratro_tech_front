import { Component } from '@angular/core';

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
export class ErpDashboardComponent {
  kpis = [
    { value: '$2.4M', label: 'Ingresos del Mes', bg: 'bg-emerald-100', color: 'text-emerald-600', icon: '<svg width="18" height="18" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { value: '847', label: 'Órdenes Activas', bg: 'bg-amber-100', color: 'text-amber-600', icon: '<svg width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' },
    { value: '12,450', label: 'Productos en Stock', bg: 'bg-blue-100', color: 'text-blue-600', icon: '<svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
    { value: '56', label: 'Empleados Activos', bg: 'bg-purple-100', color: 'text-purple-600', icon: '<svg width="18" height="18" fill="none" stroke="#7c3aed" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
  ];

  modulos = [
    { titulo: 'Gestión Financiera', subtitulo: 'Contabilidad y tesorería', emoji: '💰', bg: 'bg-emerald-100', stat: '+12% este mes', statColor: 'text-emerald-600', extra: '3 facturas pendientes' },
    { titulo: 'Compras', subtitulo: 'Órdenes y proveedores', emoji: '🛒', bg: 'bg-amber-100', stat: '15 órdenes pendientes', statColor: 'text-amber-600', extra: '8 proveedores activos' },
    { titulo: 'Ventas', subtitulo: 'Pedidos y facturación', emoji: '📈', bg: 'bg-blue-100', stat: '$580K facturado', statColor: 'text-blue-600', extra: '24 pedidos hoy' },
    { titulo: 'Inventario', subtitulo: 'Stock y almacenes', emoji: '📦', bg: 'bg-indigo-100', stat: '7 alertas stock bajo', statColor: 'text-red-500', extra: '3 almacenes' },
    { titulo: 'Fabricación', subtitulo: 'Producción y BOM', emoji: '🏭', bg: 'bg-slate-100', stat: '12 órdenes en proceso', statColor: 'text-slate-600', extra: '98% calidad' },
    { titulo: 'Cadena de Suministro', subtitulo: 'Logística y entregas', emoji: '🚚', bg: 'bg-teal-100', stat: '45 envíos en tránsito', statColor: 'text-teal-600', extra: '96% a tiempo' },
    { titulo: 'Recursos Humanos', subtitulo: 'Nómina y personal', emoji: '👥', bg: 'bg-purple-100', stat: '56 empleados', statColor: 'text-purple-600', extra: 'Nómina al día' },
    { titulo: 'CRM', subtitulo: 'Clientes y prospectos', emoji: '🤝', bg: 'bg-pink-100', stat: '320 contactos', statColor: 'text-pink-600', extra: '18 oportunidades' },
    { titulo: 'Proyectos', subtitulo: 'Planificación y recursos', emoji: '📋', bg: 'bg-orange-100', stat: '5 proyectos activos', statColor: 'text-orange-600', extra: '2 por entregar' },
  ];

  actividad = [
    { texto: 'Orden de compra #1045 aprobada', dot: 'bg-emerald-400', tiempo: 'Hace 5 min' },
    { texto: 'Nuevo empleado registrado: Carlos M.', dot: 'bg-blue-400', tiempo: 'Hace 20 min' },
    { texto: 'Stock bajo en producto SKU-4421', dot: 'bg-red-400', tiempo: 'Hace 1h' },
    { texto: 'Factura #2890 enviada a cliente', dot: 'bg-amber-400', tiempo: 'Hace 2h' },
    { texto: 'Orden de fabricación OF-120 completada', dot: 'bg-purple-400', tiempo: 'Hace 3h' },
  ];
}
