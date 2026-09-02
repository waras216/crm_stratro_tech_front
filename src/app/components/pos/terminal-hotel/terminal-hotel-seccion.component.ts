import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpService } from '../../../core/services/erp-service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ErpHabitacion, ErpHabitacionConsumo, Producto } from '../../../models/erp.models';

/**
 * Terminal enfocado en una sola sección del hotel (Bar, Spa, Piscina...): solo ve el menú de esa
 * categoría y una habitación ocupada a la vez, para el personal de esa sección (no gestiona
 * check-in/check-out ni ve el resto del inventario del hotel). Cada consumo que agrega queda
 * etiquetado con `seccion` en el backend (a partir de la categoría del producto), lo que permite
 * desglosar la venta por sección en Administración al hacer check-out.
 */
@Component({
  selector: 'app-pos-terminal-hotel-seccion',
  standalone: false,
  template: `
<div class="flex flex-col lg:flex-row gap-4 lg:h-full page-enter">

  <!-- ── PANEL IZQ: Habitaciones ocupadas ── -->
  <div class="w-full lg:w-64 lg:flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl p-4 border border-slate-100">
      <p class="text-xs font-bold text-slate-700 m-0">Terminal — {{ seccion }}</p>
      <p class="text-[10px] text-slate-400 m-0 mt-0.5">Selecciona la habitación a la que se carga el consumo</p>
    </div>
    <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[38vh] lg:max-h-none overflow-y-auto p-3">
      <p *ngIf="cargando" class="text-center py-8 text-slate-400 text-xs">Cargando...</p>
      <p *ngIf="!cargando && habitaciones.length===0" class="text-center py-8 text-slate-400 text-xs">No hay habitaciones ocupadas ahora mismo</p>
      <div class="grid grid-cols-3 gap-2">
        <button *ngFor="let h of habitaciones" (click)="seleccionar(h)"
          class="aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all text-center p-1"
          [class.border-violet-400]="habSeleccionada?.id===h.id" [class.bg-violet-50]="habSeleccionada?.id===h.id"
          [class.border-slate-200]="habSeleccionada?.id!==h.id" [class.bg-white]="habSeleccionada?.id!==h.id">
          <span class="text-[13px] font-extrabold leading-none text-slate-700">{{ h.numero }}</span>
          <span class="text-[8px] mt-0.5 opacity-60 text-slate-500 truncate max-w-full px-0.5">{{ h.huesped || h.tipo }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ── PANEL DER: Habitación seleccionada ── -->
  <div class="flex-1 min-w-0 flex flex-col gap-3">
    <div *ngIf="!habSeleccionada" class="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8">
      <div class="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-3xl mb-4">🛎️</div>
      <p class="text-sm font-bold text-slate-600 m-0">Selecciona una habitación</p>
      <p class="text-xs text-slate-400 m-0 mt-1">para cargarle consumo de {{ seccion }}</p>
    </div>

    <ng-container *ngIf="habSeleccionada as hab">
      <div class="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-800 m-0 truncate">Habitación {{ hab.numero }}{{ hab.huesped ? ' — ' + hab.huesped : '' }}</p>
          <p class="text-xs text-slate-400 m-0">Cuenta de {{ seccion }}: <span class="font-bold text-violet-600">\${{ totalSeccion() }}</span></p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100" *ngIf="consumosSeccion.length">
        <div class="px-5 pt-4 pb-2">
          <p class="text-xs font-bold text-slate-700 m-0">Cargado a esta habitación — {{ seccion }}</p>
        </div>
        <div *ngFor="let c of consumosSeccion" class="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-700 m-0 truncate">{{ c.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">\${{ c.precio_unitario }} c/u</p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button (click)="quitar(c)" title="Quitar una unidad"
              class="w-8 h-8 flex items-center justify-center rounded-lg border-0 bg-red-50 text-red-500 text-base font-bold cursor-pointer hover:bg-red-100 active:scale-95 transition-transform">−</button>
            <span class="text-sm font-bold text-slate-700 w-6 text-center">{{ c.cantidad }}</span>
            <button *ngIf="c.id_producto" (click)="incrementar(c)" [disabled]="productoSinStock(c.id_producto)"
              title="Agregar una unidad más"
              class="w-8 h-8 flex items-center justify-center rounded-lg border-0 bg-emerald-50 text-emerald-600 text-base font-bold cursor-pointer hover:bg-emerald-100 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed">+</button>
          </div>
          <p class="text-xs font-bold text-slate-700 m-0 w-16 text-right flex-shrink-0">\${{ c.precio_unitario * c.cantidad }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 p-4 flex-1 overflow-y-auto">
        <p class="text-xs font-bold text-slate-700 m-0 mb-3">Menú — {{ seccion }}</p>
        <input class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400 mb-3"
          [(ngModel)]="busqueda" placeholder="Buscar producto..." />

        <p *ngIf="!cargandoMenu && menu.length===0" class="text-center py-6 text-slate-400 text-xs">
          Sin productos en esta sección todavía. Cárgalos desde Inventario con la categoría "{{ seccion }}".
        </p>
        <div class="flex flex-col gap-1.5">
          <div *ngFor="let item of menu"
            class="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 transition-colors"
            [class.border-slate-100]="!sinStock(item)"
            [class.border-red-200]="sinStock(item)"
            [class.opacity-60]="sinStock(item)">
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold text-slate-600 m-0 truncate">{{ item.nombre }}</p>
              <p class="text-[10px] font-bold text-violet-600 m-0">\${{ item.precio }}</p>
              <p *ngIf="sinStock(item)" class="text-[9px] font-bold text-red-500 m-0 mt-0.5">⚠ Sin stock</p>
              <p *ngIf="!sinStock(item) && stockBajo(item)" class="text-[9px] font-bold text-amber-500 m-0 mt-0.5">⚠ Quedan {{ item.stock }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button (click)="cambiarCantidad(item, -1)" [disabled]="sinStock(item)"
                class="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">-</button>
              <span class="text-xs font-bold text-slate-700 w-5 text-center">{{ cantidadDe(item) }}</span>
              <button (click)="cambiarCantidad(item, 1)" [disabled]="sinStock(item)"
                class="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
            </div>
            <button (click)="agregar(item)" [disabled]="sinStock(item)"
              class="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer text-white hover:opacity-90 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style="background:#8b5cf6">{{ sinStock(item) ? 'Sin stock' : 'Agregar' }}</button>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>
  `,
})
export class PosTerminalHotelSeccionComponent implements OnInit, OnChanges {
  @Input() seccion = '';

