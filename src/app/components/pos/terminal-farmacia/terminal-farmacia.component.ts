import { Component, inject } from '@angular/core';
import { NotifyService } from '../../../core/services/notify.service';

interface Paciente { id: number; nombre: string; documento: string; telefono: string; }
interface Receta { id: number; pacienteId: number; medicamento: string; dosis: string; cantidad: number; precio: number; pendiente: boolean; }

@Component({
  selector: 'app-pos-terminal-farmacia',
  standalone: false,
  template: `
<div class="flex gap-4 h-full page-enter">

  <!-- ── PANEL IZQ: Pacientes ── -->
  <div class="w-72 flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl p-4 border border-slate-100">
      <p class="text-xs font-bold text-slate-700 m-0 mb-3">Buscar Paciente</p>
      <input [(ngModel)]="busqueda" (ngModelChange)="filtrar()"
        placeholder="Nombre o documento..."
        class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 transition-colors" />
    </div>
    <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
      <div class="px-4 pt-4 pb-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0">Pacientes ({{ pacientesFiltrados.length }})</p>
      </div>
      <div *ngFor="let p of pacientesFiltrados"
        (click)="seleccionar(p)"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-emerald-50 border-b border-slate-50 last:border-0"
        [class.bg-emerald-50]="pacienteSeleccionado?.id === p.id">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#34d399,#10b981)">{{ p.nombre.charAt(0) }}</div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-700 m-0 truncate">{{ p.nombre }}</p>
          <p class="text-[10px] text-slate-400 m-0">Doc: {{ p.documento }}</p>
        </div>
        <span *ngIf="recetasPendientes(p.id) > 0"
          class="text-[10px] font-bold bg-amber-100 text-amber-600 rounded-full px-2 py-0.5 flex-shrink-0">
          {{ recetasPendientes(p.id) }}
        </span>
      </div>
    </div>
  </div>

  <!-- ── PANEL CENTRO: Recetas ── -->
  <div class="flex-1 min-w-0 flex flex-col gap-3">
    <div *ngIf="!pacienteSeleccionado" class="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8">
      <div class="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mb-4">💊</div>
      <p class="text-sm font-bold text-slate-600 m-0">Selecciona un paciente</p>
      <p class="text-xs text-slate-400 m-0 mt-1">para ver sus recetas pendientes</p>
    </div>

    <ng-container *ngIf="pacienteSeleccionado">
      <!-- Header paciente -->
      <div class="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#34d399,#10b981)">{{ pacienteSeleccionado.nombre.charAt(0) }}</div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800 m-0">{{ pacienteSeleccionado.nombre }}</p>
          <p class="text-xs text-slate-400 m-0">Tel: {{ pacienteSeleccionado.telefono }} · Doc: {{ pacienteSeleccionado.documento }}</p>
        </div>
        <button (click)="nuevaReceta()" class="text-xs font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer text-white transition-all hover:opacity-90"
          style="background:#10b981">+ Nueva Receta</button>
      </div>

      <!-- Recetas pendientes -->
      <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
        <div class="px-5 pt-4 pb-2 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Recetas Pendientes</p>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">
            {{ recetasPaciente.filter(r=>r.pendiente).length }} pendientes
          </span>
        </div>
        <div *ngIf="recetasPaciente.length === 0" class="text-center py-10 text-slate-400 text-xs">Sin recetas registradas</div>
        <div *ngFor="let r of recetasPaciente; let i = index"
          class="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0 card-enter"
          [style.animation-delay]="(i*0.04)+'s'">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            [class.bg-amber-50]="r.pendiente" [class.bg-slate-50]="!r.pendiente">💊</div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ r.medicamento }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ r.dosis }} · Cant: {{ r.cantidad }}</p>
          </div>
          <p class="text-xs font-bold text-slate-700 m-0">\${{ r.precio * r.cantidad }}</p>
          <button *ngIf="r.pendiente" (click)="dispensar(r)"
            class="text-[10px] font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer text-white transition-all hover:opacity-90 flex-shrink-0"
            style="background:#10b981">Dispensar</button>
          <span *ngIf="!r.pendiente"
            class="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 flex-shrink-0">Entregado</span>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- ── PANEL DER: Carrito dispensación ── -->
  <div class="w-72 flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl border border-slate-100 flex-1 flex flex-col">
      <div class="px-4 pt-4 pb-2 border-b border-slate-50">
        <p class="text-xs font-bold text-slate-700 m-0">Dispensación</p>
        <p class="text-[10px] text-slate-400 m-0 mt-0.5">{{ carrito.length }} medicamentos</p>
      </div>
      <div class="flex-1 overflow-y-auto px-3 py-2">
        <div *ngIf="carrito.length === 0" class="flex flex-col items-center justify-center h-full text-center py-8">
          <p class="text-3xl mb-2">🧾</p>
          <p class="text-xs text-slate-400 m-0">Agrega recetas para dispensar</p>
        </div>
        <div *ngFor="let item of carrito" class="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
          <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm flex-shrink-0">💊</div>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-semibold text-slate-700 m-0 truncate">{{ item.medicamento }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ item.cantidad }} × \${{ item.precio }}</p>
          </div>
          <p class="text-xs font-bold text-emerald-600 m-0">\${{ item.precio * item.cantidad }}</p>
          <button (click)="quitarDelCarrito(item)" class="w-5 h-5 rounded text-slate-300 hover:text-red-400 border-0 bg-transparent cursor-pointer text-xs">✕</button>
        </div>
      </div>
      <div class="px-4 pb-4 pt-2 border-t border-slate-100">
        <div class="flex justify-between mb-3">
          <span class="text-xs text-slate-500">Total</span>
          <span class="text-sm font-extrabold text-slate-800">\${{ total }}</span>
        </div>
        <button (click)="cobrar()" [disabled]="carrito.length === 0"
          class="w-full py-2.5 rounded-xl border-0 text-xs font-bold text-white cursor-pointer transition-all"
          [style.background]="carrito.length > 0 ? '#10b981' : '#94a3b8'"
          [style.cursor]="carrito.length > 0 ? 'pointer' : 'not-allowed'">
          Cobrar Dispensación
        </button>
        <button *ngIf="carrito.length > 0" (click)="carrito=[]"
          class="w-full mt-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 bg-transparent cursor-pointer hover:bg-slate-50 transition-colors">
          Limpiar
        </button>
      </div>
    </div>
  </div>
</div>
  `,
})
export class PosTerminalFarmaciaComponent {
  private notify = inject(NotifyService);

