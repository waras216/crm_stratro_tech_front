import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpCaja, ErpSucursal, ErpTurnoCaja } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-cajas-turnos',
  standalone: false,
  templateUrl: './cajas-turnos.component.html',
  styleUrls: ['./cajas-turnos.component.scss'],
  animations: [modalLeave],
})
export class ErpCajasTurnosComponent implements OnInit {
  cajas: ErpCaja[] = [];
  sucursales: ErpSucursal[] = [];
  turnos: ErpTurnoCaja[] = [];
  cargando = true;

  dialogCajaOpen = false;
  cajaForm = { nombre: '', id_sucursal: '' };
  cajaSaving = false;
  cajaError = '';

  dialogAbrirOpen = false;
  cajaParaAbrir: ErpCaja | null = null;
  montoApertura = '';
  abrirSaving = false;
  abrirError = '';

  dialogCerrarOpen = false;
  turnoParaCerrar: ErpTurnoCaja | null = null;
  montoCierre = '';
  cerrarSaving = false;
  cerrarError = '';

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cajas$.subscribe(data => { this.cajas = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarCajas().subscribe();

    this.erpService.sucursales$.subscribe(data => { this.sucursales = data; this.cdr.detectChanges(); });
    this.erpService.cargarSucursales().subscribe();

    this.erpService.turnos$.subscribe(data => { this.turnos = data; this.cdr.detectChanges(); });
    this.erpService.cargarTurnos().subscribe();
  }

  turnoAbiertoDe(idCaja: number): ErpTurnoCaja | undefined {
    return this.turnos.find(t => t.id_caja === idCaja && t.estado === 'abierto');
  }

  abrirNuevaCaja() {
    this.cajaForm = { nombre: '', id_sucursal: '' };
    this.cajaError = '';
    this.dialogCajaOpen = true;
  }

  submitCaja() {
    if (this.cajaSaving) return;
    if (!this.cajaForm.nombre.trim() || !this.cajaForm.id_sucursal) { this.cajaError = 'Nombre y sucursal son obligatorios.'; return; }

    this.cajaSaving = true;
    this.cajaError = '';
    this.erpService.addCaja({ nombre: this.cajaForm.nombre, id_sucursal: Number(this.cajaForm.id_sucursal) }).subscribe({
      next: () => { this.cajaSaving = false; this.dialogCajaOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.cajaSaving = false; this.cajaError = 'No se pudo crear la caja.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  async eliminarCaja(c: ErpCaja) {
    const ok = await this.notify.confirm(`¿Eliminar la caja "${c.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteCaja(c.id_caja).subscribe({
      next: () => { this.notify.success('Caja eliminada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error(err?.error?.message || 'No se pudo eliminar la caja'); console.error(err); },
    });
  }

  abrirModalTurno(c: ErpCaja) {
    this.cajaParaAbrir = c;
    this.montoApertura = '';
    this.abrirError = '';
    this.dialogAbrirOpen = true;
  }

  submitAbrirTurno() {
    if (this.abrirSaving || !this.cajaParaAbrir) return;
    if (!this.montoApertura || Number(this.montoApertura) < 0) { this.abrirError = 'Ingresa el monto inicial de la caja.'; return; }

    this.abrirSaving = true;
    this.abrirError = '';
    this.erpService.abrirTurno({ id_caja: this.cajaParaAbrir.id_caja, monto_apertura: Number(this.montoApertura) }).subscribe({
      next: () => { this.abrirSaving = false; this.dialogAbrirOpen = false; this.notify.success('Turno abierto'); this.cdr.detectChanges(); },
      error: (err) => { this.abrirSaving = false; this.abrirError = err?.error?.message || 'No se pudo abrir el turno.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  abrirModalCerrar(t: ErpTurnoCaja) {
    this.turnoParaCerrar = t;
    this.montoCierre = '';
    this.cerrarError = '';
    this.dialogCerrarOpen = true;
  }

  submitCerrarTurno() {
    if (this.cerrarSaving || !this.turnoParaCerrar) return;
    if (!this.montoCierre || Number(this.montoCierre) < 0) { this.cerrarError = 'Ingresa el monto final en caja.'; return; }

    this.cerrarSaving = true;
    this.cerrarError = '';
    this.erpService.cerrarTurno(this.turnoParaCerrar.id_turno, { monto_cierre: Number(this.montoCierre) }).subscribe({
      next: () => { this.cerrarSaving = false; this.dialogCerrarOpen = false; this.notify.success('Turno cerrado'); this.cdr.detectChanges(); },
      error: (err) => { this.cerrarSaving = false; this.cerrarError = err?.error?.message || 'No se pudo cerrar el turno.'; this.cdr.detectChanges(); console.error(err); },
    });
  }
}
