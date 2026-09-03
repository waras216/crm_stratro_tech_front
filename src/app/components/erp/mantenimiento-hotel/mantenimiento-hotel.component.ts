import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpHabitacion, ErpHabitacionIncidencia } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-mantenimiento-hotel',
  standalone: false,
  templateUrl: './mantenimiento-hotel.component.html',
  styleUrls: ['./mantenimiento-hotel.component.scss'],
  animations: [modalLeave],
})
export class ErpMantenimientoHotelComponent implements OnInit {
  habitaciones: ErpHabitacion[] = [];

  incidenciasCargando = false;
  incidencias: ErpHabitacionIncidencia[] = [];

  incidenciaDialogOpen = false;
  incidenciaForm = { id_habitacion: null as number | null, titulo: '', descripcion: '', prioridad: 'media' as 'baja' | 'media' | 'alta', fuera_de_servicio: false };
  incidenciaError = '';
  incidenciaSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe();
    this.cargarIncidenciasCompletas();
  }

  cargarIncidenciasCompletas() {
    this.incidenciasCargando = true;
    this.erpService.cargarIncidencias().subscribe({
      next: data => { this.incidencias = data; this.incidenciasCargando = false; this.cdr.detectChanges(); },
      error: () => { this.incidenciasCargando = false; this.cdr.detectChanges(); },
    });
  }

  abrirReportarIncidencia() {
    this.incidenciaForm = { id_habitacion: this.habitaciones[0]?.id ?? null, titulo: '', descripcion: '', prioridad: 'media', fuera_de_servicio: false };
    this.incidenciaError = '';
    this.incidenciaDialogOpen = true;
  }

  guardarIncidencia() {
    if (this.incidenciaSaving) return;
    if (!this.incidenciaForm.id_habitacion) { this.incidenciaError = 'Selecciona una habitación.'; return; }
    if (!this.incidenciaForm.titulo.trim()) { this.incidenciaError = 'Describe brevemente el problema.'; return; }

    this.incidenciaSaving = true;
    this.incidenciaError = '';

    this.erpService.reportarIncidencia(this.incidenciaForm.id_habitacion, {
      titulo: this.incidenciaForm.titulo,
      descripcion: this.incidenciaForm.descripcion || undefined,
      prioridad: this.incidenciaForm.prioridad,
      fuera_de_servicio: this.incidenciaForm.fuera_de_servicio,
    }).subscribe({
      next: nueva => {
        this.incidencias = [nueva, ...this.incidencias];
        this.incidenciaSaving = false;
        this.incidenciaDialogOpen = false;
        this.notify.success('Incidencia reportada');
        this.cdr.detectChanges();
      },
      error: err => {
        this.incidenciaSaving = false;
        this.incidenciaError = err?.error?.message || 'No se pudo reportar la incidencia';
        this.cdr.detectChanges();
      },
    });
  }

  resolverIncidenciaAccion(inc: ErpHabitacionIncidencia) {
    this.erpService.resolverIncidencia(inc.id).subscribe({
      next: actualizada => {
        this.incidencias = this.incidencias.map(i => i.id === actualizada.id ? actualizada : i);
        this.notify.success('Incidencia resuelta');
        this.cdr.detectChanges();
      },
      error: err => this.notify.error(err?.error?.message || 'No se pudo resolver la incidencia'),
    });
  }
}
