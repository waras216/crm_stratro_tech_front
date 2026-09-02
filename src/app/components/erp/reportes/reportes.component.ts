import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { NichoService } from '../../../core/services/nicho.service';
import { ErpEstadia, ErpReportesResumen, ErpReporteOcupacion } from '../../../models/erp.models';

export type SeccionReporte = 'todo' | 'inventario' | 'compras' | 'ventas' | 'finanzas' | 'hotel';

const SECCION_LABEL: Record<SeccionReporte, string> = {
  todo: 'Reporte Completo',
  inventario: 'Reporte de Inventario',
  compras: 'Reporte de Compras',
  ventas: 'Reporte de Ventas',
  finanzas: 'Reporte de Finanzas',
  hotel: 'Reporte de Hotel',
};

@Component({
  selector: 'app-erp-reportes',
  standalone: false,
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ErpReportesComponent implements OnInit {
  resumen: ErpReportesResumen | null = null;
  cargando = true;

  seccion: SeccionReporte = 'todo';
  secciones: { id: SeccionReporte; label: string }[] = [];

  desde = '';
  hasta = '';

  inventarioPorCategoria: { key: string; val: number }[] = [];
  comprasPorEstado: { key: string; val: number }[] = [];
  comprasPorProveedor: { key: string; val: number }[] = [];
  ventasPorEstado: { key: string; val: number }[] = [];
  movimientosPorCategoria: { key: string; val: number }[] = [];

  cargandoHotel = false;
  reporteOcupacion: ErpReporteOcupacion | null = null;
  historialEstadias: ErpEstadia[] = [];

  constructor(private erp: ErpService, private cdr: ChangeDetectorRef, private exportSvc: ReportExportService, public nicho: NichoService) {}

  ngOnInit() {
    this.secciones = [
      { id: 'todo', label: 'Todo' },
      { id: 'inventario', label: 'Inventario' },
      { id: 'compras', label: 'Compras' },
      { id: 'ventas', label: 'Ventas' },
      { id: 'finanzas', label: 'Finanzas' },
    ];
    if (this.nicho.nicho === 'hotel') {
      this.secciones.push({ id: 'hotel', label: 'Hotel' });
    }
    this.cargar();
  }

  cambiarSeccion(s: SeccionReporte) {
    this.seccion = s;
    if (s === 'hotel') this.cargarHotel();
  }

  aplicarFiltro() {
    this.cargar();
    if (this.seccion === 'hotel') this.cargarHotel();
  }

  limpiarFiltro() {
    this.desde = '';
    this.hasta = '';
    this.cargar();
    if (this.seccion === 'hotel') this.cargarHotel();
  }

  private cargarHotel() {
    this.cargandoHotel = true;
    this.erp.cargarReporteOcupacion(this.desde || undefined, this.hasta || undefined).subscribe({
      next: rep => { this.reporteOcupacion = rep; this.cargandoHotel = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoHotel = false; this.cdr.detectChanges(); },
    });
    this.erp.cargarHistorialEstadias().subscribe(hist => { this.historialEstadias = hist; this.cdr.detectChanges(); });
  }

  private cargar() {
    this.erp.cargarReportesResumen(this.desde, this.hasta).subscribe(res => {
      this.resumen = res;
      this.inventarioPorCategoria = this.toArr(res.inventarioPorCategoria);
      this.comprasPorEstado = this.toArr(res.comprasPorEstado);
      this.comprasPorProveedor = this.toArr(res.comprasPorProveedor);
      this.ventasPorEstado = this.toArr(res.ventasPorEstado);
      this.movimientosPorCategoria = this.toArr(res.movimientosPorCategoria);
      this.cargando = false;
      this.cdr.detectChanges();
    });
  }

  toArr(obj: Record<string, number>) { return Object.entries(obj).map(([k, v]) => ({ key: k, val: v })).sort((a, b) => b.val - a.val); }

  estadoBadgeClass(estado: string): string {
    return { pendiente: 'badge-amber', recibida: 'badge-green', cancelada: 'badge-red' }[estado] ?? 'badge-slate';
  }
  maxVal(arr: { val: number }[]) { return arr.length ? Math.max(...arr.map(i => i.val)) : 1; }
  barWidth(val: number, arr: { val: number }[]) { const m = this.maxVal(arr); return m > 0 ? (val / m * 100) + '%' : '0%'; }

  mesLabel(mes: string): string {
    const d = new Date(mes + '-01T00:00:00');
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  maxMensual(): number {
    const meses = this.resumen?.movimientosPorMes ?? [];
    return meses.length ? Math.max(...meses.map(m => Math.max(m.ingresos, m.egresos))) : 1;
  }

  mensualWidth(val: number): string {
    const m = this.maxMensual();
    return m > 0 ? (val / m * 100) + '%' : '0%';
  }

  private buildExportData() {
    const toRows = (arr: { key: string; val: number }[]) => arr.map(i => ({ label: i.key, value: i.val }));
    const kpis = this.resumen?.kpis;
    const tendenciaRows = (this.resumen?.movimientosPorMes ?? []).flatMap(m => [
      { label: `${this.mesLabel(m.mes)} — Ingresos`, value: m.ingresos },
      { label: `${this.mesLabel(m.mes)} — Egresos`, value: m.egresos },
    ]);

    const incluye = (s: SeccionReporte) => this.seccion === 'todo' || this.seccion === s;
    const kpiRows: { label: string; value: number }[] = [];
    const sections: { heading: string; rows: { label: string; value: string | number }[] }[] = [];
    const tables: { heading: string; columns: string[]; rows: (string | number)[][] }[] = [];

    if (kpis && incluye('inventario')) kpiRows.push({ label: 'Valor Inventario', value: kpis.valorInventario });
    if (kpis && incluye('finanzas')) kpiRows.push(
      { label: 'Ingresos', value: kpis.ingresosTotal },
      { label: 'Egresos', value: kpis.egresosTotal },
      { label: 'Balance', value: kpis.balance },
    );
    if (kpis && incluye('compras')) kpiRows.push({ label: 'Compras Pendientes', value: kpis.comprasPendientes });
    if (kpis && incluye('ventas')) kpiRows.push({ label: 'Ventas por Cobrar', value: kpis.ventasPorCobrar });

    if (incluye('inventario')) {
      sections.push({ heading: 'Inventario por Categoría', rows: toRows(this.inventarioPorCategoria) });
    }
    if (incluye('compras')) {
      sections.push({ heading: 'Compras por Estado', rows: toRows(this.comprasPorEstado) });
      sections.push({ heading: 'Compras por Proveedor', rows: toRows(this.comprasPorProveedor) });
      tables.push({
        heading: 'Detalle de Órdenes de Compra',
        columns: ['# Orden', 'Fecha', 'Proveedor', 'Registrada por', 'Items', 'Estado', 'Total'],
        rows: (this.resumen?.comprasDetalle ?? []).map(c => [
          `#${c.id}`, c.fecha, c.proveedor, c.comprador ?? 'Sin registrar', c.items, c.estado, c.total,
        ]),
      });
    }
    if (incluye('ventas')) {
      sections.push({ heading: 'Ventas por Estado', rows: toRows(this.ventasPorEstado) });
      tables.push({
        heading: 'Detalle de Ventas',
        columns: ['# Pedido', 'Fecha', 'Cliente', 'Cajero', 'Items', 'Estado', 'Total'],
        rows: (this.resumen?.ventasDetalle ?? []).map(v => [
          `#${v.id}`, v.fecha, v.cliente, v.cajero ?? 'Sin registrar', v.items, v.estado, v.total,
        ]),
      });
    }
    if (incluye('finanzas')) {
      sections.push({ heading: 'Movimientos por Categoría', rows: toRows(this.movimientosPorCategoria) });
      sections.push({ heading: 'Tendencia Mensual', rows: tendenciaRows });
    }
    if (incluye('hotel') && this.reporteOcupacion) {
      const rep = this.reporteOcupacion;
      kpiRows.push(
        { label: 'Ocupación %', value: rep.ocupacion_pct },
        { label: 'ADR', value: rep.adr },
        { label: 'RevPAR', value: rep.revpar },
        { label: 'Ingresos Hospedaje', value: rep.ingresos_hospedaje },
      );
      tables.push({
        heading: 'Historial de Estadías',
        columns: ['Habitación', 'Huésped', 'Check-in', 'Check-out', 'Noches', 'Total', 'Estado'],
        rows: this.historialEstadias.map(e => [
          e.habitacion?.numero ?? '—', e.huesped, e.check_in, e.check_out_real ?? e.check_out_programado ?? '—', e.noches ?? '—', e.total, e.estado,
        ]),
      });
    }

    return {
      title: SECCION_LABEL[this.seccion],
      kpis: kpiRows,
      sections,
      tables,
    };
  }

  exportarPdf()   { this.exportSvc.exportPdf(this.buildExportData()); }
  exportarExcel() { this.exportSvc.exportExcel(this.buildExportData()); }
}
