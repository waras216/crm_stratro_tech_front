import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpEmpleado } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-rrhh',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div><h2 class="m-0 text-lg font-bold text-slate-800">Recursos Humanos</h2><p class="text-xs text-slate-500 m-0 mt-1">Nómina, personal y reclutamiento</p></div>
        <button (click)="openNew()" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Nuevo Empleado</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">Empleados</p><p class="text-2xl font-bold text-purple-600 m-0">{{ empleados.length }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Nómina Mensual</p><p class="text-2xl font-bold text-emerald-600 m-0">\${{ nominaMensual.toLocaleString() }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3"><p class="text-xs text-slate-500 m-0">Activos</p><p class="text-2xl font-bold text-blue-600 m-0">{{ activos }}</p></div>
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
              <td class="px-4 py-3 text-slate-500">{{ e.departamento }}</td>
              <td class="px-4 py-3 text-slate-500">{{ e.puesto }}</td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="e.estado==='activo'?'badge-green':'badge-amber'">{{ e.estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div *ngIf="dialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="dialogOpen=false"></div>
    <div *ngIf="dialogOpen" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-md z-[101] shadow-2xl p-6 modal-in">
      <h3 class="m-0 mb-4 text-lg font-semibold">Nuevo Empleado</h3>
      <div class="flex flex-col gap-3">
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.nombre" placeholder="Nombre" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.departamento" placeholder="Departamento" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.puesto" placeholder="Puesto" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" [(ngModel)]="form.salario" placeholder="Salario mensual" />
        <p *ngIf="error" class="text-xs text-red-600 m-0">{{ error }}</p>
        <button (click)="submit()" [disabled]="saving" class="w-full py-2.5 bg-amber-600 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">{{ saving ? 'Guardando...' : 'Agregar' }}</button>
      </div>
    </div>
  `,
})
export class ErpRrhhComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form = { nombre: '', departamento: '', puesto: '', salario: '' };
  empleados: ErpEmpleado[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarEmpleados().subscribe();
    this.erpService.empleados$.subscribe(data => { this.empleados = data; this.cdr.detectChanges(); });
  }

  get activos() { return this.empleados.filter(e => e.estado === 'activo').length; }
  get nominaMensual() { return this.empleados.reduce((s, e) => s + Number(e.salario || 0), 0); }

  openNew() { this.form = { nombre: '', departamento: '', puesto: '', salario: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.departamento || !this.form.puesto) { this.error = 'Nombre, departamento y puesto son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addEmpleado({
      nombre: this.form.nombre,
      departamento: this.form.departamento,
      puesto: this.form.puesto,
      salario: this.form.salario ? Number(this.form.salario) : null,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el empleado. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }
}
