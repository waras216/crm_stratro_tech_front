import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpInventario } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-inventario',
  standalone: false,
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class ErpInventarioComponent implements OnInit {
  search = '';
  dialogOpen = false;
  saving = false;
  error = '';
  form = { nombre: '', sku: '', categoria: 'General', stock: '', stockMinimo: '', precioCompra: '', precioVenta: '' };

  inventario: ErpInventario[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarInventario().subscribe();
    this.erpService.inventario$.subscribe(data => { this.inventario = data; this.cdr.detectChanges(); });
  }

  get filtrado() { return this.inventario.filter(p => p.nombre.toLowerCase().includes(this.search.toLowerCase()) || p.sku.toLowerCase().includes(this.search.toLowerCase())); }
  get valorTotal() { return this.inventario.reduce((s, p) => s + p.precio_venta * p.stock, 0); }
  get stockBajo() { return this.inventario.filter(p => p.stock <= p.stock_minimo).length; }

  openNew() { this.form = { nombre: '', sku: '', categoria: 'General', stock: '', stockMinimo: '', precioCompra: '', precioVenta: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.sku) { this.error = 'Nombre y SKU son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addInventario({
      nombre: this.form.nombre,
      sku: this.form.sku,
      categoria: this.form.categoria || 'General',
      stock: Number(this.form.stock) || 0,
      stock_minimo: Number(this.form.stockMinimo) || 0,
      precio_compra: Number(this.form.precioCompra) || 0,
      precio_venta: Number(this.form.precioVenta) || 0,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el producto. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  eliminar(id: number) {
    this.erpService.deleteInventario(id).subscribe({
      next: () => this.cdr.detectChanges(),
      error: (err) => console.error(err),
    });
  }
}
