import { Component } from '@angular/core';

export interface ProductoInventario {
  id: number; nombre: string; sku: string; categoria: string;
  stock: number; stockMinimo: number; precioCompra: number; precioVenta: number;
}

@Component({
  selector: 'app-erp-inventario',
  standalone: false,
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class ErpInventarioComponent {
  search = '';
  dialogOpen = false;
  form = { nombre: '', sku: '', categoria: 'General', stock: '', stockMinimo: '', precioCompra: '', precioVenta: '' };
  private nextId = 9;

  inventario: ProductoInventario[] = [
    { id: 1, nombre: 'Laptop ProMax 15"', sku: 'LAP-001', categoria: 'Electrónica', stock: 12, stockMinimo: 5, precioCompra: 18000, precioVenta: 24500 },
    { id: 2, nombre: 'Monitor 27" 4K', sku: 'MON-002', categoria: 'Electrónica', stock: 8, stockMinimo: 3, precioCompra: 6500, precioVenta: 8900 },
    { id: 3, nombre: 'Teclado Mecánico', sku: 'TEC-003', categoria: 'Periféricos', stock: 25, stockMinimo: 10, precioCompra: 1200, precioVenta: 1800 },
    { id: 4, nombre: 'Silla Ergonómica', sku: 'SIL-004', categoria: 'Mobiliario', stock: 3, stockMinimo: 5, precioCompra: 4500, precioVenta: 6200 },
    { id: 5, nombre: 'Webcam HD', sku: 'CAM-005', categoria: 'Periféricos', stock: 15, stockMinimo: 8, precioCompra: 900, precioVenta: 1350 },
    { id: 6, nombre: 'Escritorio Ajustable', sku: 'ESC-006', categoria: 'Mobiliario', stock: 2, stockMinimo: 4, precioCompra: 8000, precioVenta: 11500 },
    { id: 7, nombre: 'Disco SSD 1TB', sku: 'SSD-007', categoria: 'Almacenamiento', stock: 30, stockMinimo: 15, precioCompra: 1500, precioVenta: 2100 },
    { id: 8, nombre: 'Router WiFi 6', sku: 'NET-008', categoria: 'Redes', stock: 10, stockMinimo: 5, precioCompra: 2200, precioVenta: 3100 },
  ];

  get filtrado() { return this.inventario.filter(p => p.nombre.toLowerCase().includes(this.search.toLowerCase()) || p.sku.toLowerCase().includes(this.search.toLowerCase())); }
  get valorTotal() { return this.inventario.reduce((s, p) => s + p.precioVenta * p.stock, 0); }
  get stockBajo() { return this.inventario.filter(p => p.stock <= p.stockMinimo).length; }

  openNew() { this.form = { nombre: '', sku: '', categoria: 'General', stock: '', stockMinimo: '', precioCompra: '', precioVenta: '' }; this.dialogOpen = true; }

  submit() {
    if (!this.form.nombre || !this.form.sku) return;
    this.inventario.push({
      id: this.nextId++, nombre: this.form.nombre, sku: this.form.sku, categoria: this.form.categoria,
      stock: Number(this.form.stock) || 0, stockMinimo: Number(this.form.stockMinimo) || 5,
      precioCompra: Number(this.form.precioCompra) || 0, precioVenta: Number(this.form.precioVenta) || 0,
    });
    this.dialogOpen = false;
  }

  eliminar(id: number) { this.inventario = this.inventario.filter(p => p.id !== id); }
}
