import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ProductoPOS } from './catalogo/catalogo.component';
import { ItemCarrito } from './carrito/carrito.component';
import { ModuleService, PosTab } from '../../core/services/module.service';
import { NichoService, TIENDA_CANALES_LABELS } from '../../core/services/nicho.service';
import { ErpService } from '../../core/services/erp-service';
import { CrmService } from '../../core/services/crm-service';
import { NotifyService } from '../../core/services/notify.service';
import { ErpPedido, PedidoPago } from '../../models/erp.models';
import { Cliente } from '../../models/crm.models';

@Component({
  selector: 'app-pos-page',
  standalone: false,
  template: `
    <!-- ── TERMINAL ── -->
    <ng-container *ngIf="tab==='terminal'">

      <ng-container *ngIf="nicho.nicho==='farmacia'">
        <app-pos-terminal-farmacia></app-pos-terminal-farmacia>
      </ng-container>

      <ng-container *ngIf="nicho.nicho==='hotel'">
        <app-pos-terminal-hotel></app-pos-terminal-hotel>
      </ng-container>

      <ng-container *ngIf="nicho.nicho==='restaurante'">
        <app-pos-terminal-restaurante></app-pos-terminal-restaurante>
      </ng-container>

      <div *ngIf="nicho.nicho!=='farmacia' && nicho.nicho!=='hotel' && nicho.nicho!=='restaurante'"
        class="flex flex-col gap-3 h-full">

        <!-- Selector de cliente: obligatorio para el nicho almacén (distribuidor), opcional para el resto -->
        <div class="bg-white border border-slate-200 rounded-xl p-3 flex-shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-2">{{ nicho.nicho==='almacen' ? 'Distribuidor' : 'Cliente' }}</p>
          <div *ngIf="!clienteSeleccionado && buscandoCliente" class="flex flex-col gap-2">
            <input [(ngModel)]="busquedaCliente" (ngModelChange)="buscarCliente$.next($event)" autofocus
              [placeholder]="nicho.nicho==='almacen' ? 'Buscar distribuidor por nombre...' : 'Buscar cliente por nombre...'"
              class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors" />
            <p *ngIf="cargandoClientes" class="text-xs text-slate-400 m-0">Buscando...</p>
            <div *ngIf="!cargandoClientes && clientesEncontrados.length>0" class="flex flex-col gap-1 max-h-32 overflow-y-auto">
              <button *ngFor="let c of clientesEncontrados" (click)="seleccionarCliente(c)"
                class="text-left text-xs px-3 py-2 rounded-lg border border-slate-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all">
                {{ c.nombre }} <span class="text-slate-400" *ngIf="c.telefono">· {{ c.telefono }}</span>
              </button>
            </div>
            <button *ngIf="nicho.nicho!=='almacen'" (click)="cancelarBusquedaCliente()" class="text-[10px] font-semibold text-slate-400 bg-transparent border-0 cursor-pointer hover:underline text-left">Cancelar — dejar como Público General</button>
          </div>
          <div *ngIf="!clienteSeleccionado && !buscandoCliente" class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-700 m-0">Público General</p>
            <button (click)="buscandoCliente=true" class="text-[10px] font-semibold text-blue-600 bg-transparent border-0 cursor-pointer hover:underline">Elegir cliente</button>
          </div>
          <div *ngIf="clienteSeleccionado" class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ clienteSeleccionado.nombre }}</p>
            <button (click)="quitarCliente()" class="text-[10px] font-semibold text-blue-600 bg-transparent border-0 cursor-pointer hover:underline">Cambiar</button>
          </div>
        </div>

        <div *ngIf="nicho.nicho==='tienda' && nicho.tiendaCanales.length>1" class="bg-white border border-slate-200 rounded-xl p-3 flex-shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-2">Canal de venta</p>
          <div class="flex flex-wrap gap-1.5">
            <button *ngFor="let c of nicho.tiendaCanales" (click)="canalVenta=c"
              class="text-[10px] font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer transition-all"
              [class.text-white]="canalVenta===c" [class.bg-pink-500]="canalVenta===c"
              [class.bg-slate-100]="canalVenta!==c" [class.text-slate-600]="canalVenta!==c">
              {{ canalLabel(c) }}
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          <div class="flex-1 min-w-0 min-h-[50vh] lg:min-h-0">
            <app-pos-catalogo (agregar)="agregarAlCarrito($event)"></app-pos-catalogo>
          </div>
          <div class="w-full lg:w-80 lg:flex-shrink-0">
            <app-pos-carrito
              [items]="carrito"
              (cambiarCantidad)="onCambiarCantidad($event)"
              (establecerCantidad)="onEstablecerCantidad($event)"
              (quitar)="quitarItem($event)"
              (cobrar)="cobrar()"
              (limpiar)="limpiarCarrito()">
            </app-pos-carrito>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- ── HISTORIAL ── -->
    <div *ngIf="tab==='historial'" class="page-enter">
      <div class="bg-white border border-slate-200 rounded-xl p-5">
        <h2 class="text-sm font-bold text-slate-800 m-0 mb-4">{{ nicho.config.posHistorial }}</h2>
        <p *ngIf="cargandoHistorial" class="text-center py-12 text-slate-400 text-sm">Cargando...</p>
        <div *ngIf="!cargandoHistorial && historial.length===0" class="text-center py-12 text-slate-400 text-sm">
          No hay registros aún
        </div>
        <div *ngFor="let v of historial; let i = index"
          class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 card-enter"
          [style.animation-delay]="(i*0.04)+'s'">
          <div>
            <p class="text-sm font-medium text-slate-700 m-0">Venta #{{ v.id }} — {{ v.cliente?.nombre ?? 'Público General' }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ v.items.length }} productos · {{ v.fecha }}{{ v.cajero ? ' · ' + v.cajero.nombre : '' }}{{ v.pagos?.length ? ' · ' + metodoPagoLabel(v.pagos![0].metodo_pago) : '' }}</p>
          </div>
          <span class="text-sm font-bold text-emerald-600">\${{ v.total.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <app-pos-ticket [pedido]="lastPedido" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
    <app-pos-pago-modal [visible]="pagoModalOpen" [total]="totalCarrito"
      (confirmar)="confirmarPago($event)" (cancelado)="pagoModalOpen=false"></app-pos-pago-modal>
  `,
  styles: [':host { display: block; height: 100%; }'],
})
export class PosPageComponent implements OnInit, OnDestroy {
  tab: PosTab = 'terminal';
  carrito: ItemCarrito[] = [];
  ticketOpen = false;
  lastPedido: ErpPedido | null = null;
  pagoModalOpen = false;
  historial: ErpPedido[] = [];
  cargandoHistorial = false;
  cobrando = false;

