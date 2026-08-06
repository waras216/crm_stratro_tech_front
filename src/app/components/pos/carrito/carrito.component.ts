import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ProductoPOS } from '../catalogo/catalogo.component';

export interface ItemCarrito { producto: ProductoPOS; cantidad: number; }

@Component({
  selector: 'app-pos-carrito',
  standalone: false,
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss'],
})
export class PosCarritoComponent {
  @Input() items: ItemCarrito[] = [];
  @Output() cambiarCantidad = new EventEmitter<{ id: number; delta: number }>();
  @Output() quitar = new EventEmitter<number>();
  @Output() cobrar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();

  get total() { return this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0); }
  get totalItems() { return this.items.reduce((s, i) => s + i.cantidad, 0); }
}
