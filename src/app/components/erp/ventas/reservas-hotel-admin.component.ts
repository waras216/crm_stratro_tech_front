import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { HOTEL_AMENIDADES_LABELS, NichoService } from '../../../core/services/nicho.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpDisponibilidad, ErpEstadia, ErpHabitacion, ErpReserva } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-reservas-hotel-admin',
  standalone: false,
  templateUrl: './reservas-hotel-admin.component.html',
  styleUrls: ['./reservas-hotel-admin.component.scss'],
  animations: [modalLeave],
})
export class ErpReservasHotelAdminComponent implements OnInit {
  habitaciones: ErpHabitacion[] = [];
  cargando = false;

  habDialogOpen = false;
  habEditando: ErpHabitacion | null = null;
  habForm = { numero: null as number | null, tipo: '', precio: null as number | null, piso: 1 };
  habError = '';
  habSaving = false;

  papeleraOpen = false;
  papelera: ErpHabitacion[] = [];

  historialOpen = false;
  historialCargando = false;
  historial: ErpEstadia[] = [];

  reservas: ErpReserva[] = [];
  reservaDialogOpen = false;
  reservaForm = { id_habitacion: null as number | null, huesped: '', telefono: '', fecha_checkin: '', noches: 1, notas: '' };
  reservaError = '';
  reservaSaving = false;

  disponibilidadOpen = false;
  disponibilidadCargando = false;
  disponibilidad: ErpDisponibilidad | null = null;
  disponibilidadDesde = new Date().toISOString().slice(0, 10);
  disponibilidadHasta = this.sumarDias(new Date(), 13);

  constructor(private erpService: ErpService, public nicho: NichoService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
    this.erpService.reservas$.subscribe(data => { this.reservas = data; this.cdr.detectChanges(); });
    this.erpService.cargarReservas().subscribe();
  }

  get reservasPendientes(): ErpReserva[] {
    return this.reservas.filter(r => r.estado === 'pendiente');
  }

  abrirNuevaReserva() {
    this.reservaForm = { id_habitacion: this.habitaciones[0]?.id ?? null, huesped: '', telefono: '', fecha_checkin: new Date().toISOString().slice(0, 10), noches: 1, notas: '' };
    this.reservaError = '';
    this.reservaDialogOpen = true;
  }

  guardarReserva() {
    if (this.reservaSaving) return;
    if (!this.reservaForm.id_habitacion) { this.reservaError = 'Selecciona una habitación.'; return; }
    if (!this.reservaForm.huesped.trim()) { this.reservaError = 'El nombre del huésped es obligatorio.'; return; }
    if (!this.reservaForm.fecha_checkin) { this.reservaError = 'Indica la fecha de check-in.'; return; }

    this.reservaSaving = true;
    this.reservaError = '';

    this.erpService.crearReserva({
      id_habitacion: this.reservaForm.id_habitacion,
      huesped: this.reservaForm.huesped,
      telefono: this.reservaForm.telefono || undefined,
      fecha_checkin: this.reservaForm.fecha_checkin,
      noches: this.reservaForm.noches || 1,
      notas: this.reservaForm.notas || undefined,
    }).subscribe({
      next: () => {
        this.reservaSaving = false;
        this.reservaDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.reservaSaving = false;
        this.reservaError = err?.error?.message || 'No se pudo crear la reserva';
        this.cdr.detectChanges();
      },
    });
  }

  async cancelarReserva(r: ErpReserva) {
    const ok = await this.notify.confirm(`¿Cancelar la reserva de ${r.huesped}?`, { danger: true, confirmText: 'Cancelar reserva' });
    if (!ok) return;

    this.erpService.cancelarReserva(r.id).subscribe({
      next: () => { this.notify.success('Reserva cancelada'); this.cdr.detectChanges(); },
      error: err => this.notify.error(err?.error?.message || 'No se pudo cancelar la reserva'),
    });
  }

  async hacerCheckInReserva(r: ErpReserva) {
    const ok = await this.notify.confirm(`¿Hacer check-in de ${r.huesped} en la Habitación ${r.habitacion?.numero}?`, { confirmText: 'Check-in' });
    if (!ok) return;

    this.erpService.checkInReserva(r.id).subscribe({
      next: () => { this.notify.success('Check-in completado'); this.cdr.detectChanges(); },
      error: err => this.notify.error(err?.error?.message || 'No se pudo hacer el check-in'),
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

  private sumarDias(fecha: Date, dias: number): string {
    const f = new Date(fecha);
    f.setDate(f.getDate() + dias);
    return f.toISOString().slice(0, 10);
  }

  abrirDisponibilidad() {
    this.disponibilidadOpen = true;
    this.cargarDisponibilidadRango();
  }

  cargarDisponibilidadRango() {
    this.disponibilidadCargando = true;
    this.erpService.cargarDisponibilidad(this.disponibilidadDesde, this.disponibilidadHasta).subscribe({
      next: data => { this.disponibilidad = data; this.disponibilidadCargando = false; this.cdr.detectChanges(); },
      error: () => { this.disponibilidadCargando = false; this.cdr.detectChanges(); },
    });
  }

  claseCelda(estado: string): string {
    switch (estado) {
      case 'libre': return 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer';
      case 'ocupada': return 'bg-amber-100';
      case 'reservada': return 'bg-indigo-100';
      case 'mantenimiento': return 'bg-slate-200';
      default: return 'bg-slate-50';
    }
  }

  reservarDesdeCelda(idHabitacion: number, fecha: string, estado: string) {
    if (estado !== 'libre') return;
    this.disponibilidadOpen = false;
    this.reservaForm = { id_habitacion: idHabitacion, huesped: '', telefono: '', fecha_checkin: fecha, noches: 1, notas: '' };
    this.reservaError = '';
    this.reservaDialogOpen = true;
  }

  abrirHistorial() {
    this.historialOpen = true;
    this.historialCargando = true;
    this.erpService.cargarHistorialEstadias().subscribe({
      next: data => { this.historial = data; this.historialCargando = false; this.cdr.detectChanges(); },
      error: () => { this.historialCargando = false; this.cdr.detectChanges(); },
    });
  }

  restaurar(id: number) {
    this.erpService.restaurarHabitacion(id).subscribe({
      next: () => { this.papelera = this.papelera.filter(h => h.id !== id); this.notify.success('Habitación restaurada'); this.cdr.detectChanges(); },
      error: err => { this.notify.error(err?.error?.message || 'No se pudo restaurar la habitación'); },
    });
  }
}
