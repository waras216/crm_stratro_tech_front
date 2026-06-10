import { Component } from '@angular/core';
import { ProductoPOS } from './catalogo/catalogo.component';
import { ItemCarrito } from './carrito/carrito.component';

@Component({
  selector: 'app-pos-page',
  standalone: false,
  template: `
    <app-pos-layout>
      <div class="flex gap-4 h-full">
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
      <app-pos-ticket [items]="lastTicket" [visible]="ticketOpen" (cerrar)="ticketOpen=false"></app-pos-ticket>
    </app-pos-layout>
  `,
  styles: [':host { display: block; height: 100%; }'],
})
export class PosPageComponent {
  carrito: ItemCarrito[] = [];
  ticketOpen = false;
  lastTicket: ItemCarrito[] = [];

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
    this.lastTicket = [...this.carrito];
    this.carrito = [];
    this.ticketOpen = true;
  }
}
