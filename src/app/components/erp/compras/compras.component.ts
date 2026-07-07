import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpOrdenCompra } from '../../../models/erp.models';

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
  form = { proveedor: '', items: '', total: '' };

  ordenes: ErpOrdenCompra[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarOrdenesCompra().subscribe();
    this.erpService.ordenesCompra$.subscribe(data => { this.ordenes = data; this.cdr.detectChanges(); });
  }

  get totalPendiente() { return this.ordenes.filter(o => o.estado === 'pendiente').reduce((s, o) => s + Number(o.total), 0); }

  openNew() { this.form = { proveedor: '', items: '', total: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.proveedor) { this.error = 'El proveedor es obligatorio.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addOrdenCompra({
      proveedor: this.form.proveedor,
      items: Number(this.form.items) || 0,
      total: Number(this.form.total) || 0,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar la orden. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  recibir(id: number) { this.erpService.recibirOrdenCompra(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }
  cancelar(id: number) { this.erpService.cancelarOrdenCompra(id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) }); }
}
