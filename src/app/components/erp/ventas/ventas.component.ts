import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { FARM_ATENCION_LABELS, NichoService, REST_CANALES_LABELS, TIENDA_CANALES_LABELS } from '../../../core/services/nicho.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpPedido, Producto } from '../../../models/erp.models';
import { Cliente } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

interface ItemRow { id_producto: string; cantidad: string; precio_unitario: string; }

@Component({
  selector: 'app-erp-ventas',
  standalone: false,
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss'],
  animations: [modalLeave],
})
export class ErpVentasComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form: { id_cliente: string; items: ItemRow[] } = { id_cliente: '', items: [] };

  clienteBusqueda = '';
  clientesResultados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;

  cargando = true;
  pedidos: ErpPedido[] = [];
  productos: Producto[] = [];
  expandidoId: number | null = null;

  constructor(
    private erpService: ErpService,
    private crmService: CrmService,
    private cdr: ChangeDetectorRef,
    public nicho: NichoService,
    private notify: NotifyService,
  ) {}

  canalLabel(canal: string | null | undefined): string {
    if (!canal) return '—';
    return REST_CANALES_LABELS[canal] || TIENDA_CANALES_LABELS[canal] || FARM_ATENCION_LABELS[canal] || canal;
  }

  ngOnInit() {
    this.erpService.cargarPedidos().subscribe();
    this.erpService.pedidos$.subscribe(data => { this.pedidos = data; this.cargando = false; this.cdr.detectChanges(); });

    this.erpService.cargarProductos().subscribe(data => { this.productos = data; this.cdr.detectChanges(); });
  }

  toggleDetalle(id: number) {
    this.expandidoId = this.expandidoId === id ? null : id;
  }

  get facturado() { return this.pedidos.filter(p => p.estado === 'facturado').reduce((s, p) => s + Number(p.total), 0); }
  get porCobrar() { return this.pedidos.filter(p => p.estado !== 'facturado' && p.estado !== 'cancelada').reduce((s, p) => s + Number(p.total), 0); }

  get totalFormulario() {
    return this.form.items.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0), 0);
  }

  openNew() {
    this.form = { id_cliente: '', items: [{ id_producto: '', cantidad: '1', precio_unitario: '' }] };
    this.clienteBusqueda = '';
    this.clientesResultados = [];
    this.clienteSeleccionado = null;
    this.error = '';
    this.dialogOpen = true;
  }

  buscarCliente() {
    if (!this.clienteBusqueda) { this.clientesResultados = []; return; }
    this.crmService.cargarClientes(1, this.clienteBusqueda).subscribe(page => {
      this.clientesResultados = page.data;
      this.cdr.detectChanges();
    });
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
    this.form.id_cliente = String(cliente.id_cliente);
    this.clientesResultados = [];
    this.clienteBusqueda = cliente.nombre;
  }

  addItemRow() {
    this.form.items.push({ id_producto: '', cantidad: '1', precio_unitario: '' });
  }

  removeItemRow(index: number) {
    this.form.items.splice(index, 1);
  }

  onProductoChange(row: ItemRow) {
    const producto = this.productos.find(p => p.id_productos === Number(row.id_producto));
    if (producto) row.precio_unitario = String(producto.precio);
  }

  submit() {
    if (this.saving) return;
    if (!this.form.id_cliente) { this.error = 'Selecciona un cliente.'; return; }

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
    this.erpService.addPedido({
      id_cliente: Number(this.form.id_cliente),
      items,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.dialogOpen = false;
        this.notify.success('Pedido registrado');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.errors?.items?.[0] || 'No se pudo guardar el pedido. Intenta de nuevo.';
        this.notify.error(this.error);
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  cancelar(id: number) {
    this.erpService.cancelarPedido(id).subscribe({
      next: () => { this.notify.success('Pedido cancelado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo cancelar el pedido'); console.error(err); },
    });
  }
}
