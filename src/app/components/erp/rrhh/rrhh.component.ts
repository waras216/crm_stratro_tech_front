import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ContabilidadService } from '../../../core/services/contabilidad-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpEmpleado } from '../../../models/erp.models';
import { ErpNominaPago } from '../../../models/contabilidad.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-rrhh',
  standalone: false,
  animations: [modalLeave],
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div><h2 class="m-0 text-lg font-bold text-slate-800">Recursos Humanos</h2><p class="text-xs text-slate-500 m-0 mt-1">Nómina, personal y reclutamiento</p></div>
        <div class="flex gap-2">
          <button *appPuede="'erp_rrhh.eliminar'" (click)="abrirPapelera()" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50">Papelera</button>
          <button *appPuede="'erp_rrhh.crear'" (click)="openNomina()" class="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-amber-50">Procesar Nómina</button>
          <button *appPuede="'erp_rrhh.crear'" (click)="openNew()" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700 transition-all hover:scale-105 active:scale-95" style="box-shadow:0 4px 12px rgba(217,119,6,.35)">+ Nuevo Empleado</button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1" style="box-shadow:var(--shadow-card)"><p class="text-xs text-slate-500 m-0">Empleados</p><p class="text-2xl font-bold text-purple-600 m-0">{{ empleados.length }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2" style="box-shadow:var(--shadow-card)"><p class="text-xs text-slate-500 m-0">Nómina Mensual</p><p class="text-2xl font-bold text-emerald-600 m-0">\${{ nominaMensual.toLocaleString() }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3" style="box-shadow:var(--shadow-card)"><p class="text-xs text-slate-500 m-0">Activos</p><p class="text-2xl font-bold text-blue-600 m-0">{{ activos }}</p></div>
      </div>
      <div *ngIf="cargando" class="flex flex-col gap-2">
        <div *ngFor="let _ of [1,2,3]" class="h-12 rounded-lg skeleton"></div>
      </div>

      <div *ngIf="!cargando" class="bg-white border border-slate-200 rounded-xl overflow-hidden scale-in delay-4">
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">Nombre</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Departamento</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Puesto</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Estado</th>
            <th class="text-right px-4 py-3 font-medium text-slate-500">Acciones</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let e of empleados" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 font-medium">{{ e.nombre }}</td>
              <td class="px-4 py-3 text-slate-500">{{ e.departamento }}</td>
              <td class="px-4 py-3 text-slate-500">{{ e.puesto }}</td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="e.estado==='activo'?'badge-green':'badge-amber'">{{ e.estado }}</span></td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button *appPuede="'erp_rrhh.editar'" (click)="openEdit(e)" title="Editar" class="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-amber-600 p-1">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button *appPuede="'erp_rrhh.eliminar'" (click)="eliminar(e)" title="Eliminar" class="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-red-500 p-1">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="empleados.length===0"><td colspan="5" class="text-center py-8 text-slate-400 text-xs">Sin empleados registrados todavía.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-100"><h3 class="m-0 text-sm font-bold text-slate-800">Historial de Nómina</h3></div>
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">Fecha</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Empleados pagados</th>
            <th class="text-right px-4 py-3 font-medium text-slate-500">Total</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of historialNomina" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-500 text-xs">{{ p.fecha }}</td>
              <td class="px-4 py-3">{{ p.detalles.length }} empleados</td>
              <td class="px-4 py-3 text-right font-semibold text-emerald-600">\${{ p.total.toLocaleString() }}</td>
            </tr>
            <tr *ngIf="historialNomina.length===0"><td colspan="3" class="text-center py-8 text-slate-400 text-xs">Sin pagos de nómina registrados.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div *ngIf="dialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="dialogOpen=false"></div>
    <div *ngIf="dialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-md z-[101] shadow-2xl p-6 modal-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="m-0 text-lg font-semibold">{{ editando ? 'Editar Empleado' : 'Nuevo Empleado' }}</h3>
        <button (click)="dialogOpen=false" class="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 p-1 -m-1">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="flex flex-col gap-3">
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.nombre" placeholder="Nombre" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.departamento" placeholder="Departamento" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.puesto" placeholder="Puesto" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" [(ngModel)]="form.salario" placeholder="Salario mensual" />
        <select *ngIf="editando" class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.estado">
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <p *ngIf="error" class="text-xs text-red-600 m-0">{{ error }}</p>
        <button (click)="submit()" [disabled]="saving" class="w-full py-2.5 bg-amber-600 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">{{ saving ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Agregar') }}</button>
      </div>
    </div>

    <div *ngIf="nominaDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="nominaDialogOpen=false"></div>
    <div *ngIf="nominaDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-md z-[101] shadow-2xl p-6 modal-in max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="m-0 text-lg font-semibold">Procesar Nómina</h3>
        <button (click)="nominaDialogOpen=false" class="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 p-1 -m-1">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="flex flex-col gap-3">
        <input type="date" class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="nominaFecha" />
        <p class="text-xs text-slate-500 m-0">Empleados activos a pagar:</p>
        <div class="flex flex-col gap-1 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2">
          <label *ngFor="let e of empleadosActivos" class="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" [(ngModel)]="seleccionNomina[e.id]" />
            <span class="flex-1">{{ e.nombre }} — {{ e.puesto }}</span>
            <span class="text-slate-500">\${{ (e.salario || 0).toLocaleString() }}</span>
          </label>
          <p *ngIf="empleadosActivos.length===0" class="text-xs text-slate-400 m-0 text-center py-3">No hay empleados activos.</p>
        </div>
        <div class="flex justify-between text-sm font-bold pt-2 border-t border-slate-100">
          <span>Total a pagar</span>
          <span class="text-emerald-600">\${{ totalNominaSeleccionada.toLocaleString() }}</span>
        </div>
        <p *ngIf="nominaError" class="text-xs text-red-600 m-0">{{ nominaError }}</p>
        <button (click)="procesarNomina()" [disabled]="nominaSaving" class="w-full py-2.5 bg-amber-600 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">{{ nominaSaving ? 'Procesando...' : 'Procesar Nómina' }}</button>
      </div>
    </div>

    <div *ngIf="papeleraOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="papeleraOpen=false"></div>
    <div *ngIf="papeleraOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-lg z-[101] shadow-2xl p-6 modal-in max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="m-0 text-lg font-semibold">Papelera de Empleados</h3>
        <button (click)="papeleraOpen=false" class="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 p-1 -m-1">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="flex flex-col gap-2">
        <p *ngIf="papelera.length === 0" class="text-sm text-slate-400 m-0">No hay empleados eliminados.</p>
        <div *ngFor="let e of papelera" class="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
          <div>
            <p class="m-0 font-medium">{{ e.nombre }}</p>
            <p class="m-0 text-xs text-slate-500">{{ e.departamento }} · {{ e.puesto }}</p>
          </div>
          <button (click)="restaurar(e.id)" class="text-xs text-emerald-600 font-medium bg-transparent border-0 cursor-pointer hover:underline">Restaurar</button>
        </div>
      </div>
    </div>
  `,
})
export class ErpRrhhComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form = { nombre: '', departamento: '', puesto: '', salario: '', estado: 'activo' };
  editando: ErpEmpleado | null = null;
  empleados: ErpEmpleado[] = [];
  cargando = true;

  papeleraOpen = false;
  papelera: ErpEmpleado[] = [];

  historialNomina: ErpNominaPago[] = [];

  nominaDialogOpen = false;
  nominaSaving = false;
  nominaError = '';
  nominaFecha = new Date().toISOString().slice(0, 10);
  seleccionNomina: Record<number, boolean> = {};

  constructor(
    private erpService: ErpService,
    private contabilidad: ContabilidadService,
    private notify: NotifyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.erpService.cargarEmpleados().subscribe();
    this.erpService.empleados$.subscribe(data => { this.empleados = data; this.cargando = false; this.cdr.detectChanges(); });
    this.contabilidad.cargarHistorialNomina().subscribe(data => { this.historialNomina = data; this.cdr.detectChanges(); });
    this.contabilidad.nomina$.subscribe(data => { this.historialNomina = data; this.cdr.detectChanges(); });
  }

  get activos() { return this.empleados.filter(e => e.estado === 'activo').length; }
  get nominaMensual() { return this.empleados.reduce((s, e) => s + Number(e.salario || 0), 0); }
  get empleadosActivos() { return this.empleados.filter(e => e.estado === 'activo'); }

  get totalNominaSeleccionada() {
    return this.empleadosActivos
      .filter(e => this.seleccionNomina[e.id])
      .reduce((s, e) => s + Number(e.salario || 0), 0);
  }

  openNew() {
    this.editando = null;
    this.form = { nombre: '', departamento: '', puesto: '', salario: '', estado: 'activo' };
    this.error = '';
    this.dialogOpen = true;
  }

  openEdit(empleado: ErpEmpleado) {
    this.editando = empleado;
    this.form = {
      nombre: empleado.nombre,
      departamento: empleado.departamento,
      puesto: empleado.puesto,
      salario: empleado.salario != null ? String(empleado.salario) : '',
      estado: empleado.estado,
    };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.departamento || !this.form.puesto) { this.error = 'Nombre, departamento y puesto son obligatorios.'; return; }

    this.saving = true;
    this.error = '';

    const payload: Partial<ErpEmpleado> = {
      nombre: this.form.nombre,
      departamento: this.form.departamento,
      puesto: this.form.puesto,
      salario: this.form.salario ? Number(this.form.salario) : null,
    };
    if (this.editando) payload.estado = this.form.estado as 'activo' | 'inactivo';

    const peticion = this.editando
      ? this.erpService.updateEmpleado(this.editando.id, payload)
      : this.erpService.addEmpleado(payload);

    peticion.subscribe({
      next: () => {
        this.saving = false;
        this.dialogOpen = false;
        this.notify.success(this.editando ? 'Empleado actualizado' : 'Empleado registrado');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.error = 'No se pudo guardar el empleado. Intenta de nuevo.';
        this.notify.error(this.error);
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  async eliminar(empleado: ErpEmpleado) {
    const ok = await this.notify.confirm(`¿Eliminar a "${empleado.nombre}"? Podrás restaurarlo desde la papelera.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteEmpleado(empleado.id).subscribe({
      next: () => { this.notify.success('Empleado eliminado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar el empleado'); console.error(err); },
    });
  }

  abrirPapelera() {
    this.papeleraOpen = true;
    this.erpService.cargarPapeleraEmpleados().subscribe(data => { this.papelera = data; this.cdr.detectChanges(); });
  }

  restaurar(id: number) {
    this.erpService.restaurarEmpleado(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(e => e.id !== id); this.notify.success('Empleado restaurado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo restaurar el empleado'); console.error(err); },
    });
  }

  openNomina() {
    this.nominaFecha = new Date().toISOString().slice(0, 10);
    this.seleccionNomina = {};
    this.empleadosActivos.forEach(e => this.seleccionNomina[e.id] = true);
    this.nominaError = '';
    this.nominaDialogOpen = true;
  }

  async procesarNomina() {
    if (this.nominaSaving) return;

    const empleadosIds = this.empleadosActivos.filter(e => this.seleccionNomina[e.id]).map(e => e.id);
    if (empleadosIds.length === 0) { this.nominaError = 'Selecciona al menos un empleado.'; return; }

    const ok = await this.notify.confirm(`¿Procesar nómina por $${this.totalNominaSeleccionada.toLocaleString()} para ${empleadosIds.length} empleado(s)?`, { confirmText: 'Procesar' });
    if (!ok) return;

    this.nominaSaving = true;
    this.nominaError = '';
    this.contabilidad.procesarNomina({ fecha: this.nominaFecha, empleados: empleadosIds }).subscribe({
      next: () => { this.nominaSaving = false; this.nominaDialogOpen = false; this.notify.success('Nómina procesada'); this.cdr.detectChanges(); },
      error: err => {
        this.nominaSaving = false;
        this.nominaError = err?.error?.message || 'No se pudo procesar la nómina.';
        this.cdr.detectChanges();
      },
    });
  }
}
