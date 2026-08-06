import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Producto, Categoria, ErpMovimientoStock } from '../../../models/erp.models';

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
  form = { nombre: '', sku: '', id_categorias: '', stock: '', stockMinimo: '', precioCompra: '', precio: '' };

  ajusteDialogOpen = false;
  ajusteTarget: Producto | null = null;
  ajusteForm = { cantidad: '', motivo: '' };
  ajusteError = '';

  movimientosDialogOpen = false;
  movimientosTarget: Producto | null = null;
  movimientos: ErpMovimientoStock[] = [];

  categoriasDialogOpen = false;
  categoriaForm = { nombre: '', descripcion: '' };
  categoriaEditando: Categoria | null = null;
  categoriaError = '';
  categoriaSaving = false;

  inventario: Producto[] = [];
  categorias: Categoria[] = [];

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarInventario().subscribe();
    this.erpService.inventario$.subscribe(data => { this.inventario = data; this.cdr.detectChanges(); });
    this.erpService.cargarCategorias().subscribe(data => { this.categorias = data; this.cdr.detectChanges(); });
  }

  get filtrado() {
    const term = this.search.toLowerCase();
    return this.inventario.filter(p => p.nombre.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term));
  }
  get valorTotal() { return this.inventario.reduce((s, p) => s + p.precio * p.stock, 0); }
  get stockBajo() { return this.inventario.filter(p => p.stock <= p.stock_minimo).length; }

  openNew() {
    this.form = { nombre: '', sku: '', id_categorias: '', stock: '', stockMinimo: '', precioCompra: '', precio: '' };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.id_categorias) { this.error = 'Nombre y categoría son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addInventario({
      nombre: this.form.nombre,
      sku: this.form.sku || undefined,
      id_categorias: Number(this.form.id_categorias),
      stock: Number(this.form.stock) || 0,
      stock_minimo: Number(this.form.stockMinimo) || 0,
      precio_compra: Number(this.form.precioCompra) || 0,
      precio: Number(this.form.precio) || 0,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el producto. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  async eliminar(producto: Producto) {
    const ok = await this.notify.confirm(`¿Eliminar "${producto.nombre}"? Podrás restaurarlo desde la papelera.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteInventario(producto.id_productos).subscribe({
      next: () => { this.notify.success('Producto eliminado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar el producto'); console.error(err); },
    });
  }

  papeleraOpen = false;
  papelera: Producto[] = [];

  abrirPapelera() {
    this.papeleraOpen = true;
    this.erpService.cargarPapeleraInventario().subscribe(data => { this.papelera = data; this.cdr.detectChanges(); });
  }

  restaurar(id: number) {
    this.erpService.restaurarInventario(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(p => p.id_productos !== id); this.notify.success('Producto restaurado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo restaurar el producto'); console.error(err); },
    });
  }

  openAjuste(producto: Producto) {
    this.ajusteTarget = producto;
    this.ajusteForm = { cantidad: '', motivo: '' };
    this.ajusteError = '';
    this.ajusteDialogOpen = true;
  }

  submitAjuste() {
    if (!this.ajusteTarget) return;
    const cantidad = Number(this.ajusteForm.cantidad);
    if (!cantidad) { this.ajusteError = 'Indica una cantidad distinta de cero.'; return; }
    if (!this.ajusteForm.motivo) { this.ajusteError = 'Indica un motivo.'; return; }

    this.ajusteError = '';
    this.erpService.ajustarStockInventario(this.ajusteTarget.id_productos, cantidad, this.ajusteForm.motivo).subscribe({
      next: () => { this.ajusteDialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.ajusteError = err?.error?.message || 'No se pudo ajustar el stock.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  openMovimientos(producto: Producto) {
    this.movimientosTarget = producto;
    this.movimientos = [];
    this.movimientosDialogOpen = true;
    this.erpService.cargarMovimientosStock(producto.id_productos).subscribe(data => {
      this.movimientos = data;
      this.cdr.detectChanges();
    });
  }

  abrirCategorias() {
    this.categoriaForm = { nombre: '', descripcion: '' };
    this.categoriaEditando = null;
    this.categoriaError = '';
    this.categoriasDialogOpen = true;
  }

  editarCategoria(c: Categoria) {
    this.categoriaEditando = c;
    this.categoriaForm = { nombre: c.nombre, descripcion: c.descripcion ?? '' };
    this.categoriaError = '';
  }

  cancelarEdicionCategoria() {
    this.categoriaEditando = null;
    this.categoriaForm = { nombre: '', descripcion: '' };
    this.categoriaError = '';
  }

  private recargarCategorias() {
    this.erpService.cargarCategorias().subscribe(data => { this.categorias = data; this.cdr.detectChanges(); });
  }

  guardarCategoria() {
    if (this.categoriaSaving) return;
    if (!this.categoriaForm.nombre) { this.categoriaError = 'El nombre es obligatorio.'; return; }

    this.categoriaSaving = true;
    this.categoriaError = '';

    const data = { nombre: this.categoriaForm.nombre, descripcion: this.categoriaForm.descripcion || undefined };
    const peticion = this.categoriaEditando
      ? this.erpService.updateCategoria(this.categoriaEditando.id_categoria, data)
      : this.erpService.addCategoria(data);

    peticion.subscribe({
      next: () => {
        this.categoriaSaving = false;
        this.categoriaEditando = null;
        this.categoriaForm = { nombre: '', descripcion: '' };
        this.recargarCategorias();
      },
      error: (err) => {
        this.categoriaSaving = false;
        this.categoriaError = 'No se pudo guardar la categoría. Intenta de nuevo.';
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  async eliminarCategoria(c: Categoria) {
    const ok = await this.notify.confirm(`¿Eliminar la categoría "${c.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteCategoria(c.id_categoria).subscribe({
      next: () => { this.notify.success('Categoría eliminada'); this.recargarCategorias(); },
      error: (err) => { this.notify.error('No se pudo eliminar la categoría'); console.error(err); },
    });
  }
}
