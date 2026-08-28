import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { ErpMesa, ErpComandaItem, Producto, PedidoPago } from '../../../models/erp.models';
import { ItemCarrito } from '../carrito/carrito.component';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-pos-terminal-restaurante',
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
        style="background:#ef4444">+ Mesa</button>
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

    <ng-container *ngIf="mesaSeleccionada as mesa">
      <!-- Header mesa -->
      <div class="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
          [class.bg-emerald-400]="mesa.estado==='libre'"
          [class.bg-red-400]="mesa.estado==='ocupada'"
          [class.bg-amber-400]="mesa.estado==='cuenta'"
          [class.bg-indigo-400]="mesa.estado==='reservada'">
          {{ mesa.numero }}
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800 m-0">Mesa {{ mesa.numero }} — {{ mesa.capacidad }} personas</p>
          <p class="text-xs text-slate-400 m-0" *ngIf="mesa.mesero">Mesero: {{ mesa.mesero }}</p>
        </div>
        <div class="flex gap-2">
          <button *ngIf="mesa.estado==='libre'" (click)="abrirMesa()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#ef4444">Abrir Mesa</button>
          <button *ngIf="mesa.estado==='ocupada'" (click)="pedirCuenta()"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90"
            style="background:#f59e0b">Pedir Cuenta</button>
          <button *ngIf="mesa.estado==='cuenta'" (click)="cerrarMesa()" [disabled]="cobrando"
            class="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer text-white hover:opacity-90 disabled:opacity-60"
            style="background:#10b981">{{ cobrando ? 'Cobrando...' : 'Cobrar $' + totalMesa(mesa) }}</button>
          <button *ngIf="mesa.estado==='ocupada' && comandaItems(mesa).length>0" (click)="enviarACocina()"
            class="text-xs font-semibold px-4 py-2 rounded-xl border border-red-200 cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 transition-all">
            Enviar a Cocina
          </button>
        </div>
      </div>

      <!-- Comanda -->
      <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[40vh] lg:max-h-none overflow-y-auto">
        <div class="px-5 pt-4 pb-2 border-b border-slate-50 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Comanda Activa</p>
          <span class="text-xs font-bold text-red-600">Total: \${{ totalMesa(mesa) }}</span>
        </div>
        <div *ngIf="comandaItems(mesa).length === 0" class="text-center py-10 text-slate-400 text-xs">
          Mesa vacía — agrega items del menú
        </div>
        <div *ngFor="let item of comandaItems(mesa); let i = index"
          class="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 card-enter"
          [style.animation-delay]="(i*0.04)+'s'">
          <span class="text-xl flex-shrink-0">🍽️</span>
          <div class="flex-1">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ item.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">\${{ item.precio_unitario }} c/u</p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="cambiarCantidad(item,-1)"
              class="w-6 h-6 rounded-lg bg-slate-100 border-0 cursor-pointer text-slate-600 font-bold hover:bg-slate-200 text-xs">−</button>
            <span class="text-xs font-bold text-slate-700 w-4 text-center">{{ item.cantidad }}</span>
            <button (click)="cambiarCantidad(item,1)"
              class="w-6 h-6 rounded-lg bg-emerald-50 border-0 cursor-pointer text-emerald-600 font-bold hover:bg-emerald-100 text-xs">+</button>
          </div>
          <p class="text-xs font-bold text-slate-800 m-0 w-14 text-right">\${{ item.precio_unitario * item.cantidad }}</p>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- ── PANEL DER: Menú rápido ── -->
  <div class="w-full lg:w-64 lg:flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl border border-slate-100 lg:flex-1 max-h-[40vh] lg:max-h-none overflow-y-auto">
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
      <p *ngIf="cargandoMenu" class="text-center py-8 text-slate-400 text-xs">Cargando...</p>
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
          <span class="text-lg flex-shrink-0">🍽️</span>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-semibold text-slate-700 m-0 truncate">{{ item.nombre }}</p>
          </div>
          <span class="text-[11px] font-bold text-red-500 flex-shrink-0">\${{ item.precio }}</span>
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
      style="background:#ef4444">{{ mesaSaving ? 'Guardando...' : 'Crear Mesa' }}</button>
  </div>
</div>

<app-pos-ticket [items]="lastTicket" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
<app-pos-pago-modal [visible]="pagoModalOpen" [total]="totalPago"
  (confirmar)="confirmarPago($event)" (cancelado)="pagoModalOpen=false"></app-pos-pago-modal>
  `,
})
export class PosTerminalRestauranteComponent implements OnInit {
  private notify = inject(NotifyService);
  private erpService = inject(ErpService);
  private crmService = inject(CrmService);
  private cdr = inject(ChangeDetectorRef);

  mesas: ErpMesa[] = [];
  mesaSeleccionada: ErpMesa | null = null;
  categoriaActiva = 'Todos';
  cargandoMesas = false;
  cargandoMenu = false;
  cobrando = false;

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

  productos: Producto[] = [];

  estados = [
    { label: 'Libre',     dot: 'bg-emerald-400', text: 'text-emerald-600' },
    { label: 'Ocupada',   dot: 'bg-red-400',     text: 'text-red-600' },
    { label: 'Cuenta',    dot: 'bg-amber-400',   text: 'text-amber-600' },
    { label: 'Reservada', dot: 'bg-indigo-400',  text: 'text-indigo-600' },
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

    this.cargandoMenu = true;
    this.erpService.cargarInventario().subscribe({
      next: productos => {
        this.productos = productos.filter(p => p.activo !== false);
        this.cargandoMenu = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoMenu = false; this.cdr.detectChanges(); },
    });
  }

  get categorias(): string[] {
    const nombres = new Set(this.productos.map(p => p.categoria?.nombre).filter((n): n is string => !!n));
    return ['Todos', ...nombres];
  }

  get menuFiltrado(): Producto[] {
    return this.productos.filter(p => this.categoriaActiva === 'Todos' || p.categoria?.nombre === this.categoriaActiva);
  }

  comandaItems(m: ErpMesa): ErpComandaItem[] {
    return m.comanda_activa?.items ?? [];
  }

  totalMesa(m: ErpMesa): number {
    return m.comanda_activa?.total ?? 0;
  }

  mesaClases(m: ErpMesa): string {
    const sel = this.mesaSeleccionada?.id === m.id;
    const ring = sel ? ' ring-2 ring-offset-1 ring-red-400' : '';
    const map: Record<ErpMesa['estado'], string> = {
      libre:     'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400',
      ocupada:   'bg-red-50 border-red-200 text-red-700 hover:border-red-400',
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

  agregarItem(producto: Producto) {
    if (!this.mesaSeleccionada || this.mesaSeleccionada.estado === 'libre') return;
    this.erpService.agregarItemMesa(this.mesaSeleccionada.id, { id_producto: producto.id_productos }).subscribe({
      next: actualizada => { this.mesaSeleccionada = actualizada; this.cdr.detectChanges(); },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el producto'),
    });
  }

  cambiarCantidad(item: ErpComandaItem, delta: number) {
    if (!this.mesaSeleccionada) return;
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
}
