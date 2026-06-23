import { Component } from '@angular/core';

@Component({
  selector: 'app-erp-rrhh',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div><h2 class="m-0 text-lg font-bold text-slate-800">Recursos Humanos</h2><p class="text-xs text-slate-500 m-0 mt-1">Nómina, personal y reclutamiento</p></div>
        <button class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Nuevo Empleado</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">Empleados</p><p class="text-2xl font-bold text-purple-600 m-0">56</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Nómina Mensual</p><p class="text-2xl font-bold text-emerald-600 m-0">\$480K</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3"><p class="text-xs text-slate-500 m-0">Vacantes</p><p class="text-2xl font-bold text-amber-600 m-0">4</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-4"><p class="text-xs text-slate-500 m-0">Asistencia Hoy</p><p class="text-2xl font-bold text-blue-600 m-0">98%</p></div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden scale-in delay-4">
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">Nombre</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Departamento</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Puesto</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Estado</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let e of empleados" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">{{ e.nombre }}</td>
              <td class="px-4 py-3 text-slate-500">{{ e.depto }}</td>
              <td class="px-4 py-3 text-slate-500">{{ e.puesto }}</td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium badge-green">Activo</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ErpRrhhComponent {
  empleados = [
    { nombre: 'Carlos Mendoza', depto: 'Ingeniería', puesto: 'Dev Senior' },
    { nombre: 'Ana García', depto: 'Ventas', puesto: 'Account Manager' },
    { nombre: 'Roberto Díaz', depto: 'Operaciones', puesto: 'Coord. Logística' },
    { nombre: 'Laura Herrera', depto: 'RRHH', puesto: 'Reclutadora' },
    { nombre: 'Miguel Torres', depto: 'Finanzas', puesto: 'Contador' },
  ];
}
