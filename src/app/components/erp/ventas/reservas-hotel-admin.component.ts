import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NichoService } from '../../../core/services/nicho.service';
import { ErpHabitacion } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-reservas-hotel-admin',
  standalone: false,
  templateUrl: './reservas-hotel-admin.component.html',
  styleUrls: ['./reservas-hotel-admin.component.scss'],
})
export class ErpReservasHotelAdminComponent implements OnInit {
  habitaciones: ErpHabitacion[] = [];
  cargando = false;

  habDialogOpen = false;
  habForm = { numero: null as number | null, tipo: '', piso: 1 };
  habError = '';
  habSaving = false;

  constructor(private erpService: ErpService, public nicho: NichoService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.habitaciones$.subscribe(data => { this.habitaciones = data; this.cdr.detectChanges(); });
    this.erpService.cargarHabitaciones().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

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
    this.habForm = { numero: null, tipo: this.nicho.hotelTiposHabitacion[0], piso: 1 };
    this.habError = '';
    this.habDialogOpen = true;
  }

  crearHabitacion() {
    if (this.habSaving || !this.habForm.numero) { this.habError = 'El número de habitación es obligatorio.'; return; }
    this.habSaving = true;
    this.habError = '';
    this.erpService.crearHabitacion({ numero: this.habForm.numero, tipo: this.habForm.tipo, piso: this.habForm.piso || 1 }).subscribe({
      next: () => {
        this.habSaving = false;
        this.habDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.habSaving = false;
        this.habError = err?.error?.message || 'No se pudo crear la habitación';
        this.cdr.detectChanges();
      },
    });
  }
}
