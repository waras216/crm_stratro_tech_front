import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { Cliente } from '../../../models/crm.models';
import { ErpReceta, Producto, PedidoPago } from '../../../models/erp.models';
import { ItemCarrito } from '../carrito/carrito.component';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-pos-terminal-farmacia',
  standalone: false,
  animations: [modalLeave],
  template: `
<div class="flex gap-4 h-full page-enter">

  <!-- ── PANEL IZQ: Pacientes ── -->
  <div class="w-72 flex-shrink-0 flex flex-col gap-3">
    <div class="bg-white rounded-2xl p-4 border border-slate-100">
      <p class="text-xs font-bold text-slate-700 m-0 mb-3">Buscar Paciente</p>
      <input [(ngModel)]="busqueda" (ngModelChange)="buscar$.next($event)"
        placeholder="Nombre o teléfono..."
        class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 transition-colors" />
    </div>
    <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
      <div class="px-4 pt-4 pb-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0">Pacientes ({{ pacientes.length }})</p>
      </div>
      <p *ngIf="cargandoPacientes" class="text-center py-6 text-slate-400 text-xs">Buscando...</p>
      <div *ngFor="let p of pacientes"
        (click)="seleccionar(p)"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-emerald-50 border-b border-slate-50 last:border-0"
        [class.bg-emerald-50]="pacienteSeleccionado?.id_cliente === p.id_cliente">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#34d399,#10b981)">{{ p.nombre.charAt(0) }}</div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-700 m-0 truncate">{{ p.nombre }}</p>
          <p class="text-[10px] text-slate-400 m-0">{{ p.telefono || 'Sin teléfono' }}</p>
        </div>
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

    <ng-container *ngIf="pacienteSeleccionado as paciente">
      <!-- Header paciente -->
      <div class="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#34d399,#10b981)">{{ paciente.nombre.charAt(0) }}</div>
        <div class="flex-1">
          <p class="text-sm font-bold text-slate-800 m-0">{{ paciente.nombre }}</p>
          <p class="text-xs text-slate-400 m-0">Tel: {{ paciente.telefono || '—' }}</p>
        </div>
        <button (click)="recetaDialogOpen=true" class="text-xs font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer text-white transition-all hover:opacity-90"
          style="background:#10b981">+ Nueva Receta</button>
      </div>

      <!-- Recetas pendientes -->
      <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
        <div class="px-5 pt-4 pb-2 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Recetas Pendientes</p>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">
            {{ recetasPendientes.length }} pendientes
          </span>
        </div>
        <p *ngIf="cargandoRecetas" class="text-center py-10 text-slate-400 text-xs">Cargando...</p>
        <div *ngIf="!cargandoRecetas && recetas.length === 0" class="text-center py-10 text-slate-400 text-xs">Sin recetas registradas</div>
        <div *ngFor="let r of recetas; let i = index"
          class="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0 card-enter"
          [style.animation-delay]="(i*0.04)+'s'">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            [class.bg-amber-50]="esPendiente(r)" [class.bg-slate-50]="!esPendiente(r)">💊</div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-700 m-0">{{ r.producto?.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ r.dosis || 'Sin indicación' }} · Cant: {{ r.cantidad }}</p>
          </div>
          <p class="text-xs font-bold text-slate-700 m-0">\${{ (r.producto?.precio || 0) * r.cantidad }}</p>
          <button *ngIf="esPendiente(r)" (click)="dispensar(r)"
            class="text-[10px] font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer text-white transition-all hover:opacity-90 flex-shrink-0"
            style="background:#10b981">Dispensar</button>
          <span *ngIf="!esPendiente(r) && !enCarrito(r)"
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
            <p class="text-[11px] font-semibold text-slate-700 m-0 truncate">{{ item.producto?.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ item.cantidad }} × \${{ item.producto?.precio }}</p>
          </div>
          <p class="text-xs font-bold text-emerald-600 m-0">\${{ (item.producto?.precio || 0) * item.cantidad }}</p>
          <button (click)="quitarDelCarrito(item)" class="w-5 h-5 rounded text-slate-300 hover:text-red-400 border-0 bg-transparent cursor-pointer text-xs">✕</button>
        </div>
      </div>
      <div class="px-4 pb-4 pt-2 border-t border-slate-100">
        <div class="flex justify-between mb-3">
          <span class="text-xs text-slate-500">Total</span>
          <span class="text-sm font-extrabold text-slate-800">\${{ totalCarrito() }}</span>
        </div>
        <button (click)="cobrar()" [disabled]="carrito.length === 0 || cobrando"
          class="w-full py-2.5 rounded-xl border-0 text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
          [style.background]="carrito.length > 0 ? '#10b981' : '#94a3b8'"
          [style.cursor]="carrito.length > 0 ? 'pointer' : 'not-allowed'">
          {{ cobrando ? 'Procesando...' : 'Cobrar Dispensación' }}
        </button>
        <button *ngIf="carrito.length > 0" (click)="limpiarCarrito()"
          class="w-full mt-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 bg-transparent cursor-pointer hover:bg-slate-50 transition-colors">
          Limpiar
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Modal: nueva receta -->
<div *ngIf="recetaDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="recetaDialogOpen=false"></div>
<div *ngIf="recetaDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Nueva Receta — {{ pacienteSeleccionado?.nombre }}</h3>
  <div class="flex flex-col gap-3">
    <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="recetaForm.id_producto">
      <option [ngValue]="null" disabled>Selecciona un medicamento</option>
      <option *ngFor="let p of productos" [ngValue]="p.id_productos">{{ p.nombre }} — \${{ p.precio }}</option>
    </select>
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="recetaForm.dosis" placeholder="Dosis (ej. Cada 8h × 7 días)" />
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="recetaForm.cantidad" placeholder="Cantidad" />
    <p *ngIf="recetaError" class="text-xs text-red-600 m-0">{{ recetaError }}</p>
    <button (click)="crearReceta()" [disabled]="recetaSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#10b981">{{ recetaSaving ? 'Guardando...' : 'Crear Receta' }}</button>
  </div>
</div>

<app-pos-ticket [items]="lastTicket" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
<app-pos-pago-modal [visible]="pagoModalOpen" [total]="totalPago"
  (confirmar)="confirmarPago($event)" (cancelado)="pagoModalOpen=false"></app-pos-pago-modal>
  `,
})
export class PosTerminalFarmaciaComponent implements OnInit {
  private notify = inject(NotifyService);
  private erpService = inject(ErpService);
  private crmService = inject(CrmService);
  private cdr = inject(ChangeDetectorRef);

