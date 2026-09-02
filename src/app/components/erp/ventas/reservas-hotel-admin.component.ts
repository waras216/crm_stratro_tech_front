import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { HOTEL_AMENIDADES_LABELS, NichoService } from '../../../core/services/nicho.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpDisponibilidad, ErpEstadia, ErpHabitacion, ErpHabitacionIncidencia, ErpHistorialCliente, ErpReporteOcupacion, ErpReserva, ErpTarifaTemporada } from '../../../models/erp.models';
import { Cliente } from '../../../models/crm.models';
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
  reservaForm = { id_habitacion: null as number | null, huesped: '', id_cliente: null as number | null, telefono: '', fecha_checkin: '', noches: 1, notas: '' };
  reservaError = '';
  reservaSaving = false;

  buscandoCliente = false;
  busquedaCliente = '';
  buscarCliente$ = new Subject<string>();
  clientesEncontrados: Cliente[] = [];
  cargandoClientes = false;
  historialHuesped: ErpHistorialCliente | null = null;

  disponibilidadOpen = false;
  disponibilidadCargando = false;
  disponibilidad: ErpDisponibilidad | null = null;
  disponibilidadDesde = new Date().toISOString().slice(0, 10);
  disponibilidadHasta = this.sumarDias(new Date(), 13);

  incidenciasOpen = false;
  incidenciasCargando = false;
  incidencias: ErpHabitacionIncidencia[] = [];

  incidenciaDialogOpen = false;
  incidenciaForm = { id_habitacion: null as number | null, titulo: '', descripcion: '', prioridad: 'media' as 'baja' | 'media' | 'alta', fuera_de_servicio: false };
  incidenciaError = '';
  incidenciaSaving = false;

  reportesOpen = false;
  reportesCargando = false;
  reporte: ErpReporteOcupacion | null = null;
  reportesDesde = this.sumarDias(new Date(), -29);
  reportesHasta = new Date().toISOString().slice(0, 10);

  tarifasOpen = false;
  tarifasCargando = false;
  tarifas: ErpTarifaTemporada[] = [];
  tarifaDialogOpen = false;
  tarifaEditando: ErpTarifaTemporada | null = null;
  tarifaForm = { nombre: '', fecha_inicio: '', fecha_fin: '', tipo_ajuste: 'porcentaje' as 'porcentaje' | 'monto_fijo', valor: null as number | null };
  tarifaError = '';
  tarifaSaving = false;

  constructor(private erpService: ErpService, private crmService: CrmService, public nicho: NichoService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
    this.erpService.reservas$.subscribe(data => { this.reservas = data; this.cdr.detectChanges(); });
    this.erpService.cargarReservas().subscribe();
    this.erpService.cargarIncidencias('abierta').subscribe(data => { this.incidencias = data; this.cdr.detectChanges(); });

    this.buscarCliente$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.cargandoClientes = true;
        return this.crmService.cargarClientes(1, search, '', 6);
      }),
    ).subscribe({
      next: pagina => { this.clientesEncontrados = pagina.data; this.cargandoClientes = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoClientes = false; this.cdr.detectChanges(); },
    });
  }

  seleccionarClienteReserva(c: Cliente) {
    this.reservaForm.id_cliente = c.id_cliente;
    this.reservaForm.huesped = c.nombre;
    if (c.telefono) this.reservaForm.telefono = c.telefono;
    this.buscandoCliente = false;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
    this.historialHuesped = null;
    this.erpService.cargarHistorialCliente(c.id_cliente).subscribe(h => { this.historialHuesped = h; this.cdr.detectChanges(); });
  }

  quitarClienteReserva() {
    this.reservaForm.id_cliente = null;
    this.historialHuesped = null;
  }

  get reservasPendientes(): ErpReserva[] {
    return this.reservas.filter(r => r.estado === 'pendiente');
  }

  abrirNuevaReserva() {
    this.reservaForm = { id_habitacion: this.habitaciones[0]?.id ?? null, huesped: '', id_cliente: null, telefono: '', fecha_checkin: new Date().toISOString().slice(0, 10), noches: 1, notas: '' };
    this.reservaError = '';
    this.buscandoCliente = false;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
    this.historialHuesped = null;
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
      id_cliente: this.reservaForm.id_cliente ?? undefined,
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

  get incidenciasAbiertasCount(): number {
    return this.incidencias.filter(i => i.estado === 'abierta').length;
  }

  abrirIncidencias() {
    this.incidenciasOpen = true;
    this.incidenciasCargando = true;
    this.erpService.cargarIncidencias().subscribe({
      next: data => { this.incidencias = data; this.incidenciasCargando = false; this.cdr.detectChanges(); },
      error: () => { this.incidenciasCargando = false; this.cdr.detectChanges(); },
    });
  }

  abrirReportarIncidencia(h?: ErpHabitacion) {
    this.incidenciaForm = { id_habitacion: h?.id ?? this.habitaciones[0]?.id ?? null, titulo: '', descripcion: '', prioridad: 'media', fuera_de_servicio: false };
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

  abrirReportes() {
    this.reportesOpen = true;
    this.cargarReporteRango();
  }

  cargarReporteRango() {
    this.reportesCargando = true;
    this.erpService.cargarReporteOcupacion(this.reportesDesde, this.reportesHasta).subscribe({
      next: data => { this.reporte = data; this.reportesCargando = false; this.cdr.detectChanges(); },
      error: () => { this.reportesCargando = false; this.cdr.detectChanges(); },
    });
  }

  abrirTarifas() {
    this.tarifasOpen = true;
    this.tarifasCargando = true;
    this.erpService.cargarTarifasTemporada().subscribe({
      next: data => { this.tarifas = data; this.tarifasCargando = false; this.cdr.detectChanges(); },
      error: () => { this.tarifasCargando = false; this.cdr.detectChanges(); },
    });
  }

  abrirNuevaTarifa() {
    this.tarifaEditando = null;
    this.tarifaForm = { nombre: '', fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin: this.sumarDias(new Date(), 30), tipo_ajuste: 'porcentaje', valor: null };
    this.tarifaError = '';
    this.tarifaDialogOpen = true;
  }

  abrirEditarTarifa(t: ErpTarifaTemporada) {
    this.tarifaEditando = t;
    this.tarifaForm = { nombre: t.nombre, fecha_inicio: t.fecha_inicio, fecha_fin: t.fecha_fin, tipo_ajuste: t.tipo_ajuste, valor: t.valor };
    this.tarifaError = '';
    this.tarifaDialogOpen = true;
  }

  guardarTarifa() {
    if (this.tarifaSaving) return;
    if (!this.tarifaForm.nombre.trim()) { this.tarifaError = 'Dale un nombre a la temporada.'; return; }
    if (!this.tarifaForm.fecha_inicio || !this.tarifaForm.fecha_fin) { this.tarifaError = 'Indica el rango de fechas.'; return; }
    if (this.tarifaForm.valor === null) { this.tarifaError = 'Indica el ajuste de tarifa.'; return; }

    this.tarifaSaving = true;
    this.tarifaError = '';

    const payload = {
      nombre: this.tarifaForm.nombre,
      fecha_inicio: this.tarifaForm.fecha_inicio,
      fecha_fin: this.tarifaForm.fecha_fin,
      tipo_ajuste: this.tarifaForm.tipo_ajuste,
      valor: this.tarifaForm.valor,
    };
    const peticion = this.tarifaEditando
      ? this.erpService.actualizarTarifaTemporada(this.tarifaEditando.id, payload)
      : this.erpService.crearTarifaTemporada(payload);

    peticion.subscribe({
      next: () => {
        this.tarifaSaving = false;
        this.tarifaDialogOpen = false;
        this.abrirTarifas();
      },
      error: err => {
        this.tarifaSaving = false;
        this.tarifaError = err?.error?.message || 'No se pudo guardar la temporada';
        this.cdr.detectChanges();
      },
    });
  }

  async eliminarTarifa(t: ErpTarifaTemporada) {
    const ok = await this.notify.confirm(`¿Eliminar la temporada "${t.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.eliminarTarifaTemporada(t.id).subscribe({
      next: () => { this.tarifas = this.tarifas.filter(x => x.id !== t.id); this.notify.success('Temporada eliminada'); this.cdr.detectChanges(); },
      error: err => this.notify.error(err?.error?.message || 'No se pudo eliminar la temporada'),
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
    this.reservaForm = { id_habitacion: idHabitacion, huesped: '', id_cliente: null, telefono: '', fecha_checkin: fecha, noches: 1, notas: '' };
    this.reservaError = '';
    this.buscandoCliente = false;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
    this.historialHuesped = null;
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
