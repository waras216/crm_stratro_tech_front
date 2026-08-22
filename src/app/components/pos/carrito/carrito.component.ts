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
  @Output() establecerCantidad = new EventEmitter<{ id: number; cantidad: number }>();
  @Output() quitar = new EventEmitter<number>();
  @Output() cobrar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();

  get total() { return this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0); }
  get totalItems() { return this.items.reduce((s, i) => s + i.cantidad, 0); }
  get totalItemsLabel() { return this.totalItems > 999 ? '999+' : String(this.totalItems); }

  onCantidadInput(id: number, valor: string, input: HTMLInputElement) {
    const cantidad = Math.floor(Number(valor));
    if (!Number.isFinite(cantidad) || cantidad < 1) { input.value = String(this.items.find(i => i.producto.id_productos === id)?.cantidad ?? 1); return; }
    this.establecerCantidad.emit({ id, cantidad });
  }
}
