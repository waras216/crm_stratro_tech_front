import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpTarifaTemporada } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-tarifas-temporada',
  standalone: false,
  templateUrl: './tarifas-temporada.component.html',
  styleUrls: ['./tarifas-temporada.component.scss'],
  animations: [modalLeave],
})
export class ErpTarifasTemporadaComponent implements OnInit {
  tarifasCargando = false;
  tarifas: ErpTarifaTemporada[] = [];
  tarifaDialogOpen = false;
  tarifaEditando: ErpTarifaTemporada | null = null;
  tarifaForm = { nombre: '', fecha_inicio: '', fecha_fin: '', tipo_ajuste: 'porcentaje' as 'porcentaje' | 'monto_fijo', valor: null as number | null };
  tarifaError = '';
  tarifaSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarTarifas();
  }

  cargarTarifas() {
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
        this.cargarTarifas();
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

  private sumarDias(fecha: Date, dias: number): string {
    const f = new Date(fecha);
    f.setDate(f.getDate() + dias);
    return f.toISOString().slice(0, 10);
  }
}
