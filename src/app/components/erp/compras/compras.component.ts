import { Component } from '@angular/core';

interface OrdenCompra {
  id: number; proveedor: string; fecha: string; estado: 'pendiente' | 'recibida' | 'cancelada';
  items: number; total: number;
}

@Component({
  selector: 'app-erp-compras',
  standalone: false,
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss'],
})
export class ErpComprasComponent {
  dialogOpen = false;
  form = { proveedor: '', items: '', total: '' };
  private nextId = 1006;

  ordenes: OrdenCompra[] = [
    { id: 1001, proveedor: 'Tech Distribuidores SA', fecha: '2026-06-08', estado: 'pendiente', items: 15, total: 45000 },
    { id: 1002, proveedor: 'Mobiliario Express', fecha: '2026-06-05', estado: 'recibida', items: 8, total: 32000 },
    { id: 1003, proveedor: 'Periféricos MX', fecha: '2026-06-03', estado: 'recibida', items: 50, total: 67500 },
    { id: 1004, proveedor: 'Redes y Conectividad', fecha: '2026-06-01', estado: 'cancelada', items: 10, total: 22000 },
    { id: 1005, proveedor: 'Storage Solutions', fecha: '2026-05-28', estado: 'recibida', items: 30, total: 45000 },
  ];

  get totalPendiente() { return this.ordenes.filter(o => o.estado === 'pendiente').reduce((s, o) => s + o.total, 0); }

  openNew() { this.form = { proveedor: '', items: '', total: '' }; this.dialogOpen = true; }

  submit() {
    if (!this.form.proveedor) return;
    this.ordenes.unshift({
      id: this.nextId++, proveedor: this.form.proveedor,
      fecha: new Date().toISOString().split('T')[0], estado: 'pendiente',
      items: Number(this.form.items) || 0, total: Number(this.form.total) || 0,
    });
    this.dialogOpen = false;
  }

  recibir(id: number) { const o = this.ordenes.find(x => x.id === id); if (o) o.estado = 'recibida'; }
  cancelar(id: number) { const o = this.ordenes.find(x => x.id === id); if (o) o.estado = 'cancelada'; }
}
