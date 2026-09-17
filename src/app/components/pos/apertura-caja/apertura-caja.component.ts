import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpCaja } from '../../../models/erp.models';

@Component({
  selector: 'app-pos-apertura-caja',
  standalone: false,
  templateUrl: './apertura-caja.component.html',
})
export class AperturaCajaComponent implements OnInit {
  private erpService = inject(ErpService);
  private notify = inject(NotifyService);

  @Output() abierta = new EventEmitter<void>();

  cajas: ErpCaja[] = [];
  cargando = true;
  idCaja: number | null = null;
  montoApertura = 0;
  notas = '';
  guardando = false;

  ngOnInit() {
    this.erpService.cargarCajas().subscribe({
      next: cajas => {
        this.cajas = cajas.filter(c => c.activo !== false);
        this.idCaja = this.cajas[0]?.id_caja ?? null;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.notify.error('No se pudieron cargar las cajas de tu negocio. Pedile a un administrador que te asigne permisos de caja.');
      },
    });
  }

  abrir() {
    if (!this.idCaja || this.montoApertura < 0 || this.guardando) return;
    this.guardando = true;
    this.erpService.abrirTurno({ id_caja: this.idCaja, monto_apertura: this.montoApertura, notas: this.notas || undefined }).subscribe({
      next: () => {
        this.notify.success('Caja abierta');
        this.abierta.emit();
      },
      error: err => {
        this.notify.error(err?.error?.message || 'No se pudo abrir la caja');
        this.guardando = false;
      },
    });
  }
}
