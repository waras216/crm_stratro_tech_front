import { Component } from '@angular/core';

@Component({
  selector: 'app-erp-proyectos',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div><h2 class="m-0 text-lg font-bold text-slate-800">Gestión de Proyectos</h2><p class="text-xs text-slate-500 m-0 mt-1">Planificación, recursos y presupuestos</p></div>
        <button class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Nuevo Proyecto</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">Activos</p><p class="text-2xl font-bold text-orange-600 m-0">5</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Horas Registradas</p><p class="text-2xl font-bold text-blue-600 m-0">1,240</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3"><p class="text-xs text-slate-500 m-0">Presupuesto Total</p><p class="text-2xl font-bold text-emerald-600 m-0">\$2.1M</p></div>
      </div>
      <div class="flex flex-col gap-4">
        <div *ngFor="let p of proyectos; let i = index" class="bg-white border border-slate-200 rounded-xl p-5 hover-lift card-enter" [style.animation-delay]="(i*0.06+0.2)+'s'">
          <div class="flex items-center justify-between mb-3">
            <div><p class="text-sm font-bold text-slate-800 m-0">{{ p.nombre }}</p><p class="text-[10px] text-slate-400 m-0 mt-0.5">{{ p.cliente }} · {{ p.responsable }}</p></div>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="p.estado==='activo'?'badge-green':p.estado==='pausado'?'badge-amber':'badge-blue'">{{ p.estado }}</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex-1"><div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-orange-500 rounded-full" [style.width]="p.progreso+'%'"></div></div></div>
            <span class="text-xs font-semibold text-slate-600">{{ p.progreso }}%</span>
            <span class="text-[10px] text-slate-400">{{ p.horas }}h registradas</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ErpProyectosComponent {
  proyectos = [
    { nombre: 'Migración ERP v3', cliente: 'Interno', responsable: 'Carlos M.', estado: 'activo', progreso: 68, horas: 420 },
    { nombre: 'Implementación POS Retail', cliente: 'Retail Plus', responsable: 'Ana G.', estado: 'activo', progreso: 45, horas: 280 },
    { nombre: 'Integración API Pagos', cliente: 'TechCorp', responsable: 'Roberto D.', estado: 'activo', progreso: 82, horas: 190 },
    { nombre: 'Rediseño Portal Web', cliente: 'Innovatech', responsable: 'Laura H.', estado: 'pausado', progreso: 30, horas: 120 },
    { nombre: 'Auditoría Seguridad', cliente: 'Interno', responsable: 'Miguel T.', estado: 'activo', progreso: 15, horas: 45 },
  ];
}
