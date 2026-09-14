import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpSucursal } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-sucursales',
  standalone: false,
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.scss'],
  animations: [modalLeave],
})
export class ErpSucursalesComponent implements OnInit {
  sucursales: ErpSucursal[] = [];
  cargando = true;

  dialogOpen = false;
  sucursalEditando: ErpSucursal | null = null;
  form = { nombre: '', direccion: '', telefono: '', responsable: '' };
  saving = false;
  error = '';

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.sucursales$.subscribe(data => { this.sucursales = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarSucursales().subscribe();
  }

  abrirNueva() {
    this.sucursalEditando = null;
    this.form = { nombre: '', direccion: '', telefono: '', responsable: '' };
    this.error = '';
    this.dialogOpen = true;
  }

  abrirEditar(s: ErpSucursal) {
    this.sucursalEditando = s;
    this.form = { nombre: s.nombre, direccion: s.direccion ?? '', telefono: s.telefono ?? '', responsable: s.responsable ?? '' };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre.trim()) { this.error = 'El nombre es obligatorio.'; return; }

    this.saving = true;
    this.error = '';
    const peticion = this.sucursalEditando
      ? this.erpService.updateSucursal(this.sucursalEditando.id_sucursal, { ...this.form })
      : this.erpService.addSucursal({ ...this.form });

    peticion.subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar la sucursal.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  async eliminar(s: ErpSucursal) {
    const ok = await this.notify.confirm(`¿Eliminar la sucursal "${s.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteSucursal(s.id_sucursal).subscribe({
      next: () => { this.notify.success('Sucursal eliminada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error(err?.error?.message || 'No se pudo eliminar la sucursal'); console.error(err); },
    });
  }
}
