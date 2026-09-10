import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpMesa } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

/**
 * Administración de mesas del Bar del hotel fuera del terminal en vivo — igual que
 * ErpHabitacionesComponent lo es para cuartos. Solo visible si el hotel marcó la
 * amenidad "Bar" en el onboarding (ver ERP_SIDEBAR/module.service.ts). El uso en
 * vivo (abrir/cobrar/comanda) sigue viviendo en PosTerminalHotelMesasComponent.
 */
@Component({
  selector: 'app-erp-mesas',
  standalone: false,
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss'],
  animations: [modalLeave],
})
export class ErpMesasComponent implements OnInit {
  mesas: ErpMesa[] = [];
  cargando = false;

  mesaDialogOpen = false;
  mesaEditando: ErpMesa | null = null;
  mesaForm = { numero: null as number | null, capacidad: 4, ubicacion: '', descripcion: '' };
  mesaError = '';
  mesaSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.mesas$.subscribe(data => { this.mesas = data; this.cdr.detectChanges(); });
    this.erpService.cargarMesas().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  contarEstado(estado: ErpMesa['estado']): number {
    return this.mesas.filter(m => m.estado === estado).length;
  }

  abrirNuevaMesa() {
    this.mesaEditando = null;
    this.mesaForm = { numero: null, capacidad: 4, ubicacion: '', descripcion: '' };
    this.mesaError = '';
    this.mesaDialogOpen = true;
  }

  abrirEditarMesa(m: ErpMesa) {
    this.mesaEditando = m;
    this.mesaForm = { numero: m.numero, capacidad: m.capacidad, ubicacion: m.ubicacion ?? '', descripcion: m.descripcion ?? '' };
    this.mesaError = '';
    this.mesaDialogOpen = true;
  }

  guardarMesa() {
    if (this.mesaSaving || !this.mesaForm.numero) { this.mesaError = 'El número de mesa es obligatorio.'; return; }

    this.mesaSaving = true;
    this.mesaError = '';

    const payload = {
      numero: this.mesaForm.numero,
      capacidad: this.mesaForm.capacidad || 2,
      ubicacion: this.mesaForm.ubicacion.trim() || null,
      descripcion: this.mesaForm.descripcion.trim() || null,
    };
    const peticion = this.mesaEditando
      ? this.erpService.actualizarMesa(this.mesaEditando.id, payload)
      : this.erpService.crearMesa(payload);

    peticion.subscribe({
      next: () => {
        this.mesaSaving = false;
        this.mesaDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.mesaSaving = false;
        this.mesaError = err?.error?.message || 'No se pudo guardar la mesa';
        this.cdr.detectChanges();
      },
    });
  }

  async eliminarMesa(m: ErpMesa) {
    const ok = await this.notify.confirm(`¿Eliminar la Mesa ${m.numero}?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.eliminarMesa(m.id).subscribe({
      next: () => { this.notify.success('Mesa eliminada'); this.cdr.detectChanges(); },
      error: err => { this.notify.error(err?.error?.message || 'No se pudo eliminar la mesa'); },
    });
  }
}
