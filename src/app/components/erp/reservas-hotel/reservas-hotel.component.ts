import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpDisponibilidad, ErpHabitacion, ErpHistorialCliente, ErpReserva } from '../../../models/erp.models';
import { Cliente } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-reservas-hotel',
  standalone: false,
  templateUrl: './reservas-hotel.component.html',
  styleUrls: ['./reservas-hotel.component.scss'],
  animations: [modalLeave],
})
export class ErpReservasHotelComponent implements OnInit {
  habitaciones: ErpHabitacion[] = [];
  reservas: ErpReserva[] = [];

  vistaReservas: 'lista' | 'disponibilidad' = 'lista';
  private disponibilidadCargada = false;

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

  disponibilidadCargando = false;
  disponibilidad: ErpDisponibilidad | null = null;
  disponibilidadDesde = new Date().toISOString().slice(0, 10);
  disponibilidadHasta = this.sumarDias(new Date(), 13);

  constructor(private erpService: ErpService, private crmService: CrmService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe();
    this.erpService.reservas$.subscribe(data => { this.reservas = data; this.cdr.detectChanges(); });
    this.erpService.cargarReservas().subscribe();

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

  cambiarVistaReservas(vista: 'lista' | 'disponibilidad') {
    this.vistaReservas = vista;
    if (vista === 'disponibilidad' && !this.disponibilidadCargada) { this.disponibilidadCargada = true; this.cargarDisponibilidadRango(); }
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

  private sumarDias(fecha: Date, dias: number): string {
    const f = new Date(fecha);
    f.setDate(f.getDate() + dias);
    return f.toISOString().slice(0, 10);
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
    this.reservaForm = { id_habitacion: idHabitacion, huesped: '', id_cliente: null, telefono: '', fecha_checkin: fecha, noches: 1, notas: '' };
    this.reservaError = '';
    this.buscandoCliente = false;
    this.busquedaCliente = '';
    this.clientesEncontrados = [];
    this.historialHuesped = null;
    this.reservaDialogOpen = true;
  }
}
