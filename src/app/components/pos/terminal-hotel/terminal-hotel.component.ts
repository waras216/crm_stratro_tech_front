import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { HOTEL_AMENIDAD_CATEGORIAS, NichoService } from '../../../core/services/nicho.service';
import { ErpHabitacion, ErpPedido, Producto, PedidoPago } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-pos-terminal-hotel',
  standalone: false,
  animations: [modalLeave],
  template: `
<div class="flex flex-col lg:flex-row gap-4 lg:h-full page-enter">

  <!-- ── PANEL IZQ: Habitaciones ── -->
  <div class="w-full lg:w-72 lg:flex-shrink-0 flex flex-col gap-3">
    <!-- Leyenda -->
    <div class="bg-white rounded-2xl p-3 border border-slate-100 flex flex-wrap gap-2 items-center justify-between">
      <div class="flex flex-wrap gap-2">
        <span *ngFor="let e of estados" class="flex items-center gap-1.5 text-[10px] font-semibold" [ngClass]="e.text">
          <span class="w-2.5 h-2.5 rounded-full inline-block" [ngClass]="e.dot"></span>{{ e.label }}
        </span>
      </div>
      <button (click)="abrirNuevaHabitacion()"
        class="text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer text-white hover:opacity-90 flex-shrink-0"
        style="background:#f59e0b">+ Hab.</button>
    </div>
    <!-- Grid de habitaciones -->
    <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[38vh] lg:max-h-none overflow-y-auto p-3">
      <p *ngIf="cargandoHabitaciones" class="text-center py-8 text-slate-400 text-xs">Cargando...</p>
      <p *ngIf="!cargandoHabitaciones && habitaciones.length===0" class="text-center py-8 text-slate-400 text-xs">
        Sin habitaciones — agrega la primera con "+ Hab."
      </p>
      <div class="grid grid-cols-4 gap-2">
        <button *ngFor="let h of habitaciones"
          (click)="seleccionar(h)"
          class="aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all text-center p-1"
          [ngClass]="estadoClases(h)"
          [class.ring-2]="habSeleccionada?.id === h.id"
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

    <ng-container *ngIf="habSeleccionada as hab">
      <!-- Header habitación -->
      <div class="bg-white rounded-2xl p-4 border border-slate-100">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
              [ngClass]="hab.estado === 'libre' ? 'bg-emerald-400' : hab.estado === 'ocupada' ? 'bg-amber-400' : hab.estado === 'checkout' ? 'bg-blue-400' : 'bg-slate-400'">
              {{ hab.numero }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-800 m-0 truncate">Habitación {{ hab.numero }} — {{ hab.tipo }}</p>
              <p class="text-xs text-slate-400 m-0">Piso {{ hab.piso }}
                <ng-container *ngIf="hab.precio !== null">· \${{ hab.precio }}/noche</ng-container>
                <span *ngIf="hab.precio === null" class="text-amber-600 font-semibold">· Sin precio definido</span>
              </p>
            </div>
          </div>
          <span class="text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0"
            [class.bg-emerald-100]="hab.estado==='libre'" [class.text-emerald-600]="hab.estado==='libre'"
            [class.bg-amber-100]="hab.estado==='ocupada'" [class.text-amber-600]="hab.estado==='ocupada'"
            [class.bg-blue-100]="hab.estado==='checkout'" [class.text-blue-600]="hab.estado==='checkout'"
            [class.bg-slate-100]="hab.estado==='mantenimiento'" [class.text-slate-500]="hab.estado==='mantenimiento'">
            {{ hab.estado | titlecase }}
          </span>
        </div>
        <!-- Huésped info -->
        <div *ngIf="hab.huesped" class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p class="text-[10px] text-slate-400 m-0">Huésped</p>
            <p class="text-xs font-semibold text-slate-700 m-0 mt-0.5">{{ hab.huesped }}</p>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 m-0">Check-in</p>
            <p class="text-xs font-semibold text-slate-700 m-0 mt-0.5">{{ hab.check_in }}</p>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 m-0">Check-out</p>
            <p class="text-xs font-semibold text-slate-700 m-0 mt-0.5">{{ hab.check_out }}</p>
          </div>
        </div>
        <!-- Acciones -->
        <div class="mt-3 flex gap-2">
          <button *ngIf="hab.estado==='libre'" (click)="checkInDialogOpen=true"
            class="flex-1 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer text-white hover:opacity-90 transition-all"
            style="background:#f59e0b">Check-in</button>
          <button *ngIf="hab.estado==='ocupada'" (click)="toggleSalida(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-blue-200 cursor-pointer text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
            Marcar salida
          </button>
          <button *ngIf="hab.estado==='checkout'" (click)="toggleSalida(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-500 bg-transparent hover:bg-slate-50 transition-all">
            Volver a ocupada
          </button>
          <button *ngIf="hab.estado==='ocupada' || hab.estado==='checkout'" (click)="checkOut()" [disabled]="cobrando"
            class="flex-1 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer text-white hover:opacity-90 transition-all disabled:opacity-60"
            style="background:#3b82f6">{{ cobrando ? 'Procesando...' : 'Check-out' }}</button>
          <button *ngIf="hab.estado==='ocupada'" (click)="mostrarRoomService=!mostrarRoomService"
            class="flex-1 py-2 text-xs font-bold rounded-xl border border-amber-300 cursor-pointer text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all">
            Room Service
          </button>
          <button *ngIf="hab.estado==='libre'" (click)="toggleMantenimiento(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-500 bg-transparent hover:bg-slate-50 transition-all">
            Mantenimiento
          </button>
          <button *ngIf="hab.estado==='mantenimiento'" (click)="toggleMantenimiento(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-500 bg-transparent hover:bg-slate-50 transition-all">
            Reactivar
          </button>
        </div>
      </div>

      <!-- Consumos -->
      <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
        <div *ngIf="hab.estado==='ocupada' || hab.estado==='checkout'" class="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 bg-amber-50/50">
          <p class="text-xs text-slate-700 m-0">Hospedaje — {{ hab.noches }} noche(s) × \${{ hab.precio ?? 0 }}</p>
          <p class="text-xs font-bold text-slate-700 m-0">\${{ totalHospedaje(hab) }}</p>
        </div>
        <div class="px-5 pt-4 pb-2 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Consumos Room Service</p>
          <span class="text-xs font-bold text-amber-600">Total a cobrar: \${{ totalConsumos(hab) + totalHospedaje(hab) }}</span>
        </div>
        <div *ngIf="hab.consumos.length === 0" class="text-center py-8 text-slate-400 text-xs">Sin consumos registrados</div>
        <div *ngFor="let c of hab.consumos" class="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-0">
          <p class="text-xs text-slate-700 m-0">{{ c.nombre }} × {{ c.cantidad }}</p>
          <p class="text-xs font-bold text-slate-700 m-0">\${{ c.precio_unitario * c.cantidad }}</p>
        </div>
      </div>

      <!-- Room Service selector -->
      <div *ngIf="mostrarRoomService && hab.estado==='ocupada'"
        class="bg-white rounded-2xl border border-amber-200 p-4">
        <p class="text-xs font-bold text-slate-700 m-0 mb-3">Agregar Room Service</p>

        <div class="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-bold text-amber-700 uppercase tracking-wide m-0">Cuenta de la habitación</p>
            <p class="text-xs font-extrabold text-amber-700 m-0">\${{ totalConsumos(hab) + totalHospedaje(hab) }}</p>
          </div>
          <p class="text-[10px] text-amber-600 m-0 mt-0.5">Hospedaje: \${{ totalHospedaje(hab) }} + Consumos: \${{ totalConsumos(hab) }}</p>
          <div *ngIf="hab.consumos.length" class="flex flex-col gap-0.5 mt-2 pt-2 border-t border-amber-200/60">
            <div *ngFor="let c of hab.consumos" class="flex items-center justify-between text-[11px] text-amber-800">
              <span>{{ c.nombre }} × {{ c.cantidad }}</span>
              <span class="font-semibold">\${{ c.precio_unitario * c.cantidad }}</span>
            </div>
          </div>
        </div>

        <div class="relative mb-3">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input class="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-400"
            [(ngModel)]="busquedaRoomService" placeholder="Buscar producto..." />
        </div>

        <div *ngIf="!busquedaRoomService && categoriasRoomService.length" class="flex flex-wrap gap-1.5 mb-3">
          <button *ngFor="let cat of categoriasRoomService" (click)="categoriaActivaRoomService=cat"
            class="text-[10px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer transition-all"
            [class.text-white]="categoriaActivaRoomService===cat" [class.bg-amber-500]="categoriaActivaRoomService===cat"
            [class.bg-slate-100]="categoriaActivaRoomService!==cat" [class.text-slate-600]="categoriaActivaRoomService!==cat">
            {{ cat }}
          </button>
        </div>

        <p *ngIf="cargandoMenu" class="text-center py-4 text-slate-400 text-xs">Cargando...</p>
        <div *ngIf="!cargandoMenu && menuRoomService.length===0" class="text-center py-4 text-slate-400 text-xs">Sin productos que coincidan</div>
        <div class="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          <div *ngFor="let item of menuRoomService"
            class="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50">
            <span class="text-lg flex-shrink-0">🍽️</span>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold text-slate-600 m-0 truncate">{{ item.nombre }}</p>
              <p class="text-[10px] font-bold text-amber-600 m-0">\${{ item.precio }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button (click)="cambiarCantidadProducto(item, -1)"
                class="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50">-</button>
              <span class="text-xs font-bold text-slate-700 w-5 text-center">{{ cantidadDe(item) }}</span>
              <button (click)="cambiarCantidadProducto(item, 1)"
                class="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50">+</button>
            </div>
            <button (click)="agregarConsumo(item)"
              class="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer text-white hover:opacity-90 flex-shrink-0"
              style="background:#f59e0b">Agregar</button>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>

<!-- Modal: nueva habitación -->
<div *ngIf="habDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="habDialogOpen=false"></div>
<div *ngIf="habDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Nueva Habitación</h3>
  <div class="flex flex-col gap-3">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="habForm.numero" placeholder="Número" />
      <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="habForm.tipo">
        <option *ngFor="let t of nicho.hotelTiposHabitacion" [value]="t">{{ t }}</option>
      </select>
      <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="habForm.piso" placeholder="Piso" />
    </div>
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
      <input class="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="0" step="0.01" [(ngModel)]="habForm.precio" placeholder="Precio por noche" />
    </div>
    <p *ngIf="habError" class="text-xs text-red-600 m-0">{{ habError }}</p>
    <button (click)="crearHabitacion()" [disabled]="habSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#f59e0b">{{ habSaving ? 'Guardando...' : 'Crear Habitación' }}</button>
  </div>
</div>

<!-- Modal: check-in -->
<div *ngIf="checkInDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="checkInDialogOpen=false"></div>
<div *ngIf="checkInDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Check-in — Habitación {{ habSeleccionada?.numero }}</h3>
  <div class="flex flex-col gap-3">
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="checkInForm.huesped" placeholder="Nombre del huésped" />
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="checkInForm.noches" placeholder="Noches" />
    <p *ngIf="habSeleccionada?.precio !== null" class="text-xs text-slate-500 m-0">Estimado: <span class="font-semibold text-slate-700">\${{ (habSeleccionada!.precio ?? 0) * (checkInForm.noches || 0) }}</span> ({{ checkInForm.noches || 0 }} noche(s) × \${{ habSeleccionada?.precio }})</p>
    <p *ngIf="habSeleccionada?.precio === null" class="text-xs text-amber-600 m-0">Esta habitación no tiene precio definido — se cobrará $0 por hospedaje. Edítala desde el panel de ERP.</p>
    <p *ngIf="checkInError" class="text-xs text-red-600 m-0">{{ checkInError }}</p>
    <button (click)="confirmarCheckIn()" [disabled]="checkInSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#f59e0b">{{ checkInSaving ? 'Guardando...' : 'Confirmar Check-in' }}</button>
  </div>
</div>

<app-pos-ticket [pedido]="lastPedido" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
<app-pos-pago-modal [visible]="pagoModalOpen" [total]="totalPago"
  (confirmar)="confirmarPago($event)" (cancelado)="pagoModalOpen=false"></app-pos-pago-modal>
  `,
})
export class PosTerminalHotelComponent implements OnInit {
  private notify = inject(NotifyService);
  private erpService = inject(ErpService);
  private crmService = inject(CrmService);
  private cdr = inject(ChangeDetectorRef);
  nicho = inject(NichoService);

