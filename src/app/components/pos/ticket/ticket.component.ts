import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ItemCarrito } from '../carrito/carrito.component';

@Component({
  selector: 'app-pos-ticket',
  standalone: false,
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
})
export class PosTicketComponent {
  @Input() items: ItemCarrito[] = [];
  @Input() visible = false;
  @Output() cerrar = new EventEmitter<void>();

  get total() { return (this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0) * 1.16).toFixed(2); }
}
