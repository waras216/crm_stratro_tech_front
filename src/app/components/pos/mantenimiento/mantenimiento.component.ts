import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpHabitacion, ErpHabitacionIncidencia } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

/**
 * Pantalla para el personal de mantenimiento: cola de tickets (incidencias)
 * abiertas, igual que "Comandas" es la cola del cocinero/bartender. Además
 * permite levantar un ticket nuevo directo desde el POS (botón "+ Reportar"),
 * sin tener que ir a ERP > Mantenimiento. Reutiliza el mismo backend de
 * incidencias por habitación que ya usa ErpMantenimientoHotelComponent.
 * Se refresca sola porque normalmente vive en una tablet fija, igual que Comandas.
 */
@Component({
  selector: 'app-pos-mantenimiento',
  standalone: false,
  templateUrl: './mantenimiento.component.html',
  animations: [modalLeave],
})
export class PosMantenimientoComponent implements OnInit, OnDestroy {
  incidencias: ErpHabitacionIncidencia[] = [];
  habitaciones: ErpHabitacion[] = [];
  cargando = false;
  resolviendo: number | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;

  dialogOpen = false;
  form = { id_habitacion: null as number | null, titulo: '', descripcion: '', prioridad: 'media' as 'baja' | 'media' | 'alta', fuera_de_servicio: false };
  error = '';
  saving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe();
    this.cargar();
    this.poll = setInterval(() => this.cargar(), 8000);
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
  }

  cargar() {
    this.cargando = this.incidencias.length === 0;
    this.erpService.cargarIncidencias('abierta').subscribe({
      next: data => { this.incidencias = data; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  resolver(inc: ErpHabitacionIncidencia) {
    this.resolviendo = inc.id;
    this.erpService.resolverIncidencia(inc.id).subscribe({
      next: () => {
        this.incidencias = this.incidencias.filter(i => i.id !== inc.id);
        this.resolviendo = null;
        this.notify.success('Ticket resuelto');
        this.cdr.detectChanges();
      },
      error: () => {
        this.resolviendo = null;
        this.notify.error('No se pudo resolver el ticket');
        this.cdr.detectChanges();
      },
    });
  }

  abrirReportar() {
    this.form = { id_habitacion: this.habitaciones[0]?.id ?? null, titulo: '', descripcion: '', prioridad: 'media', fuera_de_servicio: false };
    this.error = '';
    this.dialogOpen = true;
  }

  guardar() {
    if (this.saving) return;
    if (!this.form.id_habitacion) { this.error = 'Selecciona una habitación.'; return; }
    if (!this.form.titulo.trim()) { this.error = 'Describe brevemente el problema.'; return; }

    this.saving = true;
    this.error = '';

    this.erpService.reportarIncidencia(this.form.id_habitacion, {
      titulo: this.form.titulo,
      descripcion: this.form.descripcion || undefined,
      prioridad: this.form.prioridad,
      fuera_de_servicio: this.form.fuera_de_servicio,
    }).subscribe({
      next: nueva => {
        this.incidencias = [nueva, ...this.incidencias];
        this.saving = false;
        this.dialogOpen = false;
        this.notify.success('Ticket reportado');
        this.cdr.detectChanges();
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo reportar el ticket';
        this.cdr.detectChanges();
      },
    });
  }
}
