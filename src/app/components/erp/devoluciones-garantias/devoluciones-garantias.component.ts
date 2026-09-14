import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpDevolucion, ErpPedido, Producto } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-devoluciones-garantias',
  standalone: false,
  templateUrl: './devoluciones-garantias.component.html',
  styleUrls: ['./devoluciones-garantias.component.scss'],
  animations: [modalLeave],
})
export class ErpDevolucionesGarantiasComponent implements OnInit {
  devoluciones: ErpDevolucion[] = [];
  pedidos: ErpPedido[] = [];
  cargando = true;

  dialogOpen = false;
  form: { id_pedido: string; id_producto: string; cantidad: string; tipo: 'devolucion' | 'garantia'; motivo: string } = {
    id_pedido: '', id_producto: '', cantidad: '1', tipo: 'devolucion', motivo: '',
  };
  saving = false;
  error = '';

  dialogAprobarOpen = false;
  devolucionParaAprobar: ErpDevolucion | null = null;
  montoReembolso = '';
  aprobarSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.devoluciones$.subscribe(data => { this.devoluciones = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarDevoluciones().subscribe();

    this.erpService.cargarPedidos().subscribe();
    this.erpService.pedidos$.subscribe(data => { this.pedidos = data; this.cdr.detectChanges(); });
  }

  productosDelPedido(): { id_producto: number; nombre: string }[] {
    const pedido = this.pedidos.find(p => p.id === Number(this.form.id_pedido));
    return (pedido?.items ?? []).map(i => ({ id_producto: i.id_producto!, nombre: i.producto?.nombre ?? ('Producto #' + i.id_producto) }));
  }

  estadoBadgeClass(estado: ErpDevolucion['estado']): string {
    return { pendiente: 'badge-amber', aprobada: 'badge-blue', rechazada: 'badge-red', completada: 'badge-green' }[estado] ?? 'badge-slate';
  }

  abrirNueva() {
    this.form = { id_pedido: '', id_producto: '', cantidad: '1', tipo: 'devolucion', motivo: '' };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.id_pedido || !this.form.id_producto) { this.error = 'Selecciona el pedido y el producto.'; return; }
    if (!this.form.cantidad || Number(this.form.cantidad) < 1) { this.error = 'La cantidad debe ser al menos 1.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addDevolucion({
      id_pedido: Number(this.form.id_pedido),
      id_producto: Number(this.form.id_producto),
      cantidad: Number(this.form.cantidad),
      tipo: this.form.tipo,
      motivo: this.form.motivo || undefined,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = err?.error?.message || 'No se pudo registrar la devolución.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  abrirAprobar(d: ErpDevolucion) {
    this.devolucionParaAprobar = d;
    this.montoReembolso = '';
    this.dialogAprobarOpen = true;
  }

  submitAprobar() {
    if (this.aprobarSaving || !this.devolucionParaAprobar) return;

    this.aprobarSaving = true;
    const monto = this.montoReembolso ? Number(this.montoReembolso) : undefined;
    this.erpService.aprobarDevolucion(this.devolucionParaAprobar.id, monto).subscribe({
      next: () => { this.aprobarSaving = false; this.dialogAprobarOpen = false; this.notify.success('Devolución aprobada'); this.cdr.detectChanges(); },
      error: (err) => { this.aprobarSaving = false; this.notify.error('No se pudo aprobar la devolución'); this.cdr.detectChanges(); console.error(err); },
    });
  }

  async rechazar(d: ErpDevolucion) {
    const ok = await this.notify.confirm('¿Rechazar esta devolución?', { danger: true, confirmText: 'Rechazar' });
    if (!ok) return;

    this.erpService.rechazarDevolucion(d.id).subscribe({
      next: () => { this.notify.success('Devolución rechazada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo rechazar la devolución'); console.error(err); },
    });
  }

  completar(d: ErpDevolucion) {
    this.erpService.completarDevolucion(d.id).subscribe({
      next: () => { this.notify.success('Devolución completada — stock actualizado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo completar la devolución'); console.error(err); },
    });
  }

  async eliminar(d: ErpDevolucion) {
    const ok = await this.notify.confirm('¿Eliminar esta devolución?', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteDevolucion(d.id).subscribe({
      next: () => { this.notify.success('Devolución eliminada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error(err?.error?.message || 'No se pudo eliminar la devolución'); console.error(err); },
    });
  }
}