  buscandoCliente = false;
  busquedaCliente = '';
  buscarCliente$ = new Subject<string>();
  clientesEncontrados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  cargandoClientes = false;
  canalVenta: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public nicho: NichoService,
    private moduleService: ModuleService,
    private erpService: ErpService,
    private crmService: CrmService,
    private notify: NotifyService,
    private cdr: ChangeDetectorRef,
  ) {}

  canalLabel(id: string): string { return TIENDA_CANALES_LABELS[id] || id; }

  ngOnInit() {
    this.canalVenta = this.nicho.tiendaCanales[0] || null;
    this.moduleService.posTab$
      .pipe(takeUntil(this.destroy$))
      .subscribe(t => {
        this.tab = t;
        if (t === 'historial') this.cargarHistorial();
      });

    this.buscarCliente$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.cargandoClientes = true;
        return this.crmService.cargarClientes(1, search, '', 10);
      }),
    ).subscribe({
      next: pagina => { this.clientesEncontrados = pagina.data; this.cargandoClientes = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoClientes = false; this.cdr.detectChanges(); },
    });
  }

  seleccionarCliente(c: Cliente) {
    this.clienteSeleccionado = c;
    this.clientesEncontrados = [];
    this.busquedaCliente = '';
    this.buscandoCliente = false;
  }

  quitarCliente() {
    this.clienteSeleccionado = null;
  }

  cancelarBusquedaCliente() {
    this.buscandoCliente = false;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
  }

  metodoPagoLabel(metodo: string): string {
    const labels: Record<string, string> = { efectivo: 'Efectivo', tarjeta_debito: 'Tarjeta débito', tarjeta_credito: 'Tarjeta crédito' };
    return labels[metodo] ?? metodo;
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  cargarHistorial() {
    this.cargandoHistorial = true;
    this.erpService.cargarPedidos().subscribe({
      next: pedidos => { this.historial = pedidos; this.cargandoHistorial = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoHistorial = false; this.cdr.detectChanges(); },
    });
  }

  agregarAlCarrito(producto: ProductoPOS) {
    const existing = this.carrito.find(i => i.producto.id_productos === producto.id_productos);
    if (existing) {
      existing.cantidad++;
    } else {
      this.carrito = [...this.carrito, { producto, cantidad: 1 }];
    }
  }

  onCambiarCantidad(ev: { id: number; delta: number }) {
    this.carrito = this.carrito
      .map(i => i.producto.id_productos === ev.id ? { ...i, cantidad: i.cantidad + ev.delta } : i)
      .filter(i => i.cantidad > 0);
  }

  onEstablecerCantidad(ev: { id: number; cantidad: number }) {
    this.carrito = this.carrito.map(i => i.producto.id_productos === ev.id ? { ...i, cantidad: ev.cantidad } : i);
  }

  quitarItem(id: number)  { this.carrito = this.carrito.filter(i => i.producto.id_productos !== id); }
  limpiarCarrito()         { this.carrito = []; }

  get totalCarrito(): number {
    return this.carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  }

  cobrar() {
    if (this.cobrando || !this.carrito.length) return;

    if (this.nicho.nicho === 'almacen' && !this.clienteSeleccionado) {
      this.notify.error('Selecciona un distribuidor antes de cobrar');
      return;
    }

    this.pagoModalOpen = true;
  }

  confirmarPago(pagos: PedidoPago[]) {
    this.pagoModalOpen = false;
    this.cobrando = true;

    const idCliente$: Observable<number> = this.clienteSeleccionado
      ? of(this.clienteSeleccionado.id_cliente)
      : this.crmService.obtenerClienteMostrador();

    idCliente$.pipe(
      switchMap(idCliente => this.erpService.addPedido({
        id_cliente: idCliente,
        estado: 'facturado',
        canal: this.nicho.nicho === 'tienda' ? this.canalVenta : null,
        pagos,
        items: this.carrito.map(i => ({
          id_producto: i.producto.id_productos,
          cantidad: i.cantidad,
          precio_unitario: i.producto.precio,
        })),
      } as Partial<ErpPedido>)),
    ).subscribe({
      next: pedido => {
        this.historial.unshift(pedido);
        this.lastPedido = pedido;
        this.ticketOpen = true;
        this.carrito = [];
        this.clienteSeleccionado = null;
        this.cobrando = false;
        this.notify.success('Venta registrada');
        this.cdr.detectChanges();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo procesar la venta');
        this.cobrando = false;
        this.cdr.detectChanges();
      },
    });
  }
}
