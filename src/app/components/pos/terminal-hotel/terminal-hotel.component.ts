import { Component } from '@angular/core';

type EstadoHab = 'libre' | 'ocupada' | 'checkout' | 'mantenimiento';

interface Habitacion {
  numero: number; tipo: string; piso: number; estado: EstadoHab;
  huesped?: string; checkIn?: string; checkOut?: string; noches?: number;
  consumos: { desc: string; monto: number }[];
}

@Component({
  selector: 'app-pos-terminal-hotel',
  standalone: false,
  template: `
<div class="flex gap-4 h-full page-enter">

  <!-- ── PANEL IZQ: Habitaciones ── -->
  <div class="w-72 flex-shrink-0 flex flex-col gap-3">
    <!-- Leyenda -->
    <div class="bg-white rounded-2xl p-3 border border-slate-100 flex flex-wrap gap-2">
      <span *ngFor="let e of estados" class="flex items-center gap-1.5 text-[10px] font-semibold" [ngClass]="e.text">
        <span class="w-2.5 h-2.5 rounded-full inline-block" [ngClass]="e.dot"></span>{{ e.label }}
      </span>
    </div>
    <!-- Grid de habitaciones -->
    <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto p-3">
      <div class="grid grid-cols-4 gap-2">
        <button *ngFor="let h of habitaciones"
          (click)="seleccionar(h)"
          class="aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all text-center p-1"
          [ngClass]="estadoClases(h)"
          [class.ring-2]="habSeleccionada?.numero === h.numero"
          [style.ring-color]="'#f59e0b'">
          <span class="text-[11px] font-extrabold leading-none">{{ h.numero }}</span>
          <span class="text-[8px] mt-0.5 leading-none opacity-70">{{ h.tipo }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ── PANEL CENTRO: Detalle hab ── -->
  <div class="flex-1 min-w-0 flex flex-col gap-3">
    <div *ngIf="!habSeleccionada" class="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8">
      <div class="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mb-4">🛏️</div>
      <p class="text-sm font-bold text-slate-600 m-0">Selecciona una habitación</p>
      <p class="text-xs text-slate-400 m-0 mt-1">para ver su estado y gestionar el servicio</p>
    </div>

    <ng-container *ngIf="habSeleccionada">
      <!-- Header habitación -->
      <div class="bg-white rounded-2xl p-4 border border-slate-100">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
              [ngClass]="habSeleccionada.estado === 'libre' ? 'bg-emerald-400' : habSeleccionada.estado === 'ocupada' ? 'bg-amber-400' : habSeleccionada.estado === 'checkout' ? 'bg-blue-400' : 'bg-slate-400'">
              {{ habSeleccionada.numero }}
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800 m-0">Habitación {{ habSeleccionada.numero }} — {{ habSeleccionada.tipo }}</p>
              <p class="text-xs text-slate-400 m-0">Piso {{ habSeleccionada.piso }}</p>
            </div>
          </div>
          <span class="text-[10px] font-bold px-3 py-1 rounded-full"
            [class.bg-emerald-100]="habSeleccionada.estado==='libre'" [class.text-emerald-600]="habSeleccionada.estado==='libre'"
            [class.bg-amber-100]="habSeleccionada.estado==='ocupada'" [class.text-amber-600]="habSeleccionada.estado==='ocupada'"
            [class.bg-blue-100]="habSeleccionada.estado==='checkout'" [class.text-blue-600]="habSeleccionada.estado==='checkout'"
            [class.bg-slate-100]="habSeleccionada.estado==='mantenimiento'" [class.text-slate-500]="habSeleccionada.estado==='mantenimiento'">
            {{ habSeleccionada.estado | titlecase }}
          </span>
        </div>
        <!-- Huésped info -->
        <div *ngIf="habSeleccionada.huesped" class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
          <div>
            <p class="text-[10px] text-slate-400 m-0">Huésped</p>
            <p class="text-xs font-semibold text-slate-700 m-0 mt-0.5">{{ habSeleccionada.huesped }}</p>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 m-0">Check-in</p>
            <p class="text-xs font-semibold text-slate-700 m-0 mt-0.5">{{ habSeleccionada.checkIn }}</p>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 m-0">Check-out</p>
            <p class="text-xs font-semibold text-slate-700 m-0 mt-0.5">{{ habSeleccionada.checkOut }}</p>
          </div>
        </div>
        <!-- Acciones -->
        <div class="mt-3 flex gap-2">
          <button *ngIf="habSeleccionada.estado==='libre'" (click)="checkIn()"
            class="flex-1 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer text-white hover:opacity-90 transition-all"
            style="background:#f59e0b">Check-in</button>
          <button *ngIf="habSeleccionada.estado==='ocupada' || habSeleccionada.estado==='checkout'" (click)="checkOut()"
            class="flex-1 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer text-white hover:opacity-90 transition-all"
            style="background:#3b82f6">Check-out</button>
          <button *ngIf="habSeleccionada.estado==='ocupada'" (click)="mostrarRoomService=!mostrarRoomService"
            class="flex-1 py-2 text-xs font-bold rounded-xl border border-amber-300 cursor-pointer text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all">
            Room Service
          </button>
          <button *ngIf="habSeleccionada.estado==='libre'" (click)="habSeleccionada.estado='mantenimiento'"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-500 bg-transparent hover:bg-slate-50 transition-all">
            Mantenimiento
          </button>
        </div>
      </div>

      <!-- Consumos -->
      <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
        <div class="px-5 pt-4 pb-2 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Consumos Room Service</p>
          <span class="text-xs font-bold text-amber-600">Total: \${{ totalConsumos }}</span>
        </div>
        <div *ngIf="habSeleccionada.consumos.length === 0" class="text-center py-8 text-slate-400 text-xs">Sin consumos registrados</div>
        <div *ngFor="let c of habSeleccionada.consumos" class="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-0">
          <p class="text-xs text-slate-700 m-0">{{ c.desc }}</p>
          <p class="text-xs font-bold text-slate-700 m-0">\${{ c.monto }}</p>
        </div>
      </div>

      <!-- Room Service selector -->
      <div *ngIf="mostrarRoomService && habSeleccionada.estado==='ocupada'"
        class="bg-white rounded-2xl border border-amber-200 p-4">
        <p class="text-xs font-bold text-slate-700 m-0 mb-3">Agregar Room Service</p>
        <div class="grid grid-cols-3 gap-2">
          <button *ngFor="let item of menuRoomService" (click)="agregarConsumo(item)"
            class="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-all text-center">
            <span class="text-xl">{{ item.emoji }}</span>
            <span class="text-[10px] font-semibold text-slate-600 leading-tight">{{ item.desc }}</span>
            <span class="text-[10px] font-bold text-amber-600">\${{ item.monto }}</span>
          </button>
        </div>
      </div>
    </ng-container>
  </div>
</div>
  `,
})
export class PosTerminalHotelComponent {
  habSeleccionada: Habitacion | null = null;
  mostrarRoomService = false;

