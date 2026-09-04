import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ErpMesa, ErpComandaItem, ErpHabitacion, Producto, PedidoPago } from '../../../models/erp.models';
import { ItemCarrito } from '../carrito/carrito.component';
import { modalLeave } from '../../shared/animations';

/**
 * Terminal de una sección del hotel con clientela de mostrador (Restaurante, Bar): a diferencia
 * de Spa/Piscina/Estacionamiento/Eventos (que cargan consumos directo a una habitación, ver
 * PosTerminalHotelSeccionComponent), estas secciones también reciben gente que no es huésped —
 * por eso trabajan por mesa/comanda igual que el terminal de restaurante independiente, y al
 * cerrar la cuenta el mesero elige "Cobrar aquí" (cliente de calle) o "Cargar a habitación"
 * (huésped, se liquida junto con el hospedaje en el check-out). Genérico sobre `seccion` en vez
 * de tener una copia por amenidad.
 */
@Component({
  selector: 'app-pos-terminal-hotel-mesas',
  standalone: false,
  animations: [modalLeave],
  template: `
<div class="flex flex-col lg:flex-row gap-4 lg:h-full page-enter">

  <!-- ── PANEL IZQ: Mesas ── -->
  <div class="w-full lg:w-64 lg:flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl p-3 border border-slate-100 flex flex-wrap gap-2 items-center justify-between">
      <div class="flex flex-wrap gap-2">
        <span *ngFor="let e of estados" class="flex items-center gap-1.5 text-[10px] font-semibold" [ngClass]="e.text">
          <span class="w-2.5 h-2.5 rounded-full inline-block" [ngClass]="e.dot"></span>{{ e.label }}
        </span>
      </div>
      <button (click)="mesaDialogOpen=true"
        class="text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer text-white hover:opacity-90 flex-shrink-0"
        style="background:#8b5cf6">+ Mesa</button>
    </div>
    <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[32vh] lg:max-h-none overflow-y-auto p-3">
      <p *ngIf="cargandoMesas" class="text-center py-8 text-slate-400 text-xs">Cargando...</p>
      <p *ngIf="!cargandoMesas && mesas.length===0" class="text-center py-8 text-slate-400 text-xs">
        Sin mesas — agrega la primera con "+ Mesa"
      </p>
      <div class="grid grid-cols-3 gap-2">
        <button *ngFor="let m of mesas"
          (click)="seleccionar(m)"
          class="aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all"
          [ngClass]="mesaClases(m)">
          <span class="text-[13px] font-extrabold leading-none">{{ m.numero }}</span>
          <span class="text-[8px] opacity-60 mt-0.5">{{ m.capacidad }}p</span>
          <span *ngIf="totalMesa(m) > 0" class="text-[8px] font-bold mt-0.5"
            [class.text-red-500]="m.estado==='cuenta'" [class.text-violet-600]="m.estado==='ocupada'">
            \${{ totalMesa(m) }}
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- ── PANEL CENTRO: Comanda ── -->
  <div class="flex-1 min-w-0 flex flex-col gap-3">
    <div *ngIf="!mesaSeleccionada" class="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8">
      <div class="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-3xl mb-4">{{ icono }}</div>
      <p class="text-sm font-bold text-slate-600 m-0">Selecciona una mesa</p>
      <p class="text-xs text-slate-400 m-0 mt-1">para ver o crear su comanda</p>
    </div>

    <ng-container *ngIf="mesaSeleccionada as mesa">
      <div class="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center gap-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
          [class.bg-emerald-400]="mesa.estado==='libre'"
          [class.bg-violet-400]="mesa.estado==='ocupada'"
          [class.bg-amber-400]="mesa.estado==='cuenta'">
          {{ mesa.numero }}
        </div>
        <div class="flex-1 min-w-[8rem]">
          <p class="text-sm font-bold text-slate-800 m-0">Mesa {{ mesa.numero }} — {{ mesa.capacidad }} personas</p>
          <p class="text-xs text-slate-400 m-0" *ngIf="mesa.mesero">Mesero: {{ mesa.mesero }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button *ngIf="mesa.estado==='libre'" (click)="abrirMesa()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#8b5cf6">Abrir Mesa</button>
          <button *ngIf="mesa.estado==='ocupada' && comandaItems(mesa).length>0" (click)="enviarACocina()"
            class="text-xs font-semibold px-4 py-2 rounded-xl border border-violet-200 cursor-pointer text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all">
            Enviar a {{ destinoPreparacion }}
          </button>
          <button *ngIf="mesa.estado==='ocupada'" (click)="pedirCuenta()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#f59e0b">Pedir Cuenta</button>
          <ng-container *ngIf="mesa.estado==='cuenta'">
            <button (click)="cerrarMesa()" [disabled]="cobrando"
              class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90 disabled:opacity-60"
              style="background:#10b981">{{ cobrando ? 'Cobrando...' : 'Cobrar aquí $' + totalMesa(mesa) }}</button>
            <button (click)="abrirCargarHabitacion()" [disabled]="cargandoTransferencia"
              class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90 disabled:opacity-60"
              style="background:#6366f1">🛎️ Cargar a habitación</button>
          </ng-container>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[40vh] lg:max-h-none overflow-y-auto pb-fab">
        <div class="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Comanda Activa</p>
          <span class="text-xs font-bold text-violet-600">Total: \${{ totalMesa(mesa) }}</span>
        </div>
        <div *ngIf="comandaItems(mesa).length === 0" class="text-center py-10 text-slate-400 text-xs">
          Mesa vacía — agrega items del menú
        </div>
        <div *ngFor="let item of comandaItems(mesa); let i = index"
          class="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 card-enter"
          [style.animation-delay]="(i*0.04)+'s'">
          <span class="text-xl flex-shrink-0">{{ icono }}</span>
          <div class="flex-1">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ item.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">\${{ item.precio_unitario }} c/u</p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="cambiarCantidad(item,-1)"
              class="w-6 h-6 rounded-lg bg-slate-100 border-0 cursor-pointer text-slate-600 font-bold hover:bg-slate-200 text-xs">−</button>
            <span class="text-xs font-bold text-slate-700 w-4 text-center">{{ item.cantidad }}</span>
            <button (click)="cambiarCantidad(item,1)" [disabled]="productoSinStock(item.id_producto)"
              title="Agregar una unidad más"
              class="w-6 h-6 rounded-lg bg-emerald-50 border-0 cursor-pointer text-emerald-600 font-bold hover:bg-emerald-100 text-xs disabled:opacity-40 disabled:cursor-not-allowed">+</button>
          </div>
          <p class="text-xs font-bold text-slate-800 m-0 w-14 text-right">\${{ item.precio_unitario * item.cantidad }}</p>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- ── PANEL DER: Menú ── -->
  <div class="w-full lg:w-64 lg:flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[40vh] lg:max-h-none overflow-y-auto pb-fab">
      <div class="px-4 pt-4 pb-2">
        <p class="text-xs font-bold text-slate-700 m-0 mb-2">Menú — {{ seccion }}</p>
        <input class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400"
          [(ngModel)]="busqueda" placeholder="Buscar producto..." />
      </div>
      <p *ngIf="cargandoMenu" class="text-center py-8 text-slate-400 text-xs">Cargando...</p>
      <p *ngIf="!cargandoMenu && menu.length===0" class="text-center py-6 text-slate-400 text-xs px-4">
        Sin productos en esta sección todavía. Cárgalos desde Inventario con la categoría "{{ seccion }}".
      </p>
      <div class="px-3 pb-3 flex flex-col gap-1.5">
        <button *ngFor="let item of menu"
          (click)="agregarItem(item)"
          [disabled]="sinStock(item) || !mesaSeleccionada || mesaSeleccionada.estado==='libre'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left w-full"
          [class.border-slate-100]="!sinStock(item)"
          [class.border-red-200]="sinStock(item)"
          [class.hover:bg-violet-50]="!sinStock(item) && mesaSeleccionada && mesaSeleccionada.estado!=='libre'"
          [class.hover:border-violet-200]="!sinStock(item) && mesaSeleccionada && mesaSeleccionada.estado!=='libre'"
          [class.cursor-pointer]="!sinStock(item) && mesaSeleccionada && mesaSeleccionada.estado!=='libre'"
          [class.cursor-not-allowed]="sinStock(item) || !mesaSeleccionada || mesaSeleccionada.estado==='libre'"
          [class.opacity-50]="sinStock(item) || !mesaSeleccionada || mesaSeleccionada.estado==='libre'"
          style="background:transparent">
          <span class="text-lg flex-shrink-0">{{ icono }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-semibold text-slate-700 m-0 truncate">{{ item.nombre }}</p>
            <p *ngIf="sinStock(item)" class="text-[9px] font-bold text-red-500 m-0 mt-0.5">⚠ Sin stock</p>
            <p *ngIf="!sinStock(item) && stockBajo(item)" class="text-[9px] font-bold text-amber-500 m-0 mt-0.5">⚠ Quedan {{ item.stock }}</p>
          </div>
          <span class="text-[11px] font-bold text-violet-600 flex-shrink-0">\${{ item.precio }}</span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Modal: nueva mesa -->
<div *ngIf="mesaDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="mesaDialogOpen=false"></div>
<div *ngIf="mesaDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Nueva Mesa</h3>
  <div class="flex flex-col gap-3">
    <div class="grid grid-cols-2 gap-3">
      <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="mesaForm.numero" placeholder="Número" />
      <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="mesaForm.capacidad" placeholder="Capacidad" />
    </div>
    <p *ngIf="mesaError" class="text-xs text-red-600 m-0">{{ mesaError }}</p>
    <button (click)="crearMesa()" [disabled]="mesaSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#8b5cf6">{{ mesaSaving ? 'Guardando...' : 'Crear Mesa' }}</button>
  </div>
</div>

<!-- Modal: cargar a habitación -->
<div *ngIf="habitacionDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="habitacionDialogOpen=false"></div>
<div *ngIf="habitacionDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-1 text-lg font-semibold">Cargar a Habitación</h3>
  <p class="text-xs text-slate-400 m-0 mb-4">La cuenta de \${{ mesaSeleccionada ? totalMesa(mesaSeleccionada) : 0 }} se sumará a los consumos de la habitación — se cobra junto con el hospedaje al hacer check-out.</p>
  <p *ngIf="!habitacionesOcupadas.length" class="text-center py-6 text-slate-400 text-xs">No hay habitaciones ocupadas ahora mismo</p>
  <div class="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
    <button *ngFor="let h of habitacionesOcupadas" (click)="confirmarCargarHabitacion(h)" [disabled]="cargandoTransferencia"
      class="aspect-square rounded-xl flex flex-col items-center justify-center border-2 border-indigo-200 bg-indigo-50 text-indigo-700 cursor-pointer hover:border-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
      <span class="text-[13px] font-extrabold leading-none">{{ h.numero }}</span>
      <span class="text-[8px] mt-0.5 opacity-60 truncate max-w-full px-0.5">{{ h.huesped || h.tipo }}</span>
    </button>
  </div>
</div>

<app-pos-ticket [items]="lastTicket" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
<app-pos-pago-modal [visible]="pagoModalOpen" [total]="totalPago"
  (confirmar)="confirmarPago($event)" (cancelado)="pagoModalOpen=false"></app-pos-pago-modal>
  `,
})
export class PosTerminalHotelMesasComponent implements OnInit, OnChanges {
  @Input() seccion = 'Restaurante';

