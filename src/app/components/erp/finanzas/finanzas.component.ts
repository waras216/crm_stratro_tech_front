import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpMovimiento } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-finanzas',
  standalone: false,
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
})
export class ErpFinanzasComponent implements OnInit {
  movimientos: ErpMovimiento[] = [];

  dialogOpen = false;
  saving = false;
  error = '';
  form = { concepto: '', tipo: 'ingreso', monto: '', categoria: '' };

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarMovimientos().subscribe();
    this.erpService.movimientos$.subscribe(data => { this.movimientos = data; this.cdr.detectChanges(); });
  }

  get ingresos() { return this.movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0); }
  get egresos() { return this.movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0); }
  get balance() { return this.ingresos - this.egresos; }

  openNew() {
    this.form = { concepto: '', tipo: 'ingreso', monto: '', categoria: '' };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.concepto || !this.form.monto) { this.error = 'Concepto y monto son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addMovimiento({
      concepto: this.form.concepto,
      tipo: this.form.tipo as 'ingreso' | 'egreso',
      monto: Number(this.form.monto) || 0,
      categoria: this.form.categoria || 'General',
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el movimiento. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  async eliminar(mov: ErpMovimiento) {
    const ok = await this.notify.confirm(`¿Eliminar el movimiento "${mov.concepto}"? Podrás restaurarlo desde la papelera.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteMovimiento(mov.id).subscribe({
      next: () => { this.notify.success('Movimiento eliminado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar el movimiento'); console.error(err); },
    });
  }

  papeleraOpen = false;
  papelera: ErpMovimiento[] = [];

  abrirPapelera() {
    this.papeleraOpen = true;
    this.erpService.cargarPapeleraMovimientos().subscribe(data => { this.papelera = data; this.cdr.detectChanges(); });
  }

  restaurar(id: number) {
    this.erpService.restaurarMovimiento(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(m => m.id !== id); this.notify.success('Movimiento restaurado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo restaurar el movimiento'); console.error(err); },
    });
  }
}
