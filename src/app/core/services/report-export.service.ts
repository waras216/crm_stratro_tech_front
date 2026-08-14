import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook } from 'exceljs';

export interface ReportExportSection {
  heading: string;
  rows: { label: string; value: string | number }[];
}

export interface ReportExportTable {
  heading: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ReportExportData {
  title: string;
  kpis: { label: string; value: string | number }[];
  sections: ReportExportSection[];
  tables?: ReportExportTable[];
}

function slug(title: string): string {
  return title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable({ providedIn: 'root' })
export class ReportExportService {

  exportPdf(data: ReportExportData): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(data.title, 14, 16);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('es-MX'), 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['KPI', 'Valor']],
      body: data.kpis.map(k => [k.label, String(k.value)]),
      theme: 'grid',
    });

    for (const section of data.sections) {
      const prevY = (doc as any).lastAutoTable?.finalY ?? 28;
      autoTable(doc, {
        startY: prevY + 10,
        head: [[section.heading, '']],
        body: section.rows.map(r => [r.label, String(r.value)]),
        theme: 'grid',
      });
    }

    for (const table of data.tables ?? []) {
      const prevY = (doc as any).lastAutoTable?.finalY ?? 28;
      doc.setFontSize(11);
      doc.text(table.heading, 14, prevY + 10);
      autoTable(doc, {
        startY: prevY + 14,
        head: [table.columns],
        body: table.rows.map(r => r.map(String)),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 85, 105] },
      });
    }

    doc.save(`${slug(data.title)}.pdf`);
  }

  async exportExcel(data: ReportExportData): Promise<void> {
    const wb = new Workbook();
    const ws = wb.addWorksheet(data.title.slice(0, 31) || 'Reporte');

    ws.addRow([data.title]).font = { bold: true, size: 14 };
    ws.addRow([new Date().toLocaleDateString('es-MX')]);
    ws.addRow([]);

    ws.addRow(['KPI', 'Valor']).font = { bold: true };
    data.kpis.forEach(k => ws.addRow([k.label, k.value]));

    for (const section of data.sections) {
      ws.addRow([]);
      ws.addRow([section.heading]).font = { bold: true };
      section.rows.forEach(r => ws.addRow([r.label, r.value]));
    }

    for (const table of data.tables ?? []) {
      ws.addRow([]);
      ws.addRow([table.heading]).font = { bold: true };
      ws.addRow(table.columns).font = { bold: true };
      table.rows.forEach(r => ws.addRow(r));
    }

    ws.columns.forEach(col => { col.width = 22; });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(data.title)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