  busqueda = '';
  buscar$ = new Subject<string>();
  pacientes: Cliente[] = [];
  cargandoPacientes = false;

  pacienteSeleccionado: Cliente | null = null;
  recetas: ErpReceta[] = [];
  cargandoRecetas = false;
  carrito: ErpReceta[] = [];
  cobrando = false;

  productos: Producto[] = [];

  recetaDialogOpen = false;
  recetaForm: { id_producto: number | null; dosis: string; cantidad: number } = { id_producto: null, dosis: '', cantidad: 1 };
  recetaError = '';
  recetaSaving = false;

  ticketOpen = false;
  pagoModalOpen = false;
  totalPago = 0;
  private idsPendientes: number[] = [];
  private pacientePendiente: Cliente | null = null;
  private itemsTicketPendiente: ItemCarrito[] = [];
  lastTicket: ItemCarrito[] = [];

  ngOnInit() {
    this.buscar$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.cargandoPacientes = true;
        return this.crmService.cargarClientes(1, search, '', 20);
      }),
    ).subscribe({
      next: pagina => { this.pacientes = pagina.data; this.cargandoPacientes = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoPacientes = false; this.cdr.detectChanges(); },
    });
    this.buscar$.next('');

    this.erpService.cargarInventario().subscribe(productos => {
      this.productos = productos.filter(p => p.activo !== false);
      this.cdr.detectChanges();
    });
  }

  get recetasPendientes(): ErpReceta[] {
    return this.recetas.filter(r => this.esPendiente(r));
  }

  esPendiente(r: ErpReceta): boolean {
    return r.pendiente && !this.enCarrito(r);
  }

  enCarrito(r: ErpReceta): boolean {
    return this.carrito.some(c => c.id === r.id);
  }

  seleccionar(p: Cliente) {
    this.pacienteSeleccionado = p;
    this.carrito = [];
    this.cargandoRecetas = true;
    this.erpService.cargarRecetas(p.id_cliente).subscribe({
      next: recetas => { this.recetas = recetas; this.cargandoRecetas = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoRecetas = false; this.cdr.detectChanges(); },
    });
  }

  crearReceta() {
    if (this.recetaSaving || !this.pacienteSeleccionado) return;
    if (!this.recetaForm.id_producto) { this.recetaError = 'Selecciona un medicamento.'; return; }
    this.recetaSaving = true;
    this.recetaError = '';
    this.erpService.addReceta({
      id_cliente: this.pacienteSeleccionado.id_cliente,
      id_producto: this.recetaForm.id_producto,
      dosis: this.recetaForm.dosis,
      cantidad: this.recetaForm.cantidad || 1,
    }).subscribe({
      next: nueva => {
        this.recetas = [nueva, ...this.recetas];
        this.recetaSaving = false;
        this.recetaDialogOpen = false;
        this.recetaForm = { id_producto: null, dosis: '', cantidad: 1 };
        this.cdr.detectChanges();
      },
      error: err => {
        this.recetaSaving = false;
        this.recetaError = err?.error?.message || 'No se pudo crear la receta';
        this.cdr.detectChanges();
      },
    });
  }

  dispensar(r: ErpReceta) {
    this.carrito.push(r);
  }

  quitarDelCarrito(item: ErpReceta) {
    this.carrito = this.carrito.filter(i => i !== item);
  }

  limpiarCarrito() {
    this.carrito = [];
  }

  totalCarrito(): number {
    return this.carrito.reduce((s, r) => s + (r.producto?.precio || 0) * r.cantidad, 0);
  }

  async cobrar() {
    if (this.cobrando || !this.carrito.length || !this.pacienteSeleccionado) return;
    const total = this.totalCarrito();
    const cantidad = this.carrito.length;
    const paciente = this.pacienteSeleccionado;

    const ok = await this.notify.confirm(`¿Confirmar dispensación de ${cantidad} medicamento(s) por $${total} para ${paciente.nombre}?`, { confirmText: 'Cobrar' });
    if (!ok) return;

    const itemsTicket = this.carrito
      .filter(r => r.producto)
      .map(r => ({ producto: r.producto!, cantidad: r.cantidad }));

    this.idsPendientes = this.carrito.map(r => r.id);
    this.pacientePendiente = paciente;
    this.itemsTicketPendiente = itemsTicket;
    this.totalPago = total;
    this.pagoModalOpen = true;
  }

  confirmarPago(pagos: PedidoPago[]) {
    this.pagoModalOpen = false;
    const paciente = this.pacientePendiente;
    if (!paciente) return;

    const ids = this.idsPendientes;
    this.cobrando = true;

    this.erpService.dispensarLote(ids, paciente.id_cliente, pagos).subscribe({
      next: () => {
        this.lastTicket = this.itemsTicketPendiente;
        this.ticketOpen = true;
        this.recetas = this.recetas.map(r => ids.includes(r.id) ? { ...r, pendiente: false } : r);
        this.carrito = [];
        this.pacienteSeleccionado = null;
        this.pacientePendiente = null;
        this.cobrando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo completar la dispensación');
        this.cobrando = false;
        this.cdr.detectChanges();
      },
    });
  }
}
