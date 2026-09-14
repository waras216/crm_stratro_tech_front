import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpSucursal, ErpTransferencia, Producto } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

interface ItemRow { id_producto: string; cantidad: string; }

@Component({
  selector: 'app-erp-transferencias',
  standalone: false,
  templateUrl: './transferencias.component.html',
  styleUrls: ['./transferencias.component.scss'],
  animations: [modalLeave],
})
export class ErpTransferenciasComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form: { id_sucursal_origen: string; id_sucursal_destino: string; notas: string; items: ItemRow[] } = { id_sucursal_origen: '', id_sucursal_destino: '', notas: '', items: [] };

  cargando = true;
  expandidaId: number | null = null;
  transferencias: ErpTransferencia[] = [];
  sucursales: ErpSucursal[] = [];
  productos: Producto[] = [];

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarTransferencias().subscribe();
    this.erpService.transferencias$.subscribe(data => { this.transferencias = data; this.cargando = false; this.cdr.detectChanges(); });

    this.erpService.cargarSucursales().subscribe();
    this.erpService.sucursales$.subscribe(data => { this.sucursales = data; this.cdr.detectChanges(); });

    this.erpService.cargarProductos().subscribe(data => { this.productos = data; this.cdr.detectChanges(); });
  }

  toggleExpandida(id: number) { this.expandidaId = this.expandidaId === id ? null : id; }

  openNew() {
    this.form = { id_sucursal_origen: '', id_sucursal_destino: '', notas: '', items: [{ id_producto: '', cantidad: '1' }] };
    this.error = '';
    this.dialogOpen = true;
  }

  addItemRow() { this.form.items.push({ id_producto: '', cantidad: '1' }); }
  removeItemRow(index: number) { this.form.items.splice(index, 1); }

  submit() {
    if (this.saving) return;
    if (!this.form.id_sucursal_origen || !this.form.id_sucursal_destino) { this.error = 'Selecciona sucursal de origen y destino.'; return; }
    if (this.form.id_sucursal_origen === this.form.id_sucursal_destino) { this.error = 'La sucursal de origen y destino no pueden ser la misma.'; return; }

    const items = this.form.items
      .filter(i => i.id_producto && Number(i.cantidad) > 0)
      .map(i => ({ id_producto: Number(i.id_producto), cantidad: Number(i.cantidad) }));

    if (items.length === 0) { this.error = 'Agrega al menos una línea con producto y cantidad.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addTransferencia({
      id_sucursal_origen: Number(this.form.id_sucursal_origen),
      id_sucursal_destino: Number(this.form.id_sucursal_destino),
      notas: this.form.notas || undefined,
      items,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = err?.error?.message || 'No se pudo crear la transferencia.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  enviar(id: number) { this.erpService.enviarTransferencia(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }
  recibir(id: number) { this.erpService.recibirTransferencia(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }
  cancelar(id: number) { this.erpService.cancelarTransferencia(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }

  async eliminar(id: number) {
    const ok = await this.notify.confirm('¿Eliminar esta transferencia?', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteTransferencia(id).subscribe({
      next: () => { this.notify.success('Transferencia eliminada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error(err?.error?.message || 'No se pudo eliminar la transferencia'); console.error(err); },
    });
  }
}
