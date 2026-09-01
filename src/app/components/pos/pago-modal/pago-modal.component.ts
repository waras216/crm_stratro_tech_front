import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PedidoPago } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

interface FilaPago {
  metodo_pago: PedidoPago['metodo_pago'];
  monto: number;
}

@Component({
  selector: 'app-pos-pago-modal',
  standalone: false,
  templateUrl: './pago-modal.component.html',
  styleUrls: ['./pago-modal.component.scss'],
  animations: [modalLeave],
})
export class PagoModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() total = 0;
  @Output() confirmar = new EventEmitter<PedidoPago[]>();
  @Output() cancelado = new EventEmitter<void>();

  readonly metodos: { valor: PedidoPago['metodo_pago']; etiqueta: string }[] = [
    { valor: 'efectivo', etiqueta: 'Efectivo' },
    { valor: 'tarjeta_debito', etiqueta: 'Tarjeta Débito' },
    { valor: 'tarjeta_credito', etiqueta: 'Tarjeta Crédito' },
  ];

  filas: FilaPago[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.filas = this.total > 0 ? [{ metodo_pago: 'efectivo', monto: this.total }] : [];
    }
  }

  agregarFila() {
    this.filas.push({ metodo_pago: 'efectivo', monto: Math.max(this.diferencia, 0) });
  }

  quitarFila(i: number) {
    if (this.filas.length > 1) this.filas.splice(i, 1);
  }

  get asignado(): number {
    return Math.round(this.filas.reduce((s, f) => s + (Number(f.monto) || 0), 0) * 100) / 100;
  }

  get diferencia(): number {
    return Math.round((this.total - this.asignado) * 100) / 100;
  }

  get valido(): boolean {
    if (this.total === 0) return this.filas.length === 0;
    return Math.abs(this.diferencia) < 0.01 && this.filas.every(f => Number(f.monto) > 0);
  }

  onConfirmar() {
    if (!this.valido) return;
    this.confirmar.emit(this.filas.map(f => ({ metodo_pago: f.metodo_pago, monto: Number(f.monto) })));
  }

  onCancelar() {
    this.cancelado.emit();
  }
}
