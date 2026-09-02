import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ALMACEN_OPS_LABELS, NichoService } from '../../../core/services/nicho.service';
import { Producto, Categoria, ErpMovimientoStock } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-inventario',
  standalone: false,
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
  animations: [modalLeave],
})
export class ErpInventarioComponent implements OnInit {
  search = '';
  categoriaActiva = 'Todos';
  dialogOpen = false;
  saving = false;
  error = '';
  form = { nombre: '', sku: '', id_categorias: '', stock: '', stockMinimo: '', precioCompra: '', precio: '', controlaStock: true };
  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;
  subiendoFoto = false;
  editando: Producto | null = null;

  ajusteDialogOpen = false;
  ajusteTarget: Producto | null = null;
  ajusteForm = { cantidad: '', motivo: '', operacion: '' };
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
  cargando = true;

  constructor(
    private erpService: ErpService,
    private notify: NotifyService,
    private cdr: ChangeDetectorRef,
    public nicho: NichoService,
    public stockAlert: StockAlertService,
  ) {}

  operacionLabel(id: string): string { return ALMACEN_OPS_LABELS[id] || id; }

  ngOnInit() {
    this.erpService.cargarInventario().subscribe();
    this.erpService.inventario$.subscribe(data => { this.inventario = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarCategorias().subscribe(data => { this.categorias = data; this.cdr.detectChanges(); });
  }

  /** Nombres de categoría con al menos un producto, en el orden en que se crearon (p.ej. Bar, Spa, Piscina... del nicho hotel). */
  get categoriasConProductos(): string[] {
    const nombres = new Set(this.categorias.map(c => c.nombre).filter(nombre => this.inventario.some(p => p.categoria?.nombre === nombre)));
    return ['Todos', ...nombres];
  }

  /** Inventario acotado a la sección/categoría activa — de aquí salen tanto la tabla como los KPIs, para que "Bar" muestre su propio stock. */
  get inventarioEnCategoria(): Producto[] {
    return this.categoriaActiva === 'Todos' ? this.inventario : this.inventario.filter(p => p.categoria?.nombre === this.categoriaActiva);
  }

  get filtrado() {
    const term = this.search.toLowerCase();
    return this.inventarioEnCategoria.filter(p => p.nombre.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term));
  }
  get valorTotal() { return this.inventarioEnCategoria.filter(p => p.controla_stock !== false).reduce((s, p) => s + p.precio * p.stock, 0); }
  get sinStockCount() { return this.inventarioEnCategoria.filter(p => this.stockAlert.sinStock(p)).length; }
  get stockBajoCount() { return this.inventarioEnCategoria.filter(p => this.stockAlert.stockBajo(p)).length; }

  openNew() {
    this.editando = null;
    this.form = { nombre: '', sku: '', id_categorias: '', stock: '', stockMinimo: '', precioCompra: '', precio: '', controlaStock: this.nicho.nicho !== 'restaurante' };
    this.fotoSeleccionada = null;
    this.fotoPreview = null;
    this.error = '';
    this.dialogOpen = true;
  }

  openEdit(producto: Producto) {
    this.editando = producto;
    this.form = {
      nombre: producto.nombre,
      sku: producto.sku ?? '',
      id_categorias: String(producto.id_categorias),
      stock: String(producto.stock),
      stockMinimo: String(producto.stock_minimo),
      precioCompra: String(producto.precio_compra),
      precio: String(producto.precio),
      controlaStock: producto.controla_stock !== false,
    };
    this.fotoSeleccionada = null;
    this.fotoPreview = producto.imagen_url ?? null;
    this.error = '';
    this.dialogOpen = true;
  }

  onFotoSeleccionada(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error = 'El archivo debe ser una imagen.'; return; }
    if (file.size > 2 * 1024 * 1024) { this.error = 'La imagen no puede pesar más de 2MB.'; return; }

    this.error = '';
    this.fotoSeleccionada = file;
    this.fotoPreview = URL.createObjectURL(file);
  }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.id_categorias) { this.error = 'Nombre y categoría son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    const payload = {
      nombre: this.form.nombre,
      sku: this.form.sku || undefined,
      id_categorias: Number(this.form.id_categorias),
      stock: Number(this.form.stock) || 0,
      stock_minimo: Number(this.form.stockMinimo) || 0,
      controla_stock: this.form.controlaStock,
      precio_compra: Number(this.form.precioCompra) || 0,
      precio: Number(this.form.precio) || 0,
    };

    const peticion = this.editando
      ? this.erpService.updateInventario(this.editando.id_productos, payload)
      : this.erpService.addInventario(payload);

    peticion.subscribe({
      next: (guardado) => {
        if (!this.fotoSeleccionada) {
          this.saving = false;
          this.dialogOpen = false;
          this.cdr.detectChanges();
          return;
        }
        this.erpService.subirFotoProducto(guardado.id_productos, this.fotoSeleccionada).subscribe({
          next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
          error: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
        });
      },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el producto. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  cambiarFotoProducto(producto: Producto, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.notify.error('El archivo debe ser una imagen.'); return; }
    if (file.size > 2 * 1024 * 1024) { this.notify.error('La imagen no puede pesar más de 2MB.'); return; }

    this.subiendoFoto = true;
    this.erpService.subirFotoProducto(producto.id_productos, file).subscribe({
      next: () => { this.subiendoFoto = false; this.cdr.detectChanges(); },
      error: () => { this.notify.error('No se pudo subir la foto'); this.subiendoFoto = false; this.cdr.detectChanges(); },
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
    this.ajusteForm = { cantidad: '', motivo: '', operacion: '' };
    this.ajusteError = '';
    this.ajusteDialogOpen = true;
  }

  submitAjuste() {
    if (!this.ajusteTarget) return;
    const cantidad = Number(this.ajusteForm.cantidad);
    if (!cantidad) { this.ajusteError = 'Indica una cantidad distinta de cero.'; return; }
    if (!this.ajusteForm.motivo) { this.ajusteError = 'Indica un motivo.'; return; }

    this.ajusteError = '';
    this.erpService.ajustarStockInventario(this.ajusteTarget.id_productos, cantidad, this.ajusteForm.motivo, this.ajusteForm.operacion).subscribe({
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
