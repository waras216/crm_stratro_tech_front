import { Component } from '@angular/core';

interface Movimiento {
  id: number; concepto: string; tipo: 'ingreso' | 'egreso'; monto: number; fecha: string; categoria: string;
}

@Component({
  selector: 'app-erp-finanzas',
  standalone: false,
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
})
export class ErpFinanzasComponent {
  movimientos: Movimiento[] = [
    { id: 1, concepto: 'Venta lote laptops', tipo: 'ingreso', monto: 147000, fecha: '2026-06-10', categoria: 'Ventas' },
    { id: 2, concepto: 'Compra inventario', tipo: 'egreso', monto: 45000, fecha: '2026-06-08', categoria: 'Compras' },
    { id: 3, concepto: 'Servicio consultoría', tipo: 'ingreso', monto: 55000, fecha: '2026-06-07', categoria: 'Servicios' },
    { id: 4, concepto: 'Nómina quincenal', tipo: 'egreso', monto: 120000, fecha: '2026-06-06', categoria: 'Nómina' },
    { id: 5, concepto: 'Venta periféricos', tipo: 'ingreso', monto: 28000, fecha: '2026-06-05', categoria: 'Ventas' },
    { id: 6, concepto: 'Renta oficina', tipo: 'egreso', monto: 35000, fecha: '2026-06-01', categoria: 'Operación' },
    { id: 7, concepto: 'Licencias software', tipo: 'egreso', monto: 18000, fecha: '2026-05-30', categoria: 'Software' },
    { id: 8, concepto: 'Proyecto ERP cliente', tipo: 'ingreso', monto: 89000, fecha: '2026-05-28', categoria: 'Servicios' },
  ];

  get ingresos() { return this.movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0); }
  get egresos() { return this.movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0); }
  get balance() { return this.ingresos - this.egresos; }
}
