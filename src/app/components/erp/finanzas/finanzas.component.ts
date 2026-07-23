import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ContabilidadService } from '../../../core/services/contabilidad-service';
import { NotifyService } from '../../../core/services/notify.service';
import {
  ErpAsiento, ErpCuentaContable, ErpBalanceComprobacion, ErpEstadoResultados, ErpBalanceGeneral,
} from '../../../models/contabilidad.models';

interface LineaForm { id_cuenta: string; debe: string; haber: string; descripcion: string; }

@Component({
  selector: 'app-erp-finanzas',
  standalone: false,
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
})
export class ErpFinanzasComponent implements OnInit {
  vista: 'asientos' | 'cuentas' | 'estados' = 'asientos';

  cuentas: ErpCuentaContable[] = [];

  // ── Asientos ──
  asientos: ErpAsiento[] = [];
  asientoExpandido: number | null = null;
  filtroDesde = '';
  filtroHasta = '';
  filtroOrigen = '';

  dialogAsientoOpen = false;
  asientoSaving = false;
  asientoError = '';
  modoAvanzado = false;
  asientoForm = {
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    tipoSimple: 'ingreso' as 'ingreso' | 'egreso',
    monto: '',
    idCuentaContrapartida: '',
  };
  lineas: LineaForm[] = [];

  // ── Plan de cuentas ──
  dialogCuentaOpen = false;
  cuentaSaving = false;
  cuentaError = '';
  cuentaForm = { codigo: '', nombre: '', tipo: 'gasto' as ErpCuentaContable['tipo'], naturaleza: 'deudora' as ErpCuentaContable['naturaleza'] };

  // ── Estados financieros ──
  efVista: 'comprobacion' | 'resultados' | 'general' = 'comprobacion';
  efDesde = '';
  efHasta = '';
  efCorte = new Date().toISOString().slice(0, 10);
  balanceComprobacion: ErpBalanceComprobacion | null = null;
  estadoResultados: ErpEstadoResultados | null = null;
  balanceGeneral: ErpBalanceGeneral | null = null;
  efCargando = false;

  constructor(
    private contabilidad: ContabilidadService,
    private notify: NotifyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.contabilidad.cargarCuentas().subscribe(data => { this.cuentas = data; this.cdr.detectChanges(); });
    this.contabilidad.cuentas$.subscribe(data => { this.cuentas = data; this.cdr.detectChanges(); });
    this.contabilidad.asientos$.subscribe(data => { this.asientos = data; this.cdr.detectChanges(); });
    this.cargarAsientos();
  }

  cambiarVista(v: typeof this.vista) {
    this.vista = v;
    if (v === 'estados') this.cargarEstadoActivo();
  }

  get cuentaCaja(): ErpCuentaContable | undefined {
    return this.cuentas.find(c => c.codigo === '1100');
  }

  get cuentasContrapartida(): ErpCuentaContable[] {
    return this.cuentas.filter(c => c.es_movible && c.id !== this.cuentaCaja?.id);
  }

  // ── Asientos ──
  cargarAsientos() {
    this.contabilidad.cargarAsientos({
      desde: this.filtroDesde || undefined,
      hasta: this.filtroHasta || undefined,
      origen: this.filtroOrigen || undefined,
    }).subscribe(data => { this.asientos = data; this.cdr.detectChanges(); });
  }

  toggleExpandido(id: number) {
    this.asientoExpandido = this.asientoExpandido === id ? null : id;
  }

  openNewAsiento() {
    this.asientoForm = { fecha: new Date().toISOString().slice(0, 10), concepto: '', tipoSimple: 'ingreso', monto: '', idCuentaContrapartida: '' };
    this.lineas = [
      { id_cuenta: '', debe: '', haber: '', descripcion: '' },
      { id_cuenta: '', debe: '', haber: '', descripcion: '' },
    ];
    this.modoAvanzado = false;
    this.asientoError = '';
    this.dialogAsientoOpen = true;
  }

  addLinea() { this.lineas.push({ id_cuenta: '', debe: '', haber: '', descripcion: '' }); }
  removeLinea(i: number) { this.lineas.splice(i, 1); }

  get totalDebeAvanzado() { return this.lineas.reduce((s, l) => s + (Number(l.debe) || 0), 0); }
  get totalHaberAvanzado() { return this.lineas.reduce((s, l) => s + (Number(l.haber) || 0), 0); }

