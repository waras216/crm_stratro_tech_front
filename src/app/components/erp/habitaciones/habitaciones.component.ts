import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { HOTEL_AMENIDADES_LABELS, NichoService } from '../../../core/services/nicho.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpHabitacion } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-habitaciones',
  standalone: false,
  templateUrl: './habitaciones.component.html',
  styleUrls: ['./habitaciones.component.scss'],
  animations: [modalLeave],
})
export class ErpHabitacionesComponent implements OnInit {
  habitaciones: ErpHabitacion[] = [];
  cargando = false;

  habDialogOpen = false;
  habEditando: ErpHabitacion | null = null;
  habForm = { numero: null as number | null, tipo: '', precio: null as number | null, piso: 1 };
  habError = '';
  habSaving = false;

  papeleraOpen = false;
  papelera: ErpHabitacion[] = [];

  /** Reportar un problema directo desde la fila de la habitación — el detalle
   * completo (prioridad, historial, resolver) vive en la pestaña Mantenimiento. */
  incidenciaDialogOpen = false;
  incidenciaForm = { id_habitacion: null as number | null, titulo: '', descripcion: '', prioridad: 'media' as 'baja' | 'media' | 'alta', fuera_de_servicio: false };
  incidenciaError = '';
  incidenciaSaving = false;

  constructor(private erpService: ErpService, public nicho: NichoService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  amenidadLabel(id: string): string { return HOTEL_AMENIDADES_LABELS[id] || id; }

  contarEstado(estado: ErpHabitacion['estado']): number {
    return this.habitaciones.filter(h => h.estado === estado).length;
  }

  ocupacionPct(): number {
    if (this.habitaciones.length === 0) return 0;
    return Math.round((this.contarEstado('ocupada') / this.habitaciones.length) * 100);
  }

  totalConsumos(h: ErpHabitacion): number {
    return h.consumos.reduce((s, c) => s + c.precio_unitario * c.cantidad, 0);
  }

  totalConsumosPendientes(): number {
    return this.habitaciones.reduce((s, h) => s + this.totalConsumos(h), 0);
  }

  toggleMantenimiento(h: ErpHabitacion) {
    const estado = h.estado === 'mantenimiento' ? 'libre' : 'mantenimiento';
    this.erpService.marcarMantenimiento(h.id, estado).subscribe(() => this.cdr.detectChanges());
  }

  private ordenLimpieza: ErpHabitacion['estado_limpieza'][] = ['sucia', 'en_limpieza', 'inspeccion', 'limpia'];

  ordenLimpiezaSiguiente(h: ErpHabitacion): ErpHabitacion['estado_limpieza'] {
    const idx = this.ordenLimpieza.indexOf(h.estado_limpieza);
    return this.ordenLimpieza[(idx + 1) % this.ordenLimpieza.length];
  }

  siguienteEstadoLimpieza(h: ErpHabitacion) {
    this.erpService.marcarLimpieza(h.id, this.ordenLimpiezaSiguiente(h)).subscribe(() => this.cdr.detectChanges());
  }

  limpiezaLabel(estado: ErpHabitacion['estado_limpieza']): string {
    const labels: Record<ErpHabitacion['estado_limpieza'], string> = {
      limpia: 'Limpia', sucia: 'Sucia', en_limpieza: 'En limpieza', inspeccion: 'Inspección',
    };
    return labels[estado];
  }

  contarLimpieza(estado: ErpHabitacion['estado_limpieza']): number {
    return this.habitaciones.filter(h => h.estado_limpieza === estado).length;
  }

  abrirNuevaHabitacion() {
    this.habEditando = null;
    this.habForm = { numero: null, tipo: this.nicho.hotelTiposHabitacion[0], precio: null, piso: 1 };
    this.habError = '';
    this.habDialogOpen = true;
  }

  abrirEditarHabitacion(h: ErpHabitacion) {
    this.habEditando = h;
    this.habForm = { numero: h.numero, tipo: h.tipo, precio: h.precio, piso: h.piso };
    this.habError = '';
    this.habDialogOpen = true;
  }

  guardarHabitacion() {
    if (this.habSaving || !this.habForm.numero) { this.habError = 'El número de habitación es obligatorio.'; return; }
    if (this.habForm.precio === null || this.habForm.precio < 0) { this.habError = 'Indica el precio por noche.'; return; }

    this.habSaving = true;
    this.habError = '';

    const payload = { numero: this.habForm.numero, tipo: this.habForm.tipo, precio: this.habForm.precio, piso: this.habForm.piso || 1 };
    const peticion = this.habEditando
      ? this.erpService.actualizarHabitacion(this.habEditando.id, payload)
      : this.erpService.crearHabitacion(payload);

    peticion.subscribe({
      next: () => {
        this.habSaving = false;
        this.habDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.habSaving = false;
        this.habError = err?.error?.message || 'No se pudo guardar la habitación';
        this.cdr.detectChanges();
      },
    });
  }

  async eliminarHabitacion(h: ErpHabitacion) {
    const ok = await this.notify.confirm(`¿Eliminar la Habitación ${h.numero}? Podrás restaurarla desde la papelera.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.eliminarHabitacion(h.id).subscribe({
      next: () => { this.notify.success('Habitación eliminada'); this.cdr.detectChanges(); },
      error: err => { this.notify.error(err?.error?.message || 'No se pudo eliminar la habitación'); },
    });
  }

  abrirPapelera() {
    this.papeleraOpen = true;
    this.erpService.cargarPapeleraHabitaciones().subscribe(data => { this.papelera = data; this.cdr.detectChanges(); });
  }

  restaurar(id: number) {
    this.erpService.restaurarHabitacion(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(h => h.id !== id); this.notify.success('Habitación restaurada'); this.cdr.detectChanges(); },
      error: err => { this.notify.error(err?.error?.message || 'No se pudo restaurar la habitación'); },
    });
  }

  abrirReportarIncidencia(h: ErpHabitacion) {
    this.incidenciaForm = { id_habitacion: h.id, titulo: '', descripcion: '', prioridad: 'media', fuera_de_servicio: false };
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
      next: () => {
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
}
