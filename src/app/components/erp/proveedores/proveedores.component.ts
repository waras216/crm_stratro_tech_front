import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Proveedor } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-proveedores',
  standalone: false,
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss'],
  animations: [modalLeave],
})
export class ErpProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  cargando = true;

  dialogOpen = false;
  proveedorEditando: Proveedor | null = null;
  proveedorForm = { nombre: '', contacto: '', email: '', telefono: '' };
  proveedorSaving = false;
  proveedorError = '';

  papeleraOpen = false;
  papelera: Proveedor[] = [];

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.proveedores$.subscribe(data => { this.proveedores = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarProveedores().subscribe();
  }

  abrirNuevo() {
    this.proveedorEditando = null;
    this.proveedorForm = { nombre: '', contacto: '', email: '', telefono: '' };
    this.proveedorError = '';
    this.dialogOpen = true;
  }

  abrirEditar(p: Proveedor) {
    this.proveedorEditando = p;
    this.proveedorForm = { nombre: p.nombre, contacto: p.contacto ?? '', email: p.email ?? '', telefono: p.telefono ?? '' };
    this.proveedorError = '';
    this.dialogOpen = true;
  }

  submitProveedor() {
    if (this.proveedorSaving) return;
    if (!this.proveedorForm.nombre) { this.proveedorError = 'El nombre es obligatorio.'; return; }

    this.proveedorSaving = true;
    this.proveedorError = '';
    const peticion = this.proveedorEditando
      ? this.erpService.updateProveedor(this.proveedorEditando.id_proveedor, { ...this.proveedorForm })
      : this.erpService.addProveedor({ ...this.proveedorForm });

    peticion.subscribe({
      next: () => {
        this.proveedorSaving = false;
        this.dialogOpen = false;
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

  abrirPapelera() {
    this.papeleraOpen = true;
    this.erpService.cargarPapeleraProveedores().subscribe(data => { this.papelera = data; this.cdr.detectChanges(); });
  }

  restaurarProveedor(id: number) {
    this.erpService.restaurarProveedor(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(p => p.id_proveedor !== id); this.notify.success('Proveedor restaurado'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo restaurar el proveedor'); console.error(err); },
    });
  }
}
