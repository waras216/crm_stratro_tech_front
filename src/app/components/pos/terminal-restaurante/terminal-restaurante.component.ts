import { Component, inject } from '@angular/core';
import { NotifyService } from '../../../core/services/notify.service';

type EstadoMesa = 'libre' | 'ocupada' | 'cuenta' | 'reservada';

interface ItemComanda { nombre: string; precio: number; cantidad: number; emoji: string; }
interface Mesa { numero: number; capacidad: number; estado: EstadoMesa; mesero?: string; comanda: ItemComanda[]; }

@Component({
  selector: 'app-pos-terminal-restaurante',
  standalone: false,
  template: `
<div class="flex gap-4 h-full page-enter">

  <!-- ── PANEL IZQ: Mesas ── -->
  <div class="w-64 flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl p-3 border border-slate-100 flex flex-wrap gap-2">
      <span *ngFor="let e of estados" class="flex items-center gap-1.5 text-[10px] font-semibold" [ngClass]="e.text">
        <span class="w-2.5 h-2.5 rounded-full inline-block" [ngClass]="e.dot"></span>{{ e.label }}
      </span>
    </div>
    <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto p-3">
      <div class="grid grid-cols-3 gap-2">
        <button *ngFor="let m of mesas"
          (click)="seleccionar(m)"
          class="aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all"
          [ngClass]="mesaClases(m)">
          <span class="text-[13px] font-extrabold leading-none">{{ m.numero }}</span>
          <span class="text-[8px] opacity-60 mt-0.5">{{ m.capacidad }}p</span>
          <span *ngIf="m.comanda.length > 0" class="text-[8px] font-bold mt-0.5"
            [class.text-red-500]="m.estado==='cuenta'" [class.text-amber-600]="m.estado==='ocupada'">
            \${{ totalMesa(m) }}
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- ── PANEL CENTRO: Comanda ── -->
  <div class="flex-1 min-w-0 flex flex-col gap-3">
    <div *ngIf="!mesaSeleccionada" class="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8">
      <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mb-4">🍽️</div>
      <p class="text-sm font-bold text-slate-600 m-0">Selecciona una mesa</p>
      <p class="text-xs text-slate-400 m-0 mt-1">para ver o crear su comanda</p>
    </div>

    <ng-container *ngIf="mesaSeleccionada">
      <!-- Header mesa -->
      <div class="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
          [class.bg-emerald-400]="mesaSeleccionada.estado==='libre'"
          [class.bg-red-400]="mesaSeleccionada.estado==='ocupada'"
          [class.bg-amber-400]="mesaSeleccionada.estado==='cuenta'"
          [class.bg-indigo-400]="mesaSeleccionada.estado==='reservada'">
          {{ mesaSeleccionada.numero }}
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800 m-0">Mesa {{ mesaSeleccionada.numero }} — {{ mesaSeleccionada.capacidad }} personas</p>
          <p class="text-xs text-slate-400 m-0" *ngIf="mesaSeleccionada.mesero">Mesero: {{ mesaSeleccionada.mesero }}</p>
        </div>
        <div class="flex gap-2">
          <button *ngIf="mesaSeleccionada.estado==='libre'" (click)="abrirMesa()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#ef4444">Abrir Mesa</button>
          <button *ngIf="mesaSeleccionada.estado==='ocupada'" (click)="pedirCuenta()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#f59e0b">Pedir Cuenta</button>
          <button *ngIf="mesaSeleccionada.estado==='cuenta'" (click)="cerrarMesa()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#10b981">Cobrar \${{ totalMesa(mesaSeleccionada) }}</button>
          <button *ngIf="mesaSeleccionada.estado==='ocupada' && mesaSeleccionada.comanda.length>0" (click)="enviarACocina()"
            class="text-xs font-semibold px-4 py-2 rounded-xl border border-red-200 cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 transition-all">
            Enviar a Cocina
          </button>
        </div>
      </div>

      <!-- Comanda -->
      <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
        <div class="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Comanda Activa</p>
          <span class="text-xs font-bold text-red-600">Total: \${{ totalMesa(mesaSeleccionada) }}</span>
        </div>
        <div *ngIf="mesaSeleccionada.comanda.length === 0" class="text-center py-10 text-slate-400 text-xs">
          Mesa vacía — agrega items del menú
        </div>
        <div *ngFor="let item of mesaSeleccionada.comanda; let i = index"
          class="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 card-enter"
          [style.animation-delay]="(i*0.04)+'s'">
          <span class="text-xl flex-shrink-0">{{ item.emoji }}</span>
          <div class="flex-1">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ item.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">\${{ item.precio }} c/u</p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="cambiarCantidad(item,-1)"
              class="w-6 h-6 rounded-lg bg-slate-100 border-0 cursor-pointer text-slate-600 font-bold hover:bg-slate-200 text-xs">−</button>
            <span class="text-xs font-bold text-slate-700 w-4 text-center">{{ item.cantidad }}</span>
            <button (click)="cambiarCantidad(item,1)"
              class="w-6 h-6 rounded-lg bg-red-50 border-0 cursor-pointer text-red-600 font-bold hover:bg-red-100 text-xs">+</button>
          </div>
          <p class="text-xs font-bold text-slate-800 m-0 w-14 text-right">\${{ item.precio * item.cantidad }}</p>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- ── PANEL DER: Menú rápido ── -->
  <div class="w-64 flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
      <div class="px-4 pt-4 pb-2">
        <p class="text-xs font-bold text-slate-700 m-0 mb-2">Menú Rápido</p>
        <div class="flex gap-1 flex-wrap">
          <button *ngFor="let cat of categorias"
            (click)="categoriaActiva=cat"
            class="text-[10px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer transition-all"
            [class.text-white]="categoriaActiva===cat"
            [class.bg-red-500]="categoriaActiva===cat"
            [class.bg-slate-100]="categoriaActiva!==cat"
            [class.text-slate-600]="categoriaActiva!==cat">
            {{ cat }}
          </button>
        </div>
      </div>
      <div class="px-3 pb-3 flex flex-col gap-1.5">
        <button *ngFor="let item of menuFiltrado"
          (click)="agregarItem(item)"
          [disabled]="!mesaSeleccionada || mesaSeleccionada.estado==='libre'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 transition-all text-left w-full"
          [class.hover:bg-red-50]="mesaSeleccionada && mesaSeleccionada.estado!=='libre'"
          [class.hover:border-red-200]="mesaSeleccionada && mesaSeleccionada.estado!=='libre'"
          [class.cursor-pointer]="mesaSeleccionada && mesaSeleccionada.estado!=='libre'"
          [class.cursor-not-allowed]="!mesaSeleccionada || mesaSeleccionada.estado==='libre'"
          [class.opacity-50]="!mesaSeleccionada || mesaSeleccionada.estado==='libre'"
          style="background:transparent">
          <span class="text-lg flex-shrink-0">{{ item.emoji }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-semibold text-slate-700 m-0 truncate">{{ item.nombre }}</p>
          </div>
          <span class="text-[11px] font-bold text-red-500 flex-shrink-0">\${{ item.precio }}</span>
        </button>
      </div>
    </div>
  </div>
</div>
  `,
})
export class PosTerminalRestauranteComponent {
  private notify = inject(NotifyService);

