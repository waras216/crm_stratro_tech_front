import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ProductoPOS } from '../catalogo/catalogo.component';
import { StockAlertService } from '../../../core/services/stock-alert.service';

export interface ItemCarrito { producto: ProductoPOS; cantidad: number; }

@Component({
  selector: 'app-pos-carrito',
  standalone: false,
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.scss'],
})
export class PosCarritoComponent {
  private stockAlert = inject(StockAlertService);

  @Input() items: ItemCarrito[] = [];
  @Output() cambiarCantidad = new EventEmitter<{ id: number; delta: number }>();
  @Output() establecerCantidad = new EventEmitter<{ id: number; cantidad: number }>();
  @Output() quitar = new EventEmitter<number>();
  @Output() cobrar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();

  get total() { return this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0); }
  get totalItems() { return this.items.reduce((s, i) => s + i.cantidad, 0); }
  get totalItemsLabel() { return this.totalItems > 999 ? '999+' : String(this.totalItems); }

  /** El "+" ya alcanzó el stock disponible: incrementar más dejaría vender lo que no hay. */
  alcanzoMaximo(item: ItemCarrito): boolean {
    return item.cantidad >= this.stockAlert.disponible(item.producto);
  }

  stockBajo(item: ItemCarrito): boolean {
    return this.stockAlert.stockBajo(item.producto);
  }

  onCantidadInput(id: number, valor: string, input: HTMLInputElement) {
    const item = this.items.find(i => i.producto.id_productos === id);
    const cantidad = Math.floor(Number(valor));
    if (!Number.isFinite(cantidad) || cantidad < 1) { input.value = String(item?.cantidad ?? 1); return; }
    const max = item ? this.stockAlert.disponible(item.producto) : Infinity;
    const acotada = Math.min(cantidad, max);
    if (acotada !== cantidad) input.value = String(acotada);
    this.establecerCantidad.emit({ id, cantidad: acotada });
  }
}
