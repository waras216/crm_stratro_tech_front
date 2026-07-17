import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { ErpReportesResumen } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-reportes',
  standalone: false,
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ErpReportesComponent implements OnInit {
  resumen: ErpReportesResumen | null = null;

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
      this.cdr.detectChanges();
    });
  }

  toArr(obj: Record<string, number>) { return Object.entries(obj).map(([k, v]) => ({ key: k, val: v })).sort((a, b) => b.val - a.val); }
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
    return {
      title: 'Reportes ERP',
      kpis: kpis ? [
        { label: 'Valor Inventario', value: kpis.valorInventario },
        { label: 'Ingresos', value: kpis.ingresosTotal },
        { label: 'Egresos', value: kpis.egresosTotal },
        { label: 'Balance', value: kpis.balance },
        { label: 'Compras Pendientes', value: kpis.comprasPendientes },
        { label: 'Ventas por Cobrar', value: kpis.ventasPorCobrar },
      ] : [],
      sections: [
        { heading: 'Inventario por Categoría', rows: toRows(this.inventarioPorCategoria) },
        { heading: 'Compras por Estado', rows: toRows(this.comprasPorEstado) },
        { heading: 'Compras por Proveedor', rows: toRows(this.comprasPorProveedor) },
        { heading: 'Ventas por Estado', rows: toRows(this.ventasPorEstado) },
        { heading: 'Movimientos por Categoría', rows: toRows(this.movimientosPorCategoria) },
        { heading: 'Tendencia Mensual', rows: tendenciaRows },
      ],
    };
  }

  exportarPdf()   { this.exportSvc.exportPdf(this.buildExportData()); }
  exportarExcel() { this.exportSvc.exportExcel(this.buildExportData()); }
}