  private static readonly ICONOS: Record<string, string> = { Restaurante: '🍽️', Bar: '🍸' };

  get icono(): string { return PosTerminalHotelMesasComponent.ICONOS[this.seccion] || '🍽️'; }
  get destinoPreparacion(): string { return this.seccion === 'Bar' ? 'Barra' : 'Cocina'; }

  private notify = inject(NotifyService);
  private erpService = inject(ErpService);
  private crmService = inject(CrmService);
  private cdr = inject(ChangeDetectorRef);
  private stockAlert = inject(StockAlertService);

  mesas: ErpMesa[] = [];
  mesaSeleccionada: ErpMesa | null = null;
  cargandoMesas = false;
  cobrando = false;

  productosTodos: Producto[] = [];
  cargandoMenu = false;
  busqueda = '';

  habitaciones: ErpHabitacion[] = [];
  habitacionDialogOpen = false;
  cargandoTransferencia = false;

  mesaDialogOpen = false;
  mesaForm = { numero: null as number | null, capacidad: 4 };
  mesaError = '';
  mesaSaving = false;

  ticketOpen = false;
  lastTicket: ItemCarrito[] = [];
  pagoModalOpen = false;
  totalPago = 0;
  private mesaPendiente: ErpMesa | null = null;
  private itemsTicketPendiente: ItemCarrito[] = [];

