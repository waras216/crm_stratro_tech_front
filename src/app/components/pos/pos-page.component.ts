import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ProductoPOS } from './catalogo/catalogo.component';
import { ItemCarrito } from './carrito/carrito.component';
import { ModuleService, PosTab } from '../../core/services/module.service';
import { NichoService } from '../../core/services/nicho.service';
import { ErpService } from '../../core/services/erp-service';
import { CrmService } from '../../core/services/crm-service';
import { NotifyService } from '../../core/services/notify.service';
import { ErpPedido } from '../../models/erp.models';
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

        <!-- Selector de distribuidor (solo nicho almacén) -->
        <div *ngIf="nicho.nicho==='almacen'" class="bg-white border border-slate-200 rounded-xl p-3 flex-shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-2">Distribuidor</p>
          <div *ngIf="!distribuidorSeleccionado" class="flex flex-col gap-2">
            <input [(ngModel)]="busquedaDistribuidor" (ngModelChange)="buscarDistribuidor$.next($event)"
              placeholder="Buscar distribuidor por nombre..."
              class="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors" />
            <p *ngIf="cargandoDistribuidores" class="text-xs text-slate-400 m-0">Buscando...</p>
            <div *ngIf="!cargandoDistribuidores && distribuidores.length>0" class="flex flex-col gap-1 max-h-32 overflow-y-auto">
              <button *ngFor="let d of distribuidores" (click)="seleccionarDistribuidor(d)"
                class="text-left text-xs px-3 py-2 rounded-lg border border-slate-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all">
                {{ d.nombre }} <span class="text-slate-400" *ngIf="d.telefono">· {{ d.telefono }}</span>
              </button>
            </div>
          </div>
          <div *ngIf="distribuidorSeleccionado" class="flex items-center justify-between">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ distribuidorSeleccionado.nombre }}</p>
            <button (click)="quitarDistribuidor()" class="text-[10px] font-semibold text-blue-600 bg-transparent border-0 cursor-pointer hover:underline">Cambiar</button>
          </div>
        </div>

        <div class="flex gap-4 flex-1 min-h-0">
          <div class="flex-1 min-w-0">
            <app-pos-catalogo (agregar)="agregarAlCarrito($event)"></app-pos-catalogo>
          </div>
          <div class="w-80 flex-shrink-0">
            <app-pos-carrito
              [items]="carrito"
              (cambiarCantidad)="onCambiarCantidad($event)"
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
            <p class="text-sm font-medium text-slate-700 m-0">Venta #{{ v.id }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ v.items.length }} productos · {{ v.fecha }}</p>
          </div>
          <span class="text-sm font-bold text-emerald-600">\${{ v.total.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <app-pos-ticket [items]="lastTicket" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
  `,
  styles: [':host { display: block; height: 100%; }'],
})
export class PosPageComponent implements OnInit, OnDestroy {
  tab: PosTab = 'terminal';
  carrito: ItemCarrito[] = [];
  ticketOpen = false;
  lastTicket: ItemCarrito[] = [];
  historial: ErpPedido[] = [];
  cargandoHistorial = false;
  cobrando = false;

  busquedaDistribuidor = '';
  buscarDistribuidor$ = new Subject<string>();
  distribuidores: Cliente[] = [];
  distribuidorSeleccionado: Cliente | null = null;
  cargandoDistribuidores = false;

  private destroy$ = new Subject<void>();

  constructor(
    public nicho: NichoService,
    private moduleService: ModuleService,
    private erpService: ErpService,
    private crmService: CrmService,
    private notify: NotifyService,
  ) {}

  ngOnInit() {
    this.moduleService.posTab$
      .pipe(takeUntil(this.destroy$))
      .subscribe(t => {
        this.tab = t;
        if (t === 'historial') this.cargarHistorial();
      });

    this.buscarDistribuidor$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.cargandoDistribuidores = true;
        return this.crmService.cargarClientes(1, search, '', 10);
      }),
    ).subscribe({
      next: pagina => { this.distribuidores = pagina.data; this.cargandoDistribuidores = false; },
      error: () => this.cargandoDistribuidores = false,
    });
  }

  seleccionarDistribuidor(d: Cliente) {
    this.distribuidorSeleccionado = d;
    this.distribuidores = [];
    this.busquedaDistribuidor = '';
  }

  quitarDistribuidor() {
    this.distribuidorSeleccionado = null;
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  cargarHistorial() {
    this.cargandoHistorial = true;
    this.erpService.cargarPedidos().subscribe({
      next: pedidos => { this.historial = pedidos; this.cargandoHistorial = false; },
      error: () => { this.cargandoHistorial = false; },
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

  quitarItem(id: number)  { this.carrito = this.carrito.filter(i => i.producto.id_productos !== id); }
  limpiarCarrito()         { this.carrito = []; }

  cobrar() {
    if (this.cobrando || !this.carrito.length) return;

    if (this.nicho.nicho === 'almacen' && !this.distribuidorSeleccionado) {
      this.notify.error('Selecciona un distribuidor antes de cobrar');
      return;
    }

    this.cobrando = true;

    const idCliente$: Observable<number> = this.nicho.nicho === 'almacen' && this.distribuidorSeleccionado
      ? of(this.distribuidorSeleccionado.id_cliente)
      : this.crmService.obtenerClienteMostrador();

    idCliente$.pipe(
      switchMap(idCliente => this.erpService.addPedido({
        id_cliente: idCliente,
        items: this.carrito.map(i => ({
          id_producto: i.producto.id_productos,
          cantidad: i.cantidad,
          precio_unitario: i.producto.precio,
        })),
      } as Partial<ErpPedido>)),
    ).subscribe({
      next: pedido => {
        this.historial.unshift(pedido);
        this.lastTicket = [...this.carrito];
        this.ticketOpen = true;
        this.carrito = [];
        this.distribuidorSeleccionado = null;
        this.cobrando = false;
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo procesar la venta');
        this.cobrando = false;
      },
    });
  }
}