  mesaSeleccionada: Mesa | null = null;
  categoriaActiva = 'Entradas';

  estados = [
    { label: 'Libre',     dot: 'bg-emerald-400', text: 'text-emerald-600' },
    { label: 'Ocupada',   dot: 'bg-red-400',     text: 'text-red-600' },
    { label: 'Cuenta',    dot: 'bg-amber-400',   text: 'text-amber-600' },
    { label: 'Reservada', dot: 'bg-indigo-400',  text: 'text-indigo-600' },
  ];

  categorias = ['Entradas', 'Principales', 'Bebidas', 'Postres'];

  menu = [
    { nombre: 'Ensalada César', precio: 75, categoria: 'Entradas', emoji: '🥗' },
    { nombre: 'Sopa del día', precio: 55, categoria: 'Entradas', emoji: '🍲' },
    { nombre: 'Nachos', precio: 65, categoria: 'Entradas', emoji: '🧀' },
    { nombre: 'Filete', precio: 220, categoria: 'Principales', emoji: '🥩' },
    { nombre: 'Pasta Carbonara', precio: 145, categoria: 'Principales', emoji: '🍝' },
    { nombre: 'Pollo a la Plancha', precio: 130, categoria: 'Principales', emoji: '🍗' },
    { nombre: 'Tacos (3)', precio: 85, categoria: 'Principales', emoji: '🌮' },
    { nombre: 'Agua Mineral', precio: 25, categoria: 'Bebidas', emoji: '💧' },
    { nombre: 'Refresco', precio: 35, categoria: 'Bebidas', emoji: '🥤' },
    { nombre: 'Cerveza', precio: 55, categoria: 'Bebidas', emoji: '🍺' },
    { nombre: 'Vino Copa', precio: 95, categoria: 'Bebidas', emoji: '🍷' },
    { nombre: 'Pay de queso', precio: 65, categoria: 'Postres', emoji: '🍰' },
    { nombre: 'Helado', precio: 45, categoria: 'Postres', emoji: '🍦' },
  ];

