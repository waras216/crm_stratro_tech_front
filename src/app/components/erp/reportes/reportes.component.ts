import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { ErpReportesResumen } from '../../../models/erp.models';

export type SeccionReporte = 'todo' | 'inventario' | 'compras' | 'ventas' | 'finanzas';

const SECCION_LABEL: Record<SeccionReporte, string> = {
  todo: 'Reporte Completo',
  inventario: 'Reporte de Inventario',
  compras: 'Reporte de Compras',
  ventas: 'Reporte de Ventas',
  finanzas: 'Reporte de Finanzas',
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
  secciones: { id: SeccionReporte; label: string }[] = [
    { id: 'todo', label: 'Todo' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'compras', label: 'Compras' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'finanzas', label: 'Finanzas' },
  ];

  desde = '';
  hasta = '';

  inventarioPorCategoria: { key: string; val: number }[] = [];
  comprasPorEstado: { key: string; val: number }[] = [];
  comprasPorProveedor: { key: string; val: number }[] = [];
  ventasPorEstado: { key: string; val: number }[] = [];
  movimientosPorCategoria: { key: string; val: number }[] = [];

  constructor(private erp: ErpService, private cdr: ChangeDetectorRef, private exportSvc: ReportExportService) {}

  ngOnInit() {
    this.cargar();
  }

  cambiarSeccion(s: SeccionReporte) {
    this.seccion = s;
  }

  aplicarFiltro() {
    this.cargar();
  }

  limpiarFiltro() {
    this.desde = '';
    this.hasta = '';
    this.cargar();
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
