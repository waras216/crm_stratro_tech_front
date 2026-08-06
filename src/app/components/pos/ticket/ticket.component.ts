import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ItemCarrito } from '../carrito/carrito.component';
import { AuthService } from '../../../core/auth/authservices';

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

@Component({
  selector: 'app-pos-ticket',
  standalone: false,
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
})
export class PosTicketComponent {
  private auth = inject(AuthService);

  @Input() items: ItemCarrito[] = [];
  @Input() visible = false;
  @Output() cerrar = new EventEmitter<void>();

  get total() { return this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0).toFixed(2); }

  imprimir() {
    const empresa = this.auth.session?.empresa || '';
    const fecha = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

    const filas = this.items.map(item => {
      const subtotal = (item.producto.precio * item.cantidad).toFixed(2);
      return `
        <div class="fila">
          <span>${escapeHtml(item.producto.nombre)} x${item.cantidad}</span>
          <span>$${subtotal}</span>
        </div>`;
    }).join('');

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Ticket</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    width: 80mm;
    margin: 0;
    padding: 4mm;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #000;
  }
  h1 { font-size: 14px; text-align: center; margin: 0 0 2px; }
  .sub { text-align: center; font-size: 11px; margin: 0 0 8px; }
  .linea { border-top: 1px dashed #000; margin: 6px 0; }
  .fila { display: flex; justify-content: space-between; padding: 2px 0; }
  .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
  .footer { text-align: center; font-size: 11px; margin-top: 10px; }
</style>
</head>
<body>
  <h1>${escapeHtml(empresa)}</h1>
  <p class="sub">${escapeHtml(fecha)}</p>
  <div class="linea"></div>
  ${filas}
  <div class="linea"></div>
  <div class="total"><span>TOTAL</span><span>$${this.total}</span></div>
  <p class="footer">¡Gracias por su compra!</p>
</body>
</html>`;

    const ventana = window.open('', '_blank', 'width=340,height=600');
    if (!ventana) return;
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.onload = () => {
      ventana.focus();
      ventana.print();
    };
    ventana.onafterprint = () => ventana.close();
  }
}