  private notify = inject(NotifyService);
  private erpService = inject(ErpService);
  private cdr = inject(ChangeDetectorRef);
  private stockAlert = inject(StockAlertService);

  habitaciones: ErpHabitacion[] = [];
  habSeleccionada: ErpHabitacion | null = null;
  productosTodos: Producto[] = [];
  cargando = false;
  cargandoMenu = false;
  busqueda = '';
  private cantidades: Record<number, number> = {};

  ngOnInit() {
    this.cargando = true;
    this.erpService.habitaciones$.subscribe(habitaciones => {
      this.habitaciones = habitaciones.filter(h => h.estado === 'ocupada');
      if (this.habSeleccionada) {
        this.habSeleccionada = this.habitaciones.find(h => h.id === this.habSeleccionada!.id) ?? null;
      }
      this.cdr.detectChanges();
    });
    this.erpService.cargarHabitaciones().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });

    this.cargandoMenu = true;
    this.erpService.cargarInventario().subscribe({
      next: productos => {
        this.productosTodos = productos.filter(p => p.activo !== false);
        this.cargandoMenu = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoMenu = false; this.cdr.detectChanges(); },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['seccion'] && !changes['seccion'].firstChange) {
      this.habSeleccionada = null;
      this.busqueda = '';
    }
  }

  get productosSeccion(): Producto[] {
    return this.productosTodos.filter(p => p.categoria?.nombre === this.seccion);
  }

  get menu(): Producto[] {
    const busqueda = this.busqueda.trim().toLowerCase();
    if (!busqueda) return this.productosSeccion;
    return this.productosSeccion.filter(p => p.nombre.toLowerCase().includes(busqueda));
  }

  get consumosSeccion(): ErpHabitacionConsumo[] {
    return (this.habSeleccionada?.consumos ?? []).filter(c => c.seccion === this.seccion);
  }

  totalSeccion(): number {
    return this.consumosSeccion.reduce((s, c) => s + c.precio_unitario * c.cantidad, 0);
  }

  seleccionar(h: ErpHabitacion) {
    this.habSeleccionada = h;
  }

  cantidadDe(p: Producto): number {
    return this.cantidades[p.id_productos] ?? 1;
  }

  cambiarCantidad(p: Producto, delta: number) {
    const nueva = Math.max(1, this.cantidadDe(p) + delta);
    const max = this.stockAlert.disponible(p);
    this.cantidades[p.id_productos] = max === Infinity ? nueva : Math.min(nueva, Math.max(1, max));
  }

  sinStock(p: Producto): boolean {
    return this.stockAlert.sinStock(p);
  }

  stockBajo(p: Producto): boolean {
    return this.stockAlert.stockBajo(p);
  }

  productoSinStock(idProducto: number | null): boolean {
    if (!idProducto) return false;
    const producto = this.productosTodos.find(p => p.id_productos === idProducto);
    return !!producto && this.sinStock(producto);
  }

  agregar(producto: Producto) {
    if (!this.habSeleccionada) return;
    if (this.sinStock(producto)) {
      this.notify.error(`"${producto.nombre}" no tiene stock disponible`);
      return;
    }
    this.erpService.agregarConsumoHabitacion(this.habSeleccionada.id, { id_producto: producto.id_productos, cantidad: this.cantidadDe(producto) }).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        delete this.cantidades[producto.id_productos];
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el consumo'),
    });
  }

  quitar(consumo: ErpHabitacionConsumo) {
    if (!this.habSeleccionada) return;
    this.erpService.quitarConsumoHabitacion(this.habSeleccionada.id, consumo.id, 1).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo quitar el consumo'),
    });
  }

  incrementar(consumo: ErpHabitacionConsumo) {
    if (!this.habSeleccionada || !consumo.id_producto) return;
    if (this.productoSinStock(consumo.id_producto)) {
      this.notify.error(`"${consumo.nombre}" no tiene stock disponible`);
      return;
    }
    this.erpService.agregarConsumoHabitacion(this.habSeleccionada.id, { id_producto: consumo.id_producto, cantidad: 1 }).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el consumo'),
    });
  }
}
