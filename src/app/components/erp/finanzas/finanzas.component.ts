import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ContabilidadService } from '../../../core/services/contabilidad-service';
import { ReportExportService, ReportExportData } from '../../../core/services/report-export.service';
import { NotifyService } from '../../../core/services/notify.service';
import {
  ErpAsiento, ErpCuentaContable, ErpBalanceComprobacion, ErpEstadoResultados, ErpBalanceGeneral,
} from '../../../models/contabilidad.models';

interface LineaForm { id_cuenta: string; debe: string; haber: string; descripcion: string; }

const TIPOS_CUENTA: { tipo: ErpCuentaContable['tipo']; label: string }[] = [
  { tipo: 'activo', label: 'Activo (lo que tienes)' },
  { tipo: 'pasivo', label: 'Pasivo (lo que debes)' },
  { tipo: 'capital', label: 'Capital' },
  { tipo: 'ingreso', label: 'Ingreso' },
  { tipo: 'costo', label: 'Costo' },
  { tipo: 'gasto', label: 'Gasto' },
];

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

  cargandoAsientos = true;
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
    private exportSvc: ReportExportService,
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

  tiposCuenta = TIPOS_CUENTA;

  get cuentaCaja(): ErpCuentaContable | undefined {
    return this.cuentas.find(c => c.codigo === '1100');
  }

  get cuentasContrapartida(): ErpCuentaContable[] {
    return this.cuentas.filter(c => c.es_movible && c.activo && c.id !== this.cuentaCaja?.id);
  }

  cuentasDeTipo(tipo: ErpCuentaContable['tipo']): ErpCuentaContable[] {
    return this.cuentas.filter(c => c.tipo === tipo && c.es_movible && c.activo);
  }

  // Modo simple: solo se ofrecen las cuentas del tipo que de verdad aplica
  // (Ingreso para dinero que entra, Costo/Gasto para dinero que sale) en vez
  // de las 6 categorías completas del plan de cuentas — si necesitan otra
  // cuenta (Pasivo, Capital, etc.) está el modo avanzado para eso.
  get cuentasSimpleFiltradas(): ErpCuentaContable[] {
    const tipos: ErpCuentaContable['tipo'][] = this.asientoForm.tipoSimple === 'ingreso' ? ['ingreso'] : ['gasto', 'costo'];
    return this.cuentasContrapartida.filter(c => tipos.includes(c.tipo));
  }

  onTipoSimpleChange() {
    this.asientoForm.idCuentaContrapartida = '';
  }

  naturalezaAmigable(naturaleza: ErpCuentaContable['naturaleza']): string {
    return naturaleza === 'deudora' ? 'Aumenta con Debe' : 'Aumenta con Haber';
  }

  // ── Asientos ──
  cargarAsientos() {
    this.cargandoAsientos = true;
    this.contabilidad.cargarAsientos({
      desde: this.filtroDesde || undefined,
      hasta: this.filtroHasta || undefined,
      origen: this.filtroOrigen || undefined,
    }).subscribe(data => { this.asientos = data; this.cargandoAsientos = false; this.cdr.detectChanges(); });
  }

  origenBadgeClass(origen: string): string {
    const clases: Record<string, string> = {
      manual: 'badge-slate',
      venta: 'badge-blue',
      compra: 'bg-orange-100 text-orange-600',
      nomina: 'badge-purple',
      migracion: 'badge-slate',
      ajuste: 'badge-red',
    };
    return clases[origen] ?? 'badge-slate';
  }

  toggleExpandido(id: number) {
    this.asientoExpandido = this.asientoExpandido === id ? null : id;
  }

  filtroPreset(preset: 'mes' | 'mesAnterior' | 'anio' | 'todo') {
    const hoy = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'todo') {
      this.filtroDesde = '';
      this.filtroHasta = '';
    } else if (preset === 'mes') {
      this.filtroDesde = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      this.filtroHasta = iso(hoy);
    } else if (preset === 'mesAnterior') {
      this.filtroDesde = iso(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
      this.filtroHasta = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 0));
    } else if (preset === 'anio') {
      this.filtroDesde = iso(new Date(hoy.getFullYear(), 0, 1));
      this.filtroHasta = iso(hoy);
    }
    this.cargarAsientos();
  }

  get presetActivo(): 'mes' | 'mesAnterior' | 'anio' | 'todo' | null {
    if (!this.filtroDesde && !this.filtroHasta) return 'todo';
    const hoy = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (this.filtroDesde === iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)) && this.filtroHasta === iso(hoy)) return 'mes';
    if (this.filtroDesde === iso(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)) && this.filtroHasta === iso(new Date(hoy.getFullYear(), hoy.getMonth(), 0))) return 'mesAnterior';
    if (this.filtroDesde === iso(new Date(hoy.getFullYear(), 0, 1)) && this.filtroHasta === iso(hoy)) return 'anio';
    return null;
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
  get diferenciaAvanzado() { return Math.round((this.totalDebeAvanzado - this.totalHaberAvanzado) * 100) / 100; }
  get avanzadoBalanceado() { return this.diferenciaAvanzado === 0 && (this.totalDebeAvanzado > 0 || this.totalHaberAvanzado > 0); }

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
      next: () => { this.notify.success('Asiento reversado'); this.cargarAsientos(); },
      error: err => {
        this.notify.error(err?.error?.errors?.asiento?.[0] || 'No se pudo reversar el asiento');
        this.cargarAsientos();
        console.error(err);
      },
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

  toggleActivo(cuenta: ErpCuentaContable) {
    this.contabilidad.updateCuenta(cuenta.id, { activo: !cuenta.activo }).subscribe({
      next: actualizada => { this.notify.success(actualizada.activo ? 'Cuenta reactivada' : 'Cuenta desactivada'); this.cdr.detectChanges(); },
      error: err => { this.notify.error(err?.error?.message || 'No se pudo actualizar la cuenta'); },
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

  private buildBalanceComprobacionExportData(): ReportExportData | null {
    const bc = this.balanceComprobacion;
    if (!bc) return null;

    return {
      title: 'Balance de Comprobación',
      kpis: [
        { label: 'Total Debe', value: bc.total_debe },
        { label: 'Total Haber', value: bc.total_haber },
        { label: 'Cuadra', value: bc.total_debe === bc.total_haber ? 'Sí' : 'No' },
      ],
      sections: [
        { heading: 'Cuentas', rows: bc.cuentas.map(c => ({ label: `${c.codigo} — ${c.nombre}`, value: c.saldo })) },
      ],
    };
  }

  exportarBalanceComprobacionPdf() {
    const data = this.buildBalanceComprobacionExportData();
    if (data) this.exportSvc.exportPdf(data);
  }

  exportarBalanceComprobacionExcel() {
    const data = this.buildBalanceComprobacionExportData();
    if (data) this.exportSvc.exportExcel(data);
  }

  private buildEstadoResultadosExportData(): ReportExportData | null {
    const er = this.estadoResultados;
    if (!er) return null;

    return {
      title: 'Estado de Resultados',
      kpis: [
        { label: 'Total Ingresos', value: er.total_ingresos },
        { label: 'Total Costos', value: er.total_costos },
        { label: 'Total Gastos', value: er.total_gastos },
        { label: 'Utilidad Neta', value: er.utilidad_neta },
      ],
      sections: [
        { heading: 'Ingresos', rows: er.ingresos.map(f => ({ label: f.nombre, value: f.monto })) },
        { heading: 'Costos', rows: er.costos.map(f => ({ label: f.nombre, value: f.monto })) },
        { heading: 'Gastos', rows: er.gastos.map(f => ({ label: f.nombre, value: f.monto })) },
      ],
    };
  }

  exportarEstadoResultadosPdf() {
    const data = this.buildEstadoResultadosExportData();
    if (data) this.exportSvc.exportPdf(data);
  }

  exportarEstadoResultadosExcel() {
    const data = this.buildEstadoResultadosExportData();
    if (data) this.exportSvc.exportExcel(data);
  }

  private buildBalanceGeneralExportData(): ReportExportData | null {
    const bg = this.balanceGeneral;
    if (!bg) return null;

    return {
      title: `Balance General al ${bg.corte}`,
      kpis: [
        { label: 'Total Activo', value: bg.total_activo },
        { label: 'Total Pasivo', value: bg.total_pasivo },
        { label: 'Total Capital', value: bg.total_capital },
        { label: 'Cuadra', value: bg.cuadra ? 'Sí' : 'No' },
      ],
      sections: [
        { heading: 'Activo', rows: bg.activo.map(f => ({ label: `${f.codigo} — ${f.nombre}`, value: f.saldo })) },
        { heading: 'Pasivo', rows: bg.pasivo.map(f => ({ label: `${f.codigo} — ${f.nombre}`, value: f.saldo })) },
        {
          heading: 'Capital',
          rows: [
            ...bg.capital.map(f => ({ label: `${f.codigo} — ${f.nombre}`, value: f.saldo })),
            { label: 'Resultado del Ejercicio', value: bg.resultado_ejercicio },
          ],
        },
      ],
    };
  }

  exportarBalanceGeneralPdf() {
    const data = this.buildBalanceGeneralExportData();
    if (data) this.exportSvc.exportPdf(data);
  }

  exportarBalanceGeneralExcel() {
    const data = this.buildBalanceGeneralExportData();
    if (data) this.exportSvc.exportExcel(data);
  }
}