  estados = [
    { label: 'Libre', dot: 'bg-emerald-400', text: 'text-emerald-600' },
    { label: 'Ocupada', dot: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Checkout hoy', dot: 'bg-blue-400', text: 'text-blue-600' },
    { label: 'Mantenimiento', dot: 'bg-slate-400', text: 'text-slate-500' },
  ];

  menuRoomService = [
    { emoji: '🍳', desc: 'Desayuno', monto: 180 },
    { emoji: '🥗', desc: 'Ensalada', monto: 120 },
    { emoji: '🍔', desc: 'Hamburguesa', monto: 150 },
    { emoji: '🍷', desc: 'Vino', monto: 280 },
    { emoji: '🧃', desc: 'Jugo', monto: 60 },
    { emoji: '☕', desc: 'Café', monto: 45 },
    { emoji: '🍰', desc: 'Postre', monto: 95 },
    { emoji: '🧹', desc: 'Limpieza extra', monto: 200 },
    { emoji: '🛎️', desc: 'Maletero', monto: 80 },
  ];

  habitaciones: Habitacion[] = [
    { numero: 101, tipo: 'Sgl', piso: 1, estado: 'ocupada', huesped: 'García, M.', checkIn: '27/06', checkOut: '30/06', noches: 3, consumos: [{ desc: 'Desayuno 28/06', monto: 180 }] },
    { numero: 102, tipo: 'Dbl', piso: 1, estado: 'libre', consumos: [] },
    { numero: 103, tipo: 'Dbl', piso: 1, estado: 'checkout', huesped: 'López, R.', checkIn: '25/06', checkOut: '29/06', noches: 4, consumos: [{ desc: 'Vino tinto', monto: 280 }, { desc: 'Room Service', monto: 150 }] },
    { numero: 104, tipo: 'Sgl', piso: 1, estado: 'mantenimiento', consumos: [] },
    { numero: 201, tipo: 'Ste', piso: 2, estado: 'ocupada', huesped: 'Martínez, A.', checkIn: '28/06', checkOut: '01/07', noches: 3, consumos: [] },
    { numero: 202, tipo: 'Dbl', piso: 2, estado: 'libre', consumos: [] },
    { numero: 203, tipo: 'Dbl', piso: 2, estado: 'libre', consumos: [] },
    { numero: 204, tipo: 'Sgl', piso: 2, estado: 'ocupada', huesped: 'Torres, J.', checkIn: '29/06', checkOut: '02/07', noches: 3, consumos: [{ desc: 'Café × 2', monto: 90 }] },
    { numero: 301, tipo: 'Ste', piso: 3, estado: 'libre', consumos: [] },
    { numero: 302, tipo: 'Dbl', piso: 3, estado: 'ocupada', huesped: 'Ruiz, C.', checkIn: '26/06', checkOut: '30/06', noches: 4, consumos: [] },
    { numero: 303, tipo: 'Dbl', piso: 3, estado: 'libre', consumos: [] },
    { numero: 304, tipo: 'Sgl', piso: 3, estado: 'mantenimiento', consumos: [] },
  ];

  get totalConsumos(): number {
    return this.habSeleccionada?.consumos.reduce((s, c) => s + c.monto, 0) ?? 0;
  }

  estadoClases(h: Habitacion): string {
    const sel = this.habSeleccionada?.numero === h.numero;
    const map: Record<EstadoHab, string> = {
      libre: `bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400${sel ? ' border-amber-400 bg-amber-50' : ''}`,
      ocupada: `bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400${sel ? ' border-amber-500' : ''}`,
      checkout: `bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400${sel ? ' border-blue-500' : ''}`,
      mantenimiento: `bg-slate-100 border-slate-200 text-slate-400${sel ? ' border-slate-400' : ''}`,
    };
    return map[h.estado];
  }

  seleccionar(h: Habitacion) {
    this.habSeleccionada = h;
    this.mostrarRoomService = false;
  }

  agregarConsumo(item: { emoji: string; desc: string; monto: number }) {
    this.habSeleccionada?.consumos.push({ desc: item.desc, monto: item.monto });
  }

  checkIn() {
    if (!this.habSeleccionada) return;
    this.habSeleccionada.estado = 'ocupada';
    this.habSeleccionada.huesped = 'Nuevo Huésped';
    this.habSeleccionada.checkIn = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
    this.habSeleccionada.checkOut = '02/07';
  }

  checkOut() {
    if (!this.habSeleccionada) return;
    alert(`Check-out completado\nHuésped: ${this.habSeleccionada.huesped}\nConsumos totales: $${this.totalConsumos}`);
    this.habSeleccionada.estado = 'libre';
    this.habSeleccionada.huesped = undefined;
    this.habSeleccionada.consumos = [];
    this.habSeleccionada = null;
  }
}