  mesas: Mesa[] = [
    { numero: 1, capacidad: 2, estado: 'libre', comanda: [] },
    { numero: 2, capacidad: 4, estado: 'ocupada', mesero: 'Carlos', comanda: [{ nombre: 'Filete', precio: 220, cantidad: 2, emoji: '🥩' }, { nombre: 'Vino Copa', precio: 95, cantidad: 2, emoji: '🍷' }] },
    { numero: 3, capacidad: 4, estado: 'cuenta', mesero: 'Ana', comanda: [{ nombre: 'Pasta Carbonara', precio: 145, cantidad: 1, emoji: '🍝' }, { nombre: 'Cerveza', precio: 55, cantidad: 2, emoji: '🍺' }] },
    { numero: 4, capacidad: 6, estado: 'libre', comanda: [] },
    { numero: 5, capacidad: 2, estado: 'reservada', comanda: [] },
    { numero: 6, capacidad: 4, estado: 'ocupada', mesero: 'Luis', comanda: [{ nombre: 'Tacos (3)', precio: 85, cantidad: 4, emoji: '🌮' }] },
    { numero: 7, capacidad: 8, estado: 'libre', comanda: [] },
    { numero: 8, capacidad: 4, estado: 'libre', comanda: [] },
    { numero: 9, capacidad: 2, estado: 'ocupada', mesero: 'Carlos', comanda: [] },
    { numero: 10, capacidad: 6, estado: 'libre', comanda: [] },
  ];

  get menuFiltrado() {
    return this.menu.filter(m => m.categoria === this.categoriaActiva);
  }

  totalMesa(m: Mesa): number {
    return m.comanda.reduce((s, i) => s + i.precio * i.cantidad, 0);
  }

  mesaClases(m: Mesa): string {
    const sel = this.mesaSeleccionada?.numero === m.numero;
    const ring = sel ? ' ring-2 ring-offset-1 ring-red-400' : '';
    const map: Record<EstadoMesa, string> = {
      libre:    'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400',
      ocupada:  'bg-red-50 border-red-200 text-red-700 hover:border-red-400',
      cuenta:   'bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-400',
      reservada:'bg-indigo-50 border-indigo-200 text-indigo-700 hover:border-indigo-400',
    };
    return map[m.estado] + ring;
  }

  seleccionar(m: Mesa) { this.mesaSeleccionada = m; }

  abrirMesa() {
    if (!this.mesaSeleccionada) return;
    this.mesaSeleccionada.estado = 'ocupada';
    this.mesaSeleccionada.mesero = 'Mesero';
  }

  agregarItem(item: { nombre: string; precio: number; emoji: string }) {
    if (!this.mesaSeleccionada || this.mesaSeleccionada.estado === 'libre') return;
    const existing = this.mesaSeleccionada.comanda.find(i => i.nombre === item.nombre);
    if (existing) existing.cantidad++;
    else this.mesaSeleccionada.comanda = [...this.mesaSeleccionada.comanda, { ...item, cantidad: 1 }];
  }

  cambiarCantidad(item: ItemComanda, delta: number) {
    item.cantidad += delta;
    if (item.cantidad <= 0 && this.mesaSeleccionada) {
      this.mesaSeleccionada.comanda = this.mesaSeleccionada.comanda.filter(i => i !== item);
    }
  }

  pedirCuenta() {
    if (this.mesaSeleccionada) this.mesaSeleccionada.estado = 'cuenta';
  }

  enviarACocina() {
    this.notify.success(`Mesa ${this.mesaSeleccionada?.numero} — ${this.mesaSeleccionada?.comanda.length} items`, 'Comanda enviada a cocina');
  }

  cerrarMesa() {
    if (!this.mesaSeleccionada) return;
    this.notify.success(`Mesa ${this.mesaSeleccionada.numero} · Total: $${this.totalMesa(this.mesaSeleccionada)}`, 'Cuenta cobrada');
    this.mesaSeleccionada.estado = 'libre';
    this.mesaSeleccionada.comanda = [];
    this.mesaSeleccionada.mesero = undefined;
    this.mesaSeleccionada = null;
  }
}