  estados = [
    { label: 'Libre',   dot: 'bg-emerald-400', text: 'text-emerald-600' },
    { label: 'Ocupada', dot: 'bg-violet-400',  text: 'text-violet-600' },
    { label: 'Cuenta',  dot: 'bg-amber-400',   text: 'text-amber-600' },
  ];

  ngOnInit() {
    this.cargandoMesas = true;
    this.erpService.mesas$.subscribe(mesas => {
      this.mesas = mesas;
      if (this.mesaSeleccionada) {
        this.mesaSeleccionada = mesas.find(m => m.id === this.mesaSeleccionada!.id) ?? null;
      }
      this.cdr.detectChanges();
    });
    this.erpService.cargarMesas().subscribe({
      next: () => { this.cargandoMesas = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoMesas = false; this.cdr.detectChanges(); },
    });

    this.erpService.habitaciones$.subscribe(habitaciones => {
      this.habitaciones = habitaciones;
      this.cdr.detectChanges();
    });
    this.erpService.cargarHabitaciones().subscribe();

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

  get habitacionesOcupadas(): ErpHabitacion[] {
    return this.habitaciones.filter(h => h.estado === 'ocupada');
  }

  comandaItems(m: ErpMesa): ErpComandaItem[] {
    return m.comanda_activa?.items ?? [];
  }

  totalMesa(m: ErpMesa): number {
    return m.comanda_activa?.total ?? 0;
  }

  mesaClases(m: ErpMesa): string {
    const sel = this.mesaSeleccionada?.id === m.id;
    const ring = sel ? ' ring-2 ring-offset-1 ring-violet-400' : '';
    const map: Record<ErpMesa['estado'], string> = {
      libre:     'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400',
      ocupada:   'bg-violet-50 border-violet-200 text-violet-700 hover:border-violet-400',
      cuenta:    'bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-400',
      reservada: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:border-indigo-400',
    };
    return map[m.estado] + ring;
  }

  seleccionar(m: ErpMesa) { this.mesaSeleccionada = m; }

  crearMesa() {
    if (this.mesaSaving || !this.mesaForm.numero) { this.mesaError = 'El número de mesa es obligatorio.'; return; }
    this.mesaSaving = true;
    this.mesaError = '';
    this.erpService.crearMesa({ numero: this.mesaForm.numero, capacidad: this.mesaForm.capacidad || 2 }).subscribe({
      next: () => {
        this.mesaSaving = false;
        this.mesaDialogOpen = false;
        this.mesaForm = { numero: null, capacidad: 4 };
        this.cdr.detectChanges();
      },
      error: err => {
        this.mesaSaving = false;
        this.mesaError = err?.error?.message || 'No se pudo crear la mesa';
        this.cdr.detectChanges();
      },
    });
  }

  abrirMesa() {
    if (!this.mesaSeleccionada) return;
    this.erpService.abrirMesa(this.mesaSeleccionada.id).subscribe({
      next: actualizada => { this.mesaSeleccionada = actualizada; this.cdr.detectChanges(); },
      error: () => this.notify.error('No se pudo abrir la mesa'),
    });
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

  agregarItem(producto: Producto) {
    if (this.sinStock(producto)) {
      this.notify.error(`"${producto.nombre}" no tiene stock disponible`);
      return;
    }
    if (!this.mesaSeleccionada || this.mesaSeleccionada.estado === 'libre') return;
    this.erpService.agregarItemMesa(this.mesaSeleccionada.id, { id_producto: producto.id_productos }).subscribe({
      next: actualizada => { this.mesaSeleccionada = actualizada; this.cdr.detectChanges(); },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el producto'),
    });
  }

  cambiarCantidad(item: ErpComandaItem, delta: number) {
    if (!this.mesaSeleccionada) return;
    if (delta > 0 && this.productoSinStock(item.id_producto)) {
      this.notify.error(`"${item.nombre}" no tiene stock disponible`);
      return;
    }
    this.erpService.actualizarItemMesa(this.mesaSeleccionada.id, item.id, item.cantidad + delta).subscribe({
      next: actualizada => { this.mesaSeleccionada = actualizada; this.cdr.detectChanges(); },
    });
  }

  pedirCuenta() {
    if (!this.mesaSeleccionada) return;
    this.erpService.pedirCuenta(this.mesaSeleccionada.id).subscribe(actualizada => { this.mesaSeleccionada = actualizada; this.cdr.detectChanges(); });
  }

  enviarACocina() {
    if (!this.mesaSeleccionada) return;
    this.erpService.enviarCocina(this.mesaSeleccionada.id).subscribe({
      next: actualizada => {
        this.mesaSeleccionada = actualizada;
        this.notify.success(`Mesa ${actualizada.numero} — ${this.comandaItems(actualizada).length} items`, 'Comanda enviada a cocina');
        this.cdr.detectChanges();
      },
    });
  }

  async cerrarMesa() {
    if (!this.mesaSeleccionada || this.cobrando) return;
    const mesa = this.mesaSeleccionada;
    const total = this.totalMesa(mesa);

    const ok = await this.notify.confirm(`¿Confirmar cobro de $${total} de la Mesa ${mesa.numero}?`, { confirmText: 'Cobrar' });
    if (!ok) return;

    const itemsTicket = this.comandaItems(mesa)
      .filter(item => item.producto)
      .map(item => ({ producto: item.producto!, cantidad: item.cantidad }));

    this.mesaPendiente = mesa;
    this.itemsTicketPendiente = itemsTicket;
    this.totalPago = total;
    this.pagoModalOpen = true;
  }

  confirmarPago(pagos: PedidoPago[]) {
    this.pagoModalOpen = false;
    const mesa = this.mesaPendiente;
    if (!mesa) return;

    this.cobrando = true;

    this.crmService.obtenerClienteMostrador().pipe(
      switchMap(idCliente => this.erpService.cobrarMesa(mesa.id, idCliente, pagos)),
    ).subscribe({
      next: () => {
        this.lastTicket = this.itemsTicketPendiente;
        this.ticketOpen = true;
        this.mesaSeleccionada = null;
        this.mesaPendiente = null;
        this.cobrando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo cobrar la mesa');
        this.cobrando = false;
        this.cdr.detectChanges();
      },
    });
  }

  abrirCargarHabitacion() {
    if (!this.mesaSeleccionada) return;
    this.habitacionDialogOpen = true;
  }

  confirmarCargarHabitacion(hab: ErpHabitacion) {
    if (!this.mesaSeleccionada || this.cargandoTransferencia) return;
    const mesa = this.mesaSeleccionada;
    this.cargandoTransferencia = true;
    this.erpService.cargarHabitacionMesa(mesa.id, hab.id).subscribe({
      next: () => {
        this.notify.success(`Se cargó a la habitación ${hab.numero}`, 'Cuenta transferida');
        this.habitacionDialogOpen = false;
        this.mesaSeleccionada = null;
        this.cargandoTransferencia = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo cargar la cuenta a la habitación');
        this.cargandoTransferencia = false;
        this.cdr.detectChanges();
      },
    });
  }
}
