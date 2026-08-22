import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/authservices';
import { ErpPedido } from '../../../models/erp.models';
import { ItemCarrito } from '../carrito/carrito.component';
import { modalLeave } from '../../shared/animations';

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

const METODO_PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta_debito: 'Tarjeta débito',
  tarjeta_credito: 'Tarjeta crédito',
};

@Component({
  selector: 'app-pos-ticket',
  standalone: false,
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
  animations: [modalLeave],
})
export class PosTicketComponent {
  private auth = inject(AuthService);

  /** Modo detallado (venta genérica vía Pedido): cliente, cajero, método de pago, fecha/hora exacta. */
  @Input() pedido: ErpPedido | null = null;
  /** Modo simple, retrocompatible con terminales que no arman un Pedido (farmacia dispensa recetas, etc). */
  @Input() items: ItemCarrito[] = [];
  @Input() visible = false;
  @Output() cerrar = new EventEmitter<void>();

  get filasTicket(): { nombre: string; cantidad: number; subtotal: number }[] {
    if (this.pedido) {
      return this.pedido.items.map(i => ({
        nombre: i.producto?.nombre ?? i.descripcion ?? `Producto #${i.id_producto}`,
        cantidad: i.cantidad,
        subtotal: i.precio_unitario * i.cantidad,
      }));
    }
    return this.items.map(i => ({ nombre: i.producto.nombre, cantidad: i.cantidad, subtotal: i.producto.precio * i.cantidad }));
  }

  get total() {
    if (this.pedido) return this.pedido.total.toFixed(2);
    return this.items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0).toFixed(2);
  }

  get clienteNombre() { return this.pedido?.cliente?.nombre ?? 'Público General'; }
  get cajeroNombre() { return this.pedido?.cajero?.nombre ?? null; }

  get fechaHora(): string {
    const raw = this.pedido?.created_at ?? this.pedido?.fecha;
    if (!raw) return '';
    return new Date(raw).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  }

  metodosPagoTexto(): string {
    if (!this.pedido?.pagos?.length) return '';
    return this.pedido.pagos.map(p => METODO_PAGO_LABEL[p.metodo_pago] ?? p.metodo_pago).join(', ');
  }

  imprimir() {
    const empresa = this.auth.session?.empresa || '';
    const fecha = this.fechaHora || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    const pedidoNum = this.pedido?.id ? `Venta #${this.pedido.id}` : '';
    const cliente = this.pedido ? this.clienteNombre : null;
    const cajero = this.cajeroNombre;
    const metodos = this.metodosPagoTexto();

    const filas = this.filasTicket.map(item => `
        <div class="fila">
          <span>${escapeHtml(item.nombre)} x${item.cantidad}</span>
          <span>$${item.subtotal.toFixed(2)}</span>
        </div>`).join('');

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
  .meta { font-size: 11px; margin: 1px 0; }
  .footer { text-align: center; font-size: 11px; margin-top: 10px; }
</style>
</head>
<body>
  <h1>${escapeHtml(empresa)}</h1>
  <p class="sub">${escapeHtml(fecha)}${pedidoNum ? ' · ' + escapeHtml(pedidoNum) : ''}</p>
  <div class="linea"></div>
  ${cliente ? `<p class="meta">Cliente: ${escapeHtml(cliente)}</p>` : ''}
  ${cajero ? `<p class="meta">Atendió: ${escapeHtml(cajero)}</p>` : ''}
  <div class="linea"></div>
  ${filas}
  <div class="linea"></div>
  <div class="total"><span>TOTAL</span><span>$${this.total}</span></div>
  ${metodos ? `<p class="meta" style="text-align:center;margin-top:4px;">Pago: ${escapeHtml(metodos)}</p>` : ''}
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
