import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { HOTEL_AMENIDAD_CATEGORIAS, NichoService } from '../../../core/services/nicho.service';
import { ErpEstimadoHospedaje, ErpHabitacion, ErpHabitacionConsumo, ErpHistorialCliente, ErpPedido, ErpTarifaTemporada, Producto, PedidoPago } from '../../../models/erp.models';
import { Cliente } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-pos-terminal-hotel',
  standalone: false,
  animations: [modalLeave],
  template: `
<div class="flex flex-col gap-3 lg:h-full">

  <!-- ── Selector de sección ── -->
  <div *ngIf="secciones.length" class="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
    <button (click)="seccionActiva='recepcion'"
      class="px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer whitespace-nowrap transition-all"
      [ngClass]="seccionActiva==='recepcion' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'">
      Recepción
    </button>
    <button *ngFor="let s of secciones" (click)="seccionActiva=s"
      class="px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer whitespace-nowrap transition-all"
      [ngClass]="seccionActiva===s ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'">
      {{ s }}
    </button>
  </div>

  <app-pos-terminal-hotel-seccion *ngIf="seccionActiva !== 'recepcion'" class="flex-1 min-h-0" [seccion]="seccionActiva"></app-pos-terminal-hotel-seccion>

<div *ngIf="seccionActiva === 'recepcion'" class="flex flex-col lg:flex-row gap-4 lg:flex-1 lg:min-h-0 page-enter">

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
          class="relative aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all text-center p-1"
          [ngClass]="estadoClases(h)"
          [class.ring-2]="habSeleccionada?.id === h.id"
          [style.ring-color]="'#f59e0b'">
          <span *ngIf="h.estado_limpieza !== 'limpia'" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" title="Necesita limpieza"></span>
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
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            <span class="text-[10px] font-bold px-3 py-1 rounded-full"
              [class.bg-emerald-100]="hab.estado==='libre'" [class.text-emerald-600]="hab.estado==='libre'"
              [class.bg-amber-100]="hab.estado==='ocupada'" [class.text-amber-600]="hab.estado==='ocupada'"
              [class.bg-blue-100]="hab.estado==='checkout'" [class.text-blue-600]="hab.estado==='checkout'"
              [class.bg-slate-100]="hab.estado==='mantenimiento'" [class.text-slate-500]="hab.estado==='mantenimiento'">
              {{ hab.estado | titlecase }}
            </span>
            <button *ngIf="hab.estado==='libre'" (click)="siguienteEstadoLimpieza(hab)"
              class="text-[10px] font-bold px-3 py-1 rounded-full border-0 cursor-pointer"
              [class.bg-red-100]="hab.estado_limpieza==='sucia'" [class.text-red-600]="hab.estado_limpieza==='sucia'"
              [class.bg-amber-100]="hab.estado_limpieza==='en_limpieza'" [class.text-amber-600]="hab.estado_limpieza==='en_limpieza'"
              [class.bg-indigo-100]="hab.estado_limpieza==='inspeccion'" [class.text-indigo-600]="hab.estado_limpieza==='inspeccion'"
              [class.bg-emerald-100]="hab.estado_limpieza==='limpia'" [class.text-emerald-600]="hab.estado_limpieza==='limpia'">
              {{ limpiezaLabel(hab.estado_limpieza) }}
            </button>
          </div>
        </div>
        <!-- Huésped info -->
        <div *ngIf="hab.huesped" class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          <div>
            <p class="text-[10px] text-slate-400 m-0">Registro</p>
            <p class="text-xs font-semibold m-0 mt-0.5" [class.text-emerald-600]="hab.estadia_activa?.firma_url" [class.text-amber-600]="!hab.estadia_activa?.firma_url">
              {{ hab.estadia_activa?.firma_url ? '✓ Firmado' : 'Pendiente' }}
            </p>
          </div>
        </div>
        <!-- Acciones -->
        <div class="mt-3 flex gap-2">
          <button *ngIf="hab.estado==='libre'" (click)="abrirCheckIn()" [disabled]="hab.estado_limpieza !== 'limpia'"
            [title]="hab.estado_limpieza !== 'limpia' ? 'La habitación necesita limpieza antes del check-in' : ''"
            class="flex-1 py-2 text-xs font-bold rounded-xl border-0 cursor-pointer text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
          <button *ngIf="hab.estado==='ocupada'" (click)="abrirRegistro(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-600 bg-transparent hover:bg-slate-50 transition-all">
            Registro
          </button>
          <button *ngIf="hab.estado==='libre'" (click)="toggleMantenimiento(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-500 bg-transparent hover:bg-slate-50 transition-all">
            Mantenimiento
          </button>
          <button *ngIf="hab.estado==='mantenimiento'" (click)="toggleMantenimiento(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer text-slate-500 bg-transparent hover:bg-slate-50 transition-all">
            Reactivar
          </button>
          <button (click)="abrirReportarIncidencia(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-orange-200 cursor-pointer text-orange-600 bg-orange-50 hover:bg-orange-100 transition-all">
            Reportar
          </button>
          <button *ngIf="hab.estado==='ocupada'" (click)="abrirReportarSolicitud(hab)"
            class="flex-1 py-2 text-xs font-semibold rounded-xl border border-indigo-200 cursor-pointer text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all">
            Solicitud
          </button>
        </div>
      </div>

      <!-- Consumos -->
      <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto">
        <div *ngIf="hab.estado==='ocupada' || hab.estado==='checkout'" class="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 bg-amber-50/50">
          <p class="text-xs text-slate-700 m-0">
            Hospedaje — {{ hab.noches }} noche(s) × \${{ hab.precio ?? 0 }}
            <span *ngIf="hayTemporadaEnHospedaje(hab)" class="text-amber-600 font-semibold"> · incluye tarifa de temporada</span>
          </p>
          <p class="text-xs font-bold text-slate-700 m-0">\${{ totalHospedaje(hab) | number:'1.0-2' }}</p>
        </div>
        <div class="px-5 pt-4 pb-2 flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 m-0">Consumos Room Service</p>
          <span class="text-xs font-bold text-amber-600">Total a cobrar: \${{ totalConsumos(hab) + totalHospedaje(hab) }}</span>
        </div>
        <div *ngIf="hab.consumos.length === 0" class="flex flex-col items-center py-8 text-slate-300 gap-1">
          <span class="text-2xl">🛎️</span>
          <p class="text-xs text-slate-400 m-0">Sin consumos registrados</p>
        </div>
        <div *ngFor="let c of hab.consumos" class="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-slate-700 m-0 truncate">{{ c.nombre }}</p>
            <p class="text-[10px] text-slate-400 m-0">\${{ c.precio_unitario }} c/u</p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button (click)="quitarConsumo(hab, c)" title="Quitar una unidad"
              class="w-8 h-8 flex items-center justify-center rounded-lg border-0 bg-red-50 text-red-500 text-base font-bold cursor-pointer hover:bg-red-100 active:scale-95 transition-transform">−</button>
            <span class="text-sm font-bold text-slate-700 w-6 text-center">{{ c.cantidad }}</span>
            <button *ngIf="c.id_producto" (click)="incrementarConsumo(hab, c)" [disabled]="productoSinStock(c.id_producto)"
              title="Agregar una unidad más"
              class="w-8 h-8 flex items-center justify-center rounded-lg border-0 bg-emerald-50 text-emerald-600 text-base font-bold cursor-pointer hover:bg-emerald-100 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed">+</button>
          </div>
          <p class="text-xs font-bold text-slate-700 m-0 w-16 text-right flex-shrink-0">\${{ c.precio_unitario * c.cantidad }}</p>
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
          <p *ngIf="hab.consumos.length" class="text-[10px] text-amber-500 m-0 mt-1.5 italic">Ajusta cantidades en "Consumos Room Service" arriba ↑</p>
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
            class="flex items-center gap-2 p-2 rounded-xl border bg-slate-50 transition-colors"
            [class.border-slate-100]="!sinStock(item)"
            [class.border-red-200]="sinStock(item)"
            [class.opacity-60]="sinStock(item)">
            <span class="text-lg flex-shrink-0">🍽️</span>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold text-slate-600 m-0 truncate">{{ item.nombre }}</p>
              <p class="text-[10px] font-bold text-amber-600 m-0">\${{ item.precio }}</p>
              <p *ngIf="sinStock(item)" class="text-[9px] font-bold text-red-500 m-0 mt-0.5">⚠ Sin stock</p>
              <p *ngIf="!sinStock(item) && stockBajo(item)" class="text-[9px] font-bold text-amber-500 m-0 mt-0.5">⚠ Quedan {{ item.stock }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button (click)="cambiarCantidadProducto(item, -1)" [disabled]="sinStock(item)"
                class="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">-</button>
              <span class="text-xs font-bold text-slate-700 w-5 text-center">{{ cantidadDe(item) }}</span>
              <button (click)="cambiarCantidadProducto(item, 1)" [disabled]="sinStock(item)"
                class="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">+</button>
            </div>
            <button (click)="agregarConsumo(item)" [disabled]="sinStock(item)"
              class="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border-0 cursor-pointer text-white hover:opacity-90 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style="background:#f59e0b">{{ sinStock(item) ? 'Sin stock' : 'Agregar' }}</button>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</div>
</div>

<!-- Modal: nueva habitación -->
<div *ngIf="habDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="habDialogOpen=false"></div>
<div *ngIf="habDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Nueva Habitación</h3>
  <div class="flex flex-col gap-3">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold text-slate-500">Número</label>
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="habForm.numero" placeholder="Ej. 101" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold text-slate-500">Tipo</label>
        <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="habForm.tipo">
          <option *ngFor="let t of nicho.hotelTiposHabitacion" [value]="t">{{ t }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold text-slate-500">Piso</label>
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="habForm.piso" placeholder="Ej. 1" />
      </div>
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-[11px] font-semibold text-slate-500">Precio por noche</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
        <input class="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="0" step="0.01" [(ngModel)]="habForm.precio" placeholder="0.00" />
      </div>
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
    <div *ngIf="!checkInForm.id_cliente" class="flex flex-col gap-1.5">
      <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="checkInForm.huesped" placeholder="Nombre del huésped" />
      <button *ngIf="!buscandoClienteCheckIn" (click)="buscandoClienteCheckIn=true" class="text-[11px] font-semibold text-amber-600 bg-transparent border-0 cursor-pointer hover:underline text-left">Vincular a un cliente existente</button>
      <div *ngIf="buscandoClienteCheckIn" class="flex flex-col gap-1.5">
        <input [(ngModel)]="busquedaClienteCheckIn" (ngModelChange)="buscarClienteCheckIn$.next($event)" autofocus
          placeholder="Buscar cliente por nombre..."
          class="px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-400" />
        <p *ngIf="cargandoClientesCheckIn" class="text-xs text-slate-400 m-0">Buscando...</p>
        <div *ngIf="!cargandoClientesCheckIn && clientesEncontradosCheckIn.length>0" class="flex flex-col gap-1 max-h-28 overflow-y-auto">
          <button *ngFor="let c of clientesEncontradosCheckIn" (click)="seleccionarClienteCheckIn(c)"
            class="text-left text-xs px-3 py-2 rounded-lg border border-slate-100 hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-all">
            {{ c.nombre }} <span class="text-slate-400" *ngIf="c.telefono">· {{ c.telefono }}</span>
          </button>
        </div>
        <button (click)="buscandoClienteCheckIn=false; busquedaClienteCheckIn=''; clientesEncontradosCheckIn=[]" class="text-[10px] font-semibold text-slate-400 bg-transparent border-0 cursor-pointer hover:underline text-left">Cancelar</button>
      </div>
    </div>
    <div *ngIf="checkInForm.id_cliente" class="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg">
      <div>
        <p class="text-xs font-semibold text-slate-700 m-0">{{ checkInForm.huesped }}</p>
        <p *ngIf="historialHuespedCheckIn as h" class="text-[10px] m-0 mt-0.5" [class.text-amber-600]="h.total_estadias>0" [class.font-bold]="h.total_estadias>0" [class.text-slate-400]="h.total_estadias===0">
          {{ h.total_estadias>0 ? '⭐ Huésped frecuente — ' + h.total_estadias + ' estadía(s) previa(s)' : 'Primera estadía' }}
        </p>
      </div>
      <button (click)="checkInForm.id_cliente=null; historialHuespedCheckIn=null" class="text-[10px] font-semibold text-amber-600 bg-transparent border-0 cursor-pointer hover:underline flex-shrink-0">Cambiar</button>
    </div>
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min="1" [(ngModel)]="checkInForm.noches" (ngModelChange)="estimarNoches$.next($event)" placeholder="Noches" />
    <p *ngIf="estimandoCheckIn" class="text-xs text-slate-400 m-0">Calculando tarifa...</p>
    <p *ngIf="!estimandoCheckIn && estimadoCheckIn" class="text-xs text-slate-500 m-0">
      Estimado: <span class="font-semibold text-slate-700">\${{ estimadoCheckIn.total | number:'1.0-2' }}</span> ({{ checkInForm.noches || 0 }} noche(s))
      <span *ngIf="hayTemporadaEnEstimado(estimadoCheckIn)" class="text-amber-600 font-semibold"> · incluye tarifa de temporada</span>
    </p>
    <p *ngIf="habSeleccionada?.precio === null" class="text-xs text-amber-600 m-0">Esta habitación no tiene precio definido — se cobrará $0 por hospedaje. Edítala desde el panel de ERP.</p>
    <p *ngIf="checkInError" class="text-xs text-red-600 m-0">{{ checkInError }}</p>
    <button (click)="confirmarCheckIn()" [disabled]="checkInSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#f59e0b">{{ checkInSaving ? 'Guardando...' : 'Confirmar Check-in' }}</button>
  </div>
</div>

<!-- Modal: reportar incidencia -->
<div *ngIf="incidenciaDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="incidenciaDialogOpen=false"></div>
<div *ngIf="incidenciaDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Reportar Incidencia — Hab. {{ habSeleccionada?.numero }}</h3>
  <div class="flex flex-col gap-3">
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="incidenciaForm.titulo" placeholder="Ej. Aire acondicionado no enfría" />
    <textarea class="px-3 py-2 border border-slate-200 rounded-lg text-sm" rows="2" [(ngModel)]="incidenciaForm.descripcion" placeholder="Detalles (opcional)"></textarea>
    <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="incidenciaForm.prioridad">
      <option value="baja">Prioridad baja</option>
      <option value="media">Prioridad media</option>
      <option value="alta">Prioridad alta</option>
    </select>
    <label *ngIf="habSeleccionada?.estado==='libre'" class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
      <input type="checkbox" [(ngModel)]="incidenciaForm.fuera_de_servicio" />
      Poner fuera de servicio hasta resolver
    </label>
    <p *ngIf="incidenciaError" class="text-xs text-red-600 m-0">{{ incidenciaError }}</p>
    <button (click)="guardarIncidencia()" [disabled]="incidenciaSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#f97316">{{ incidenciaSaving ? 'Guardando...' : 'Reportar' }}</button>
  </div>
</div>

<!-- Modal: nueva solicitud de huésped -->
<div *ngIf="solicitudDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="solicitudDialogOpen=false"></div>
<div *ngIf="solicitudDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Nueva Solicitud — Hab. {{ habSeleccionada?.numero }}</h3>
  <div class="flex flex-col gap-3">
    <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="solicitudForm.titulo" placeholder="Ej. Pide toallas extra / Ruido en el pasillo" />
    <textarea class="px-3 py-2 border border-slate-200 rounded-lg text-sm" rows="2" [(ngModel)]="solicitudForm.descripcion" placeholder="Detalles (opcional)"></textarea>
    <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="solicitudForm.categoria">
      <option value="solicitud">Solicitud</option>
      <option value="queja">Queja</option>
      <option value="otro">Otro</option>
    </select>
    <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="solicitudForm.prioridad">
      <option value="baja">Prioridad baja</option>
      <option value="media">Prioridad media</option>
      <option value="alta">Prioridad alta</option>
    </select>
    <p *ngIf="solicitudError" class="text-xs text-red-600 m-0">{{ solicitudError }}</p>
    <button (click)="guardarSolicitud()" [disabled]="solicitudSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#6366f1">{{ solicitudSaving ? 'Guardando...' : 'Registrar Solicitud' }}</button>
  </div>
</div>

<!-- Modal: registro formal (documento + firma) -->
<div *ngIf="registroDialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="registroDialogOpen=false"></div>
<div *ngIf="registroDialogOpen" [@modalLeave] class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[92%] max-w-sm z-[101] shadow-2xl p-6 modal-in">
  <h3 class="m-0 mb-4 text-lg font-semibold">Registro — Habitación {{ habSeleccionada?.numero }}</h3>
  <div class="flex flex-col gap-3">
    <div class="grid grid-cols-2 gap-3">
      <select class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="registroForm.documento_tipo">
        <option value="">Tipo de documento</option>
        <option value="INE">INE</option>
        <option value="Pasaporte">Pasaporte</option>
        <option value="Otro">Otro</option>
      </select>
      <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="registroForm.documento_numero" placeholder="Número de documento" />
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <label class="text-[11px] font-semibold text-slate-500">Firma del huésped</label>
        <button (click)="limpiarFirma()" class="text-[10px] font-semibold text-slate-400 bg-transparent border-0 cursor-pointer hover:underline">Limpiar</button>
      </div>
      <canvas #firmaCanvas width="300" height="140"
        class="border border-slate-200 rounded-lg bg-white touch-none w-full"
        style="touch-action: none;"
        (pointerdown)="iniciarFirma($event)" (pointermove)="dibujarFirma($event)" (pointerup)="terminarFirma()" (pointerleave)="terminarFirma()">
      </canvas>
      <p *ngIf="habSeleccionada?.estadia_activa?.firma_url && firmaVacia" class="text-[10px] text-emerald-600 m-0">Ya hay una firma guardada — dibuja aquí solo si quieres reemplazarla.</p>
    </div>

    <p *ngIf="registroError" class="text-xs text-red-600 m-0">{{ registroError }}</p>
    <button (click)="guardarRegistro()" [disabled]="registroSaving"
      class="w-full py-2.5 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      style="background:#f59e0b">{{ registroSaving ? 'Guardando...' : 'Guardar Registro' }}</button>
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
  private stockAlert = inject(StockAlertService);
  nicho = inject(NichoService);

  /** 'recepcion' muestra la gestión completa de habitaciones; cualquier otro valor es el nombre
   *  de una categoría de amenidad (Bar, Spa...) y renderiza el terminal dedicado de esa sección. */
  seccionActiva = 'recepcion';

  /** Secciones/amenidades que el hotel configuró en el onboarding, con su propio terminal. */
  get secciones(): string[] {
    return Array.from(new Set(
      this.nicho.hotelAmenidades.map(a => HOTEL_AMENIDAD_CATEGORIAS[a]).filter((n): n is string => !!n)
    ));
  }

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
  checkInForm = { huesped: '', noches: 1, id_cliente: null as number | null };
  checkInError = '';
  checkInSaving = false;

  estimarNoches$ = new Subject<number>();
  estimadoCheckIn: ErpEstimadoHospedaje | null = null;
  estimandoCheckIn = false;

  private tarifasTemporada: ErpTarifaTemporada[] = [];

  @ViewChild('firmaCanvas') firmaCanvasRef?: ElementRef<HTMLCanvasElement>;
  registroDialogOpen = false;
  registroForm = { documento_tipo: '', documento_numero: '' };
  registroError = '';
  registroSaving = false;
  firmaVacia = true;
  private dibujandoFirma = false;
  private ctxFirma: CanvasRenderingContext2D | null = null;

  buscandoClienteCheckIn = false;
  busquedaClienteCheckIn = '';
  buscarClienteCheckIn$ = new Subject<string>();
  clientesEncontradosCheckIn: Cliente[] = [];
  cargandoClientesCheckIn = false;
  historialHuespedCheckIn: ErpHistorialCliente | null = null;

  incidenciaDialogOpen = false;
  incidenciaForm = { titulo: '', descripcion: '', prioridad: 'media' as 'baja' | 'media' | 'alta', fuera_de_servicio: false };
  incidenciaError = '';
  incidenciaSaving = false;

  solicitudDialogOpen = false;
  solicitudForm = { titulo: '', descripcion: '', categoria: 'solicitud' as 'queja' | 'solicitud' | 'otro', prioridad: 'media' as 'baja' | 'media' | 'alta' };
  solicitudError = '';
  solicitudSaving = false;

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

    this.erpService.tarifasTemporada$.subscribe(tarifas => { this.tarifasTemporada = tarifas; this.cdr.detectChanges(); });
    this.erpService.cargarTarifasTemporada().subscribe();

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

    this.buscarClienteCheckIn$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.cargandoClientesCheckIn = true;
        return this.crmService.cargarClientes(1, search, '', 6);
      }),
    ).subscribe({
      next: pagina => { this.clientesEncontradosCheckIn = pagina.data; this.cargandoClientesCheckIn = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoClientesCheckIn = false; this.cdr.detectChanges(); },
    });

    this.estimarNoches$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(noches => {
        this.estimandoCheckIn = true;
        return this.erpService.cargarEstimadoHospedaje(this.habSeleccionada!.id, noches || 1);
      }),
    ).subscribe({
      next: estimado => { this.estimadoCheckIn = estimado; this.estimandoCheckIn = false; this.cdr.detectChanges(); },
      error: () => { this.estimandoCheckIn = false; this.cdr.detectChanges(); },
    });
  }

  hayTemporadaEnEstimado(estimado: ErpEstimadoHospedaje): boolean {
    return estimado.detalle.some(d => !!d.temporada);
  }

  abrirRegistro(h: ErpHabitacion) {
    this.habSeleccionada = h;
    const activa = h.estadia_activa;
    this.registroForm = { documento_tipo: activa?.documento_tipo || '', documento_numero: activa?.documento_numero || '' };
    this.registroError = '';
    this.firmaVacia = true;
    this.ctxFirma = null;
    this.registroDialogOpen = true;
    setTimeout(() => this.limpiarFirma(), 0);
  }

  iniciarFirma(e: PointerEvent) {
    const canvas = this.firmaCanvasRef?.nativeElement;
    if (!canvas) return;
    this.ctxFirma = canvas.getContext('2d');
    if (!this.ctxFirma) return;
    this.dibujandoFirma = true;
    this.firmaVacia = false;
    const rect = canvas.getBoundingClientRect();
    this.ctxFirma.beginPath();
    this.ctxFirma.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  dibujarFirma(e: PointerEvent) {
    if (!this.dibujandoFirma || !this.ctxFirma) return;
    const canvas = this.firmaCanvasRef!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.ctxFirma.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctxFirma.strokeStyle = '#1e293b';
    this.ctxFirma.lineWidth = 2;
    this.ctxFirma.lineCap = 'round';
    this.ctxFirma.stroke();
  }

  terminarFirma() {
    this.dibujandoFirma = false;
  }

  limpiarFirma() {
    const canvas = this.firmaCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    this.firmaVacia = true;
  }

  guardarRegistro() {
    if (!this.habSeleccionada || this.registroSaving) return;
    this.registroSaving = true;
    this.registroError = '';

    const enviar = (firma: Blob | null) => {
      this.erpService.registrarDocumentoHabitacion(this.habSeleccionada!.id, {
        documento_tipo: this.registroForm.documento_tipo || undefined,
        documento_numero: this.registroForm.documento_numero || undefined,
        firma: firma ?? undefined,
      }).subscribe({
        next: actualizada => {
          this.habSeleccionada = actualizada;
          this.registroSaving = false;
          this.registroDialogOpen = false;
          this.notify.success('Registro guardado');
          this.cdr.detectChanges();
        },
        error: err => {
          this.registroSaving = false;
          this.registroError = err?.error?.message || 'No se pudo guardar el registro';
          this.cdr.detectChanges();
        },
      });
    };

    const canvas = this.firmaCanvasRef?.nativeElement;
    if (canvas && !this.firmaVacia) {
      canvas.toBlob(blob => enviar(blob), 'image/png');
    } else {
      enviar(null);
    }
  }

  abrirCheckIn() {
    this.checkInForm = { huesped: '', noches: 1, id_cliente: null };
    this.checkInError = '';
    this.buscandoClienteCheckIn = false;
    this.busquedaClienteCheckIn = '';
    this.clientesEncontradosCheckIn = [];
    this.historialHuespedCheckIn = null;
    this.estimadoCheckIn = null;
    this.checkInDialogOpen = true;
    this.estimarNoches$.next(1);
  }

  seleccionarClienteCheckIn(c: Cliente) {
    this.checkInForm.id_cliente = c.id_cliente;
    this.checkInForm.huesped = c.nombre;
    this.buscandoClienteCheckIn = false;
    this.busquedaClienteCheckIn = '';
    this.clientesEncontradosCheckIn = [];
    this.historialHuespedCheckIn = null;
    this.erpService.cargarHistorialCliente(c.id_cliente).subscribe(h => { this.historialHuespedCheckIn = h; this.cdr.detectChanges(); });
  }

  categoriaActivaRoomService = '';
  busquedaRoomService = '';
  private cantidadesRoomService: Record<number, number> = {};

  cantidadDe(producto: Producto): number {
    return this.cantidadesRoomService[producto.id_productos] ?? 1;
  }

  cambiarCantidadProducto(producto: Producto, delta: number) {
    const nueva = Math.max(1, this.cantidadDe(producto) + delta);
    const max = producto.controla_stock === false ? nueva : Math.max(1, producto.stock);
    this.cantidadesRoomService[producto.id_productos] = Math.min(nueva, max);
  }

  sinStock(p: Producto): boolean {
    return this.stockAlert.sinStock(p);
  }

  stockBajo(p: Producto): boolean {
    return this.stockAlert.stockBajo(p);
  }

  productoSinStock(idProducto: number | null): boolean {
    if (!idProducto) return false;
    const producto = this.productos.find(p => p.id_productos === idProducto);
    return !!producto && this.sinStock(producto);
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
    this.erpService.checkInHabitacion(this.habSeleccionada.id, this.checkInForm.huesped, this.checkInForm.noches || 1, this.checkInForm.id_cliente ?? undefined).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        this.checkInSaving = false;
        this.checkInDialogOpen = false;
        this.checkInForm = { huesped: '', noches: 1, id_cliente: null };
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
    if (this.sinStock(producto)) {
      this.notify.error(`"${producto.nombre}" no tiene stock disponible`);
      return;
    }
    this.erpService.agregarConsumoHabitacion(this.habSeleccionada.id, { id_producto: producto.id_productos, cantidad: this.cantidadDe(producto) }).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        delete this.cantidadesRoomService[producto.id_productos];
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el consumo'),
    });
  }

  quitarConsumo(hab: ErpHabitacion, consumo: ErpHabitacionConsumo) {
    this.erpService.quitarConsumoHabitacion(hab.id, consumo.id, 1).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo quitar el consumo'),
    });
  }

  incrementarConsumo(hab: ErpHabitacion, consumo: ErpHabitacionConsumo) {
    if (!consumo.id_producto) return;
    if (this.productoSinStock(consumo.id_producto)) {
      this.notify.error(`"${consumo.nombre}" no tiene stock disponible`);
      return;
    }
    this.erpService.agregarConsumoHabitacion(hab.id, { id_producto: consumo.id_producto, cantidad: 1 }).subscribe({
      next: actualizada => {
        this.habSeleccionada = actualizada;
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo agregar el consumo'),
    });
  }

  toggleMantenimiento(h: ErpHabitacion) {
    const estado = h.estado === 'mantenimiento' ? 'libre' : 'mantenimiento';
    this.erpService.marcarMantenimiento(h.id, estado).subscribe(actualizada => { this.habSeleccionada = actualizada; this.cdr.detectChanges(); });
  }

  private ordenLimpieza: ErpHabitacion['estado_limpieza'][] = ['sucia', 'en_limpieza', 'inspeccion', 'limpia'];

  siguienteEstadoLimpieza(h: ErpHabitacion) {
    const idx = this.ordenLimpieza.indexOf(h.estado_limpieza);
    const siguiente = this.ordenLimpieza[(idx + 1) % this.ordenLimpieza.length];
    this.erpService.marcarLimpieza(h.id, siguiente).subscribe(actualizada => { this.habSeleccionada = actualizada; this.cdr.detectChanges(); });
  }

  limpiezaLabel(estado: ErpHabitacion['estado_limpieza']): string {
    const labels: Record<ErpHabitacion['estado_limpieza'], string> = {
      limpia: 'Limpia', sucia: 'Sucia', en_limpieza: 'En limpieza', inspeccion: 'Inspección',
    };
    return labels[estado];
  }

  abrirReportarIncidencia(h: ErpHabitacion) {
    this.habSeleccionada = h;
    this.incidenciaForm = { titulo: '', descripcion: '', prioridad: 'media', fuera_de_servicio: false };
    this.incidenciaError = '';
    this.incidenciaDialogOpen = true;
  }

  guardarIncidencia() {
    if (!this.habSeleccionada || this.incidenciaSaving) return;
    if (!this.incidenciaForm.titulo.trim()) { this.incidenciaError = 'Describe brevemente el problema.'; return; }

    this.incidenciaSaving = true;
    this.incidenciaError = '';

    this.erpService.reportarIncidencia(this.habSeleccionada.id, {
      titulo: this.incidenciaForm.titulo,
      descripcion: this.incidenciaForm.descripcion || undefined,
      prioridad: this.incidenciaForm.prioridad,
      fuera_de_servicio: this.incidenciaForm.fuera_de_servicio,
    }).subscribe({
      next: () => {
        this.incidenciaSaving = false;
        this.incidenciaDialogOpen = false;
        this.notify.success('Incidencia reportada');
        this.cdr.detectChanges();
      },
      error: err => {
        this.incidenciaSaving = false;
        this.incidenciaError = err?.error?.message || 'No se pudo reportar la incidencia';
        this.cdr.detectChanges();
      },
    });
  }

  abrirReportarSolicitud(h: ErpHabitacion) {
    this.habSeleccionada = h;
    this.solicitudForm = { titulo: '', descripcion: '', categoria: 'solicitud', prioridad: 'media' };
    this.solicitudError = '';
    this.solicitudDialogOpen = true;
  }

  guardarSolicitud() {
    if (!this.habSeleccionada || this.solicitudSaving) return;
    if (!this.solicitudForm.titulo.trim()) { this.solicitudError = 'Describe brevemente la solicitud.'; return; }

    this.solicitudSaving = true;
    this.solicitudError = '';

    this.erpService.reportarSolicitudHuesped(this.habSeleccionada.id, {
      titulo: this.solicitudForm.titulo,
      descripcion: this.solicitudForm.descripcion || undefined,
      categoria: this.solicitudForm.categoria,
      prioridad: this.solicitudForm.prioridad,
    }).subscribe({
      next: () => {
        this.solicitudSaving = false;
        this.solicitudDialogOpen = false;
        this.notify.success('Solicitud registrada');
        this.cdr.detectChanges();
      },
      error: err => {
        this.solicitudSaving = false;
        this.solicitudError = err?.error?.message || 'No se pudo registrar la solicitud';
        this.cdr.detectChanges();
      },
    });
  }

  toggleSalida(h: ErpHabitacion) {
    const estado = h.estado === 'checkout' ? 'ocupada' : 'checkout';
    this.erpService.marcarSalidaHabitacion(h.id, estado).subscribe(actualizada => { this.habSeleccionada = actualizada; this.cdr.detectChanges(); });
  }

  totalHospedaje(h: ErpHabitacion): number {
    return this.calcularCargoHospedaje(h).total;
  }

  hayTemporadaEnHospedaje(h: ErpHabitacion): boolean {
    return this.calcularCargoHospedaje(h).huboTemporada;
  }

  /** Réplica en el front de TarifaTemporadaService::calcularCargoHospedaje() del backend, noche por noche. */
  private calcularCargoHospedaje(h: ErpHabitacion): { total: number; huboTemporada: boolean } {
    const precioBase = h.precio ?? 0;
    const noches = h.noches ?? 0;
    if (!h.check_in || noches <= 0) {
      return { total: precioBase * noches, huboTemporada: false };
    }

    let total = 0;
    let huboTemporada = false;
    const fecha = new Date(`${h.check_in}T00:00:00`);

    for (let i = 0; i < noches; i++) {
      const fechaStr = fecha.toISOString().slice(0, 10);
      const temporada = this.tarifasTemporada.find(t => fechaStr >= t.fecha_inicio && fechaStr <= t.fecha_fin);

      let tarifaNoche = precioBase;
      if (temporada) {
        tarifaNoche = temporada.tipo_ajuste === 'porcentaje'
          ? precioBase * (1 + temporada.valor / 100)
          : precioBase + temporada.valor;
        tarifaNoche = Math.max(0, tarifaNoche);
        huboTemporada = true;
      }

      total += tarifaNoche;
      fecha.setDate(fecha.getDate() + 1);
    }

    return { total: Math.round(total * 100) / 100, huboTemporada };
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