  habitaciones: ErpHabitacion[] = [];
  habSeleccionada: ErpHabitacion | null = null;
  mostrarRoomService = false;
  cargandoHabitaciones = false;
  cargandoMenu = false;
  cobrando = false;

  habDialogOpen = false;
  habForm = { numero: null as number | null, tipo: '', precio: null as number | null, piso: 1 };
  habError = '';
  habSaving = false;

  checkInDialogOpen = false;
  checkInForm = { huesped: '', noches: 1 };
  checkInError = '';
  checkInSaving = false;

  ticketOpen = false;
  pagoModalOpen = false;
  totalPago = 0;
  private habPendiente: ErpHabitacion | null = null;
  lastPedido: ErpPedido | null = null;

  productos: Producto[] = [];

  estados = [
    { label: 'Libre', dot: 'bg-emerald-400', text: 'text-emerald-600' },
    { label: 'Ocupada', dot: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Checkout hoy', dot: 'bg-blue-400', text: 'text-blue-600' },
    { label: 'Mantenimiento', dot: 'bg-slate-400', text: 'text-slate-500' },
  ];

  ngOnInit() {
    this.cargandoHabitaciones = true;
    this.erpService.habitaciones$.subscribe(habitaciones => {
      this.habitaciones = habitaciones;
      if (this.habSeleccionada) {
        this.habSeleccionada = habitaciones.find(h => h.id === this.habSeleccionada!.id) ?? null;
      }
      this.cdr.detectChanges();
    });
    this.erpService.cargarHabitaciones().subscribe({
      next: () => { this.cargandoHabitaciones = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoHabitaciones = false; this.cdr.detectChanges(); },
    });

    this.cargandoMenu = true;
    this.erpService.cargarInventario().subscribe({
      next: productos => {
        this.productos = productos.filter(p => p.activo !== false);
        this.categoriaActivaRoomService = this.categoriasRoomService[0] ?? '';
        this.cargandoMenu = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoMenu = false; this.cdr.detectChanges(); },
    });
  }

  categoriaActivaRoomService = '';
  busquedaRoomService = '';
  private cantidadesRoomService: Record<number, number> = {};

  cantidadDe(producto: Producto): number {
    return this.cantidadesRoomService[producto.id_productos] ?? 1;
  }

  cambiarCantidadProducto(producto: Producto, delta: number) {
    this.cantidadesRoomService[producto.id_productos] = Math.max(1, this.cantidadDe(producto) + delta);
  }

  /**
   * Universo de productos que se pueden cargar a la habitación: la categoría dedicada "Room
   * Service" más las categorías de amenidad (Bar, Spa, etc.) que el hotel configuró en el
   * onboarding. Si el tenant no tiene nada categorizado así, cae a mostrar todo el catálogo.
   */
  private get baseRoomService(): Producto[] {
    const nombresAmenidad = this.nicho.hotelAmenidades
      .map(a => HOTEL_AMENIDAD_CATEGORIAS[a])
      .filter((n): n is string => !!n);
    const base = this.productos.filter(p => p.categoria?.nombre === 'Room Service' || nombresAmenidad.includes(p.categoria?.nombre ?? ''));
    return base.length > 0 ? base : this.productos;
  }

  get categoriasRoomService(): string[] {
    return Array.from(new Set(this.baseRoomService.map(p => p.categoria?.nombre ?? 'Otros')));
  }

  get menuRoomService(): Producto[] {
    const busqueda = this.busquedaRoomService.trim().toLowerCase();
    if (busqueda) {
      return this.baseRoomService.filter(p => p.nombre.toLowerCase().includes(busqueda));
    }
    return this.baseRoomService.filter(p => (p.categoria?.nombre ?? 'Otros') === this.categoriaActivaRoomService);
  }

  totalConsumos(h: ErpHabitacion): number {
    return h.consumos.reduce((s, c) => s + c.precio_unitario * c.cantidad, 0);
  }

  estadoClases(h: ErpHabitacion): string {
    const map: Record<ErpHabitacion['estado'], string> = {
      libre: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400',
      ocupada: 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400',
      checkout: 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400',
      mantenimiento: 'bg-slate-100 border-slate-200 text-slate-400',
    };
    return map[h.estado];
  }

  seleccionar(h: ErpHabitacion) {
    this.habSeleccionada = h;
    this.mostrarRoomService = false;
  }

  abrirNuevaHabitacion() {
    this.habForm = { numero: null, tipo: this.nicho.hotelTiposHabitacion[0], precio: null, piso: 1 };
    this.habError = '';
    this.habDialogOpen = true;
  }

  crearHabitacion() {
    if (this.habSaving || !this.habForm.numero) { this.habError = 'El número de habitación es obligatorio.'; return; }
    if (this.habForm.precio === null || this.habForm.precio < 0) { this.habError = 'Indica el precio por noche.'; return; }
    this.habSaving = true;
    this.habError = '';
    this.erpService.crearHabitacion({ numero: this.habForm.numero, tipo: this.habForm.tipo, precio: this.habForm.precio, piso: this.habForm.piso || 1 }).subscribe({
      next: () => {
        this.habSaving = false;
        this.habDialogOpen = false;
        this.habForm = { numero: null, tipo: this.nicho.hotelTiposHabitacion[0], precio: null, piso: 1 };
        this.cdr.detectChanges();
      },
      error: err => {
        this.habSaving = false;
        this.habError = err?.error?.message || 'No se pudo crear la habitación';
        this.cdr.detectChanges();
      },
    });
  }

  confirmarCheckIn() {
    if (!this.habSeleccionada || this.checkInSaving) return;
    if (!this.checkInForm.huesped.trim()) { this.checkInError = 'El nombre del huésped es obligatorio.'; return; }
    this.checkInSaving = true;
    this.checkInError = '';
    this.erpService.checkInHabitacion(this.habSeleccionada.id, this.checkInForm.huesped, this.checkInForm.noches || 1).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        this.checkInSaving = false;
        this.checkInDialogOpen = false;
        this.checkInForm = { huesped: '', noches: 1 };
        this.cdr.detectChanges();
      },
      error: err => {
        this.checkInSaving = false;
        this.checkInError = err?.error?.message || 'No se pudo hacer el check-in';
        this.cdr.detectChanges();
      },
    });
  }

  agregarConsumo(producto: Producto) {
    if (!this.habSeleccionada) return;
    this.erpService.agregarConsumoHabitacion(this.habSeleccionada.id, { id_producto: producto.id_productos, cantidad: this.cantidadDe(producto) }).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        delete this.cantidadesRoomService[producto.id_productos];
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el consumo'),
    });
  }

  toggleMantenimiento(h: ErpHabitacion) {
    const estado = h.estado === 'mantenimiento' ? 'libre' : 'mantenimiento';
    this.erpService.marcarMantenimiento(h.id, estado).subscribe(actualizada => { this.habSeleccionada = actualizada; this.cdr.detectChanges(); });
  }

  toggleSalida(h: ErpHabitacion) {
    const estado = h.estado === 'checkout' ? 'ocupada' : 'checkout';
    this.erpService.marcarSalidaHabitacion(h.id, estado).subscribe(actualizada => { this.habSeleccionada = actualizada; this.cdr.detectChanges(); });
  }

  totalHospedaje(h: ErpHabitacion): number {
    return (h.precio ?? 0) * (h.noches ?? 0);
  }

  async checkOut() {
    if (!this.habSeleccionada || this.cobrando) return;
    const hab = this.habSeleccionada;
    const total = this.totalConsumos(hab) + this.totalHospedaje(hab);

    const ok = await this.notify.confirm(`¿Confirmar check-out de la Habitación ${hab.numero}? Total a cobrar: $${total}`, { confirmText: 'Check-out' });
    if (!ok) return;

    if (total === 0) {
      this.ejecutarCheckOut(hab, undefined, []);
      return;
    }

    this.habPendiente = hab;
    this.totalPago = total;
    this.pagoModalOpen = true;
  }

  confirmarPago(pagos: PedidoPago[]) {
    this.pagoModalOpen = false;
    const hab = this.habPendiente;
    if (!hab) return;

    this.crmService.obtenerClientePorNombre(hab.huesped || '').subscribe(idCliente => {
      this.ejecutarCheckOut(hab, idCliente, pagos);
    });
  }

  private ejecutarCheckOut(hab: ErpHabitacion, idCliente: number | undefined, pagos: PedidoPago[]) {
    this.cobrando = true;

    this.erpService.checkOutHabitacion(hab.id, idCliente, pagos).subscribe({
      next: res => {
        if (res.pedido) {
          this.lastPedido = res.pedido;
          this.ticketOpen = true;
        } else {
          this.notify.success(`Huésped: ${hab.huesped}`, 'Check-out completado');
        }
        this.habSeleccionada = null;
        this.habPendiente = null;
        this.cobrando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo completar el check-out');
        this.cobrando = false;
        this.cdr.detectChanges();
      },
    });
  }
}
