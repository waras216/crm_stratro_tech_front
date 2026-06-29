import { Component, OnInit } from '@angular/core';
import { ProductoPOS } from './catalogo/catalogo.component';
import { ItemCarrito } from './carrito/carrito.component';
import { PosTab } from './layout/pos-layout.component';
import { NichoService } from '../../core/services/nicho.service';

@Component({
  selector: 'app-pos-page',
  standalone: false,
  template: `
    <app-pos-layout [tabActivo]="tab" (cambiarTab)="tab=$event">

      <!-- ── TERMINAL FARMACIA ── -->
      <ng-container *ngIf="tab==='terminal' && nicho.nicho==='farmacia'">
        <app-pos-terminal-farmacia></app-pos-terminal-farmacia>
      </ng-container>

      <!-- ── TERMINAL HOTEL ── -->
      <ng-container *ngIf="tab==='terminal' && nicho.nicho==='hotel'">
        <app-pos-terminal-hotel></app-pos-terminal-hotel>
      </ng-container>

      <!-- ── TERMINAL RESTAURANTE ── -->
      <ng-container *ngIf="tab==='terminal' && nicho.nicho==='restaurante'">
        <app-pos-terminal-restaurante></app-pos-terminal-restaurante>
      </ng-container>

      <!-- ── TERMINAL GENÉRICO (tienda, almacen, startup, default) ── -->
      <div *ngIf="tab==='terminal' && nicho.nicho!=='farmacia' && nicho.nicho!=='hotel' && nicho.nicho!=='restaurante'"
        class="flex gap-4 h-full">
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

      <!-- ── HISTORIAL ── -->
      <div *ngIf="tab==='historial'" class="page-enter">
        <div class="bg-white border border-slate-200 rounded-xl p-5">
          <h2 class="text-sm font-bold text-slate-800 m-0 mb-4">{{ nicho.config.posHistorial }}</h2>
          <div *ngIf="historial.length===0" class="text-center py-12 text-slate-400 text-sm">No hay registros aún</div>
          <div *ngFor="let v of historial; let i = index"
            class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 card-enter"
            [style.animation-delay]="(i*0.04)+'s'">
            <div>
              <p class="text-sm font-medium text-slate-700 m-0">Venta #{{ v.id }}</p>
              <p class="text-[10px] text-slate-400 m-0">{{ v.items }} productos · {{ v.fecha }}</p>
            </div>
            <span class="text-sm font-bold text-emerald-600">\${{ v.total.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <app-pos-ticket [items]="lastTicket" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
    </app-pos-layout>
  `,
  styles: [':host { display: block; height: 100%; }'],
})
export class PosPageComponent {
  tab: PosTab = 'terminal';
  carrito: ItemCarrito[] = [];
  ticketOpen = false;
  lastTicket: ItemCarrito[] = [];
  historial: { id: number; items: number; total: number; fecha: string }[] = [];
  private ventaCounter = 1;

  constructor(public nicho: NichoService) {}

  agregarAlCarrito(producto: ProductoPOS) {
    const item = this.carrito.find(i => i.producto.id === producto.id);
    if (item) item.cantidad++;
    else this.carrito = [...this.carrito, { producto, cantidad: 1 }];
  }

  onCambiarCantidad(ev: { id: number; delta: number }) {
    const item = this.carrito.find(i => i.producto.id === ev.id);
    if (!item) return;
    item.cantidad += ev.delta;
    if (item.cantidad <= 0) this.quitarItem(ev.id);
  }

  quitarItem(id: number) { this.carrito = this.carrito.filter(i => i.producto.id !== id); }
  limpiarCarrito() { this.carrito = []; }

  cobrar() {
    if (this.carrito.length === 0) return;
    const total = this.carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
    this.historial.unshift({
      id: this.ventaCounter++,
      items: this.carrito.reduce((s, i) => s + i.cantidad, 0),
      total,
      fecha: new Date().toLocaleString()
    });
    this.lastTicket = [...this.carrito];
    this.carrito = [];
    this.ticketOpen = true;
  }
}
