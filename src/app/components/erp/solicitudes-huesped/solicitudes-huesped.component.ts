import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpHabitacion, ErpSolicitudHuesped } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-solicitudes-huesped',
  standalone: false,
  templateUrl: './solicitudes-huesped.component.html',
  styleUrls: ['./solicitudes-huesped.component.scss'],
  animations: [modalLeave],
})
export class ErpSolicitudesHuespedComponent implements OnInit {
  habitaciones: ErpHabitacion[] = [];

  solicitudesCargando = false;
  solicitudes: ErpSolicitudHuesped[] = [];

  solicitudDialogOpen = false;
  solicitudForm = { id_habitacion: null as number | null, titulo: '', descripcion: '', categoria: 'solicitud' as 'queja' | 'solicitud' | 'otro', prioridad: 'media' as 'baja' | 'media' | 'alta' };
  solicitudError = '';
  solicitudSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe();
    this.cargarSolicitudesCompletas();
  }

  cargarSolicitudesCompletas() {
    this.solicitudesCargando = true;
    this.erpService.cargarSolicitudesHuesped().subscribe({
      next: data => { this.solicitudes = data; this.solicitudesCargando = false; this.cdr.detectChanges(); },
      error: () => { this.solicitudesCargando = false; this.cdr.detectChanges(); },
    });
  }

  abrirReportarSolicitud() {
    this.solicitudForm = { id_habitacion: this.habitaciones[0]?.id ?? null, titulo: '', descripcion: '', categoria: 'solicitud', prioridad: 'media' };
    this.solicitudError = '';
    this.solicitudDialogOpen = true;
  }

  guardarSolicitud() {
    if (this.solicitudSaving) return;
    if (!this.solicitudForm.id_habitacion) { this.solicitudError = 'Selecciona una habitación.'; return; }
    if (!this.solicitudForm.titulo.trim()) { this.solicitudError = 'Describe brevemente la solicitud.'; return; }

    this.solicitudSaving = true;
    this.solicitudError = '';

    this.erpService.reportarSolicitudHuesped(this.solicitudForm.id_habitacion, {
      titulo: this.solicitudForm.titulo,
      descripcion: this.solicitudForm.descripcion || undefined,
      categoria: this.solicitudForm.categoria,
      prioridad: this.solicitudForm.prioridad,
    }).subscribe({
      next: nueva => {
        this.solicitudes = [nueva, ...this.solicitudes];
        this.solicitudSaving = false;
        this.solicitudDialogOpen = false;
        this.notify.success('Solicitud registrada');
        this.cdr.detectChanges();
      },
      error: err => {
        this.solicitudSaving = false;
        this.solicitudError = err?.error?.message || 'No se pudo registrar la solicitud';
        this.cdr.detectChanges();
      },
    });
  }

  private ordenEstadoSolicitud: ErpSolicitudHuesped['estado'][] = ['abierta', 'en_progreso', 'resuelta'];

  siguienteEstadoSolicitud(s: ErpSolicitudHuesped): ErpSolicitudHuesped['estado'] {
    const idx = this.ordenEstadoSolicitud.indexOf(s.estado);
    return this.ordenEstadoSolicitud[(idx + 1) % this.ordenEstadoSolicitud.length];
  }

  cambiarEstadoSolicitudAccion(s: ErpSolicitudHuesped) {
    this.erpService.cambiarEstadoSolicitud(s.id, this.siguienteEstadoSolicitud(s)).subscribe({
      next: actualizada => {
        this.solicitudes = this.solicitudes.map(x => x.id === actualizada.id ? actualizada : x);
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo actualizar la solicitud'),
    });
  }

  solicitudEstadoLabel(estado: ErpSolicitudHuesped['estado']): string {
    const labels: Record<ErpSolicitudHuesped['estado'], string> = { abierta: 'Abierta', en_progreso: 'En progreso', resuelta: 'Resuelta' };
    return labels[estado];
  }

  solicitudCategoriaLabel(categoria: ErpSolicitudHuesped['categoria']): string {
    const labels: Record<ErpSolicitudHuesped['categoria'], string> = { queja: 'Queja', solicitud: 'Solicitud', otro: 'Otro' };
    return labels[categoria];
  }
}