  busqueda = '';
  pacienteSeleccionado: Paciente | null = null;
  carrito: { medicamento: string; dosis: string; cantidad: number; precio: number }[] = [];

  pacientes: Paciente[] = [
    { id: 1, nombre: 'María García López', documento: '4521890', telefono: '55 1234-5678' },
    { id: 2, nombre: 'Carlos Méndez Ruiz', documento: '7834201', telefono: '55 9876-5432' },
    { id: 3, nombre: 'Ana Torres Vega', documento: '3341562', telefono: '55 5555-1234' },
    { id: 4, nombre: 'Luis Hernández', documento: '9102847', telefono: '55 3333-4444' },
    { id: 5, nombre: 'Rosa Martínez Cruz', documento: '6234109', telefono: '55 7777-8888' },
  ];

  recetas: Receta[] = [
    { id: 1, pacienteId: 1, medicamento: 'Amoxicilina 500mg', dosis: 'Cada 8h × 7 días', cantidad: 21, precio: 8, pendiente: true },
    { id: 2, pacienteId: 1, medicamento: 'Paracetamol 500mg', dosis: 'Cada 6h si dolor', cantidad: 20, precio: 3, pendiente: true },
    { id: 3, pacienteId: 1, medicamento: 'Omeprazol 20mg', dosis: 'Una en ayunas', cantidad: 14, precio: 12, pendiente: false },
    { id: 4, pacienteId: 2, medicamento: 'Metformina 850mg', dosis: 'Con alimentos 2× día', cantidad: 60, precio: 5, pendiente: true },
    { id: 5, pacienteId: 2, medicamento: 'Losartán 50mg', dosis: 'Una vez al día', cantidad: 30, precio: 9, pendiente: true },
    { id: 6, pacienteId: 3, medicamento: 'Ibuprofeno 400mg', dosis: 'Cada 8h × 5 días', cantidad: 15, precio: 4, pendiente: true },
    { id: 7, pacienteId: 4, medicamento: 'Atorvastatina 20mg', dosis: 'Una en la noche', cantidad: 30, precio: 18, pendiente: true },
  ];

  pacientesFiltrados: Paciente[] = [...this.pacientes];

  get recetasPaciente(): Receta[] {
    return this.recetas.filter(r => r.pacienteId === this.pacienteSeleccionado?.id);
  }

  get total(): number {
    return this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  }

  filtrar() {
    const q = this.busqueda.toLowerCase();
    this.pacientesFiltrados = this.pacientes.filter(p =>
      p.nombre.toLowerCase().includes(q) || p.documento.includes(q)
    );
  }

  seleccionar(p: Paciente) { this.pacienteSeleccionado = p; }

  recetasPendientes(id: number): number {
    return this.recetas.filter(r => r.pacienteId === id && r.pendiente).length;
  }

  dispensar(r: Receta) {
    this.carrito.push({ medicamento: r.medicamento, dosis: r.dosis, cantidad: r.cantidad, precio: r.precio });
    r.pendiente = false;
  }

  quitarDelCarrito(item: any) {
    const receta = this.recetas.find(r => r.medicamento === item.medicamento && !r.pendiente);
    if (receta) receta.pendiente = true;
    this.carrito = this.carrito.filter(i => i !== item);
  }

  nuevaReceta() {
    this.notify.info('Formulario de nueva receta — próximamente');
  }

  cobrar() {
    if (this.carrito.length === 0) return;
    this.notify.success(`Total: $${this.total} · Medicamentos: ${this.carrito.length}`, 'Dispensación completada');
    this.carrito = [];
    this.pacienteSeleccionado = null;
  }
}