  submitAsiento() {
    if (this.asientoSaving) return;
    if (!this.asientoForm.concepto || !this.asientoForm.fecha) {
      this.asientoError = 'Fecha y concepto son obligatorios.';
      return;
    }

    let lineasPayload: Array<{ id_cuenta: number; debe?: number; haber?: number; descripcion?: string }>;

    if (this.modoAvanzado) {
      lineasPayload = this.lineas
        .filter(l => l.id_cuenta && (Number(l.debe) > 0 || Number(l.haber) > 0))
        .map(l => ({ id_cuenta: Number(l.id_cuenta), debe: Number(l.debe) || 0, haber: Number(l.haber) || 0, descripcion: l.descripcion || undefined }));

      if (lineasPayload.length < 2) { this.asientoError = 'Agrega al menos 2 líneas.'; return; }
      if (Math.round((this.totalDebeAvanzado - this.totalHaberAvanzado) * 100) !== 0) {
        this.asientoError = 'El asiento no balancea: el debe debe ser igual al haber.';
        return;
      }
    } else {
      const caja = this.cuentaCaja;
      const monto = Number(this.asientoForm.monto) || 0;
      if (!caja || !this.asientoForm.idCuentaContrapartida || monto <= 0) {
        this.asientoError = 'Selecciona la cuenta contrapartida y un monto mayor a 0.';
        return;
      }
      const contrapartida = Number(this.asientoForm.idCuentaContrapartida);
      lineasPayload = this.asientoForm.tipoSimple === 'ingreso'
        ? [{ id_cuenta: caja.id, debe: monto }, { id_cuenta: contrapartida, haber: monto }]
        : [{ id_cuenta: contrapartida, debe: monto }, { id_cuenta: caja.id, haber: monto }];
    }

    this.asientoSaving = true;
    this.asientoError = '';
    this.contabilidad.crearAsiento({
      fecha: this.asientoForm.fecha,
      concepto: this.asientoForm.concepto,
      lineas: lineasPayload,
    }).subscribe({
      next: () => { this.asientoSaving = false; this.dialogAsientoOpen = false; this.cdr.detectChanges(); },
      error: err => {
        this.asientoSaving = false;
        this.asientoError = err?.error?.errors?.lineas?.[0] || err?.error?.message || 'No se pudo guardar el asiento.';
        this.cdr.detectChanges();
      },
    });
  }

  async reversar(asiento: ErpAsiento) {
    const ok = await this.notify.confirm(`¿Reversar el asiento "${asiento.concepto}"? Se creará un asiento espejo que anula su efecto.`, { confirmText: 'Reversar' });
    if (!ok) return;

    this.contabilidad.reversarAsiento(asiento.id).subscribe({
      next: () => { this.notify.success('Asiento reversado'); this.cdr.detectChanges(); },
      error: err => { this.notify.error('No se pudo reversar el asiento'); console.error(err); },
    });
  }

  // ── Plan de cuentas ──
  openNewCuenta() {
    this.cuentaForm = { codigo: '', nombre: '', tipo: 'gasto', naturaleza: 'deudora' };
    this.cuentaError = '';
    this.dialogCuentaOpen = true;
  }

  onTipoCuentaChange() {
    const acreedoras: ErpCuentaContable['tipo'][] = ['pasivo', 'capital', 'ingreso'];
    this.cuentaForm.naturaleza = acreedoras.includes(this.cuentaForm.tipo) ? 'acreedora' : 'deudora';
  }

  submitCuenta() {
    if (this.cuentaSaving) return;
    if (!this.cuentaForm.codigo || !this.cuentaForm.nombre) {
      this.cuentaError = 'Código y nombre son obligatorios.';
      return;
    }

    this.cuentaSaving = true;
    this.cuentaError = '';
    this.contabilidad.addCuenta(this.cuentaForm).subscribe({
      next: () => { this.cuentaSaving = false; this.dialogCuentaOpen = false; this.cdr.detectChanges(); },
      error: err => {
        this.cuentaSaving = false;
        this.cuentaError = err?.error?.errors?.codigo?.[0] || 'No se pudo guardar la cuenta.';
        this.cdr.detectChanges();
      },
    });
  }

  async eliminarCuenta(cuenta: ErpCuentaContable) {
    const ok = await this.notify.confirm(`¿Eliminar la cuenta "${cuenta.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.contabilidad.deleteCuenta(cuenta.id).subscribe({
      next: () => { this.notify.success('Cuenta eliminada'); this.cdr.detectChanges(); },
      error: err => { this.notify.error(err?.error?.message || 'No se pudo eliminar la cuenta'); },
    });
  }

  // ── Estados financieros ──
  cambiarEfVista(v: typeof this.efVista) {
    this.efVista = v;
    this.cargarEstadoActivo();
  }

  cargarEstadoActivo() {
    this.efCargando = true;
    const desde = this.efDesde || undefined;
    const hasta = this.efHasta || undefined;

    const obs$: Observable<any> = this.efVista === 'comprobacion' ? this.contabilidad.cargarBalanceComprobacion(desde, hasta)
      : this.efVista === 'resultados' ? this.contabilidad.cargarEstadoResultados(desde, hasta)
      : this.contabilidad.cargarBalanceGeneral(this.efCorte || undefined);

    obs$.subscribe({
      next: (res: any) => {
        if (this.efVista === 'comprobacion') this.balanceComprobacion = res;
        else if (this.efVista === 'resultados') this.estadoResultados = res;
        else this.balanceGeneral = res;
        this.efCargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.efCargando = false; this.cdr.detectChanges(); },
    });
  }
}
