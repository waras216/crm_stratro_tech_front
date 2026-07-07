import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpProyecto } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-proyectos',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div><h2 class="m-0 text-lg font-bold text-slate-800">Gestión de Proyectos</h2><p class="text-xs text-slate-500 m-0 mt-1">Planificación, recursos y presupuestos</p></div>
        <button (click)="openNew()" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Nuevo Proyecto</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1"><p class="text-xs text-slate-500 m-0">Activos</p><p class="text-2xl font-bold text-orange-600 m-0">{{ activos }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2"><p class="text-xs text-slate-500 m-0">Horas Registradas</p><p class="text-2xl font-bold text-blue-600 m-0">{{ horasTotales.toLocaleString() }}</p></div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3"><p class="text-xs text-slate-500 m-0">Presupuesto Total</p><p class="text-2xl font-bold text-emerald-600 m-0">\${{ presupuestoTotal.toLocaleString() }}</p></div>
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

    <div *ngIf="dialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="dialogOpen=false"></div>
    <div *ngIf="dialogOpen" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-md z-[101] shadow-2xl p-6 modal-in">
      <h3 class="m-0 mb-4 text-lg font-semibold">Nuevo Proyecto</h3>
      <div class="flex flex-col gap-3">
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.nombre" placeholder="Nombre del proyecto" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.cliente" placeholder="Cliente" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.responsable" placeholder="Responsable" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" [(ngModel)]="form.presupuesto" placeholder="Presupuesto $" />
        <p *ngIf="error" class="text-xs text-red-600 m-0">{{ error }}</p>
        <button (click)="submit()" [disabled]="saving" class="w-full py-2.5 bg-amber-600 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">{{ saving ? 'Guardando...' : 'Crear Proyecto' }}</button>
      </div>
    </div>
  `,
})
export class ErpProyectosComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form = { nombre: '', cliente: '', responsable: '', presupuesto: '' };
  proyectos: ErpProyecto[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarProyectos().subscribe();
    this.erpService.proyectos$.subscribe(data => { this.proyectos = data; this.cdr.detectChanges(); });
  }

  get activos() { return this.proyectos.filter(p => p.estado === 'activo').length; }
  get horasTotales() { return this.proyectos.reduce((s, p) => s + Number(p.horas), 0); }
  get presupuestoTotal() { return this.proyectos.reduce((s, p) => s + Number(p.presupuesto || 0), 0); }

  openNew() { this.form = { nombre: '', cliente: '', responsable: '', presupuesto: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.cliente || !this.form.responsable) { this.error = 'Nombre, cliente y responsable son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addProyecto({
      nombre: this.form.nombre,
      cliente: this.form.cliente,
      responsable: this.form.responsable,
      presupuesto: this.form.presupuesto ? Number(this.form.presupuesto) : null,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el proyecto. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }
}
