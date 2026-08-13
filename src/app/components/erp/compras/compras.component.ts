import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpOrdenCompra, Proveedor, Producto } from '../../../models/erp.models';

interface ItemRow { id_producto: string; cantidad: string; precio_unitario: string; }

@Component({
  selector: 'app-erp-compras',
  standalone: false,
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss'],
})
export class ErpComprasComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form: { id_proveedor: string; items: ItemRow[] } = { id_proveedor: '', items: [] };

  cargando = true;
  ordenExpandida: number | null = null;
  ordenes: ErpOrdenCompra[] = [];
  proveedores: Proveedor[] = [];
  productos: Producto[] = [];

  proveedoresPanelOpen = false;
  proveedorForm = { nombre: '', contacto: '', email: '', telefono: '' };
  proveedorSaving = false;
  proveedorError = '';

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarOrdenesCompra().subscribe();
    this.erpService.ordenesCompra$.subscribe(data => { this.ordenes = data; this.cargando = false; this.cdr.detectChanges(); });

    this.erpService.cargarProveedores().subscribe();
    this.erpService.proveedores$.subscribe(data => { this.proveedores = data; this.cdr.detectChanges(); });

    this.erpService.cargarProductos().subscribe(data => { this.productos = data; this.cdr.detectChanges(); });
  }

  get totalPendiente() { return this.ordenes.filter(o => o.estado === 'pendiente').reduce((s, o) => s + Number(o.total), 0); }

  toggleExpandida(id: number) {
    this.ordenExpandida = this.ordenExpandida === id ? null : id;
  }

  get totalFormulario() {
    return this.form.items.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0), 0);
  }

  openNew() {
    this.form = { id_proveedor: '', items: [{ id_producto: '', cantidad: '1', precio_unitario: '' }] };
    this.error = '';
    this.dialogOpen = true;
  }

  addItemRow() {
    this.form.items.push({ id_producto: '', cantidad: '1', precio_unitario: '' });
  }

  removeItemRow(index: number) {
    this.form.items.splice(index, 1);
  }

  onProductoChange(row: ItemRow) {
    const producto = this.productos.find(p => p.id_productos === Number(row.id_producto));
    if (producto) row.precio_unitario = String(producto.precio_compra);
  }

  submit() {
    if (this.saving) return;
    if (!this.form.id_proveedor) { this.error = 'El proveedor es obligatorio.'; return; }

    const items = this.form.items
      .filter(i => i.id_producto && Number(i.cantidad) > 0)
      .map(i => ({
        id_producto: Number(i.id_producto),
        cantidad: Number(i.cantidad),
        precio_unitario: Number(i.precio_unitario) || 0,
      }));

    if (items.length === 0) { this.error = 'Agrega al menos una línea con producto y cantidad.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addOrdenCompra({
      id_proveedor: Number(this.form.id_proveedor),
      items,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar la orden. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  recibir(id: number) { this.erpService.recibirOrdenCompra(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }
  cancelar(id: number) { this.erpService.cancelarOrdenCompra(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }

  toggleProveedoresPanel() {
    this.proveedoresPanelOpen = !this.proveedoresPanelOpen;
    this.proveedorForm = { nombre: '', contacto: '', email: '', telefono: '' };
    this.proveedorError = '';
  }

  submitProveedor() {
    if (this.proveedorSaving) return;
    if (!this.proveedorForm.nombre) { this.proveedorError = 'El nombre es obligatorio.'; return; }

    this.proveedorSaving = true;
    this.proveedorError = '';
    this.erpService.addProveedor({ ...this.proveedorForm }).subscribe({
      next: () => {
        this.proveedorSaving = false;
        this.proveedorForm = { nombre: '', contacto: '', email: '', telefono: '' };
        this.cdr.detectChanges();
      },
      error: (err) => { this.proveedorSaving = false; this.proveedorError = 'No se pudo guardar el proveedor.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  async eliminarProveedor(proveedor: Proveedor) {
    const ok = await this.notify.confirm(`¿Eliminar proveedor "${proveedor.nombre}"? Podrás restaurarlo desde la papelera.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteProveedor(proveedor.id_proveedor).subscribe({
      next: () => { this.notify.success('Proveedor eliminado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar el proveedor'); console.error(err); },
    });
  }

  proveedoresPapeleraOpen = false;
  proveedoresPapelera: Proveedor[] = [];

  abrirProveedoresPapelera() {
    this.proveedoresPapeleraOpen = true;
    this.erpService.cargarPapeleraProveedores().subscribe(data => { this.proveedoresPapelera = data; this.cdr.detectChanges(); });
  }

  restaurarProveedor(id: number) {
    this.erpService.restaurarProveedor(id).subscribe({
      next: () => { this.proveedoresPapelera = this.proveedoresPapelera.filter(p => p.id_proveedor !== id); this.notify.success('Proveedor restaurado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo restaurar el proveedor'); console.error(err); },
    });
  }
}
