import { Component } from '@angular/core';
import { Oportunidad } from '../../models/crm.models';

@Component({ selector: 'app-oportunidades', standalone: false, templateUrl: './oportunidades.component.html', styleUrls: ['./oportunidades.component.scss'] })
export class OportunidadesComponent {
  search = '';
  viewMode: 'kanban' | 'lista' = 'kanban';
  dialogOpen = false;
  editingOp: Oportunidad | null = null;
  expandedOp: number | null = null;
  draggedOp: Oportunidad | null = null;

  etapas: Oportunidad['etapa'][] = ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre'];
  etapaColors: Record<string, string> = {
    prospeccion: 'col-slate', contacto: 'col-blue', propuesta: 'col-amber',
    negociacion: 'col-purple', cierre: 'col-teal',
  };
  etapaBadge: Record<string, string> = {
    prospeccion: 'badge-slate', contacto: 'badge-blue', propuesta: 'badge-amber',
    negociacion: 'badge-purple', cierre: 'badge-teal',
  };

  form = { nombre: '', pipeline: 'Ventas', etapa: 'prospeccion' as Oportunidad['etapa'], valor: '', cliente: '' };

  // Mock data
  oportunidades: Oportunidad[] = [
    { id: 1, id_oportunidad: 1, nombre: 'Implementación ERP', pipeline: 'Ventas', etapa: 'prospeccion', valor: 45000, cliente: 'Grupo Industrial MX' },
    { id: 2, id_oportunidad: 2, nombre: 'Migración Cloud AWS', pipeline: 'Servicios', etapa: 'contacto', valor: 78000, cliente: 'TechSolutions SA' },
    { id: 3, id_oportunidad: 3, nombre: 'App Móvil E-commerce', pipeline: 'Ventas', etapa: 'propuesta', valor: 32000, cliente: 'Retail Plus' },
    { id: 4, id_oportunidad: 4, nombre: 'Consultoría DevOps', pipeline: 'Servicios', etapa: 'negociacion', valor: 55000, cliente: 'FinTech Corp' },
    { id: 5, id_oportunidad: 5, nombre: 'Plataforma IoT', pipeline: 'Ventas', etapa: 'cierre', valor: 120000, cliente: 'Manufactura Global' },
    { id: 6, id_oportunidad: 6, nombre: 'Rediseño Portal Web', pipeline: 'Ventas', etapa: 'prospeccion', valor: 18000, cliente: 'Media Digital' },
    { id: 7, id_oportunidad: 7, nombre: 'Sistema CRM Custom', pipeline: 'Servicios', etapa: 'propuesta', valor: 67000, cliente: 'Seguros Confianza' },
    { id: 8, id_oportunidad: 8, nombre: 'Integración API Pagos', pipeline: 'Ventas', etapa: 'contacto', valor: 25000, cliente: 'E-Shop MX' },
  ];

  mockClientes = ['Grupo Industrial MX', 'TechSolutions SA', 'Retail Plus', 'FinTech Corp', 'Manufactura Global', 'Media Digital', 'Seguros Confianza', 'E-Shop MX'];

  private nextId = 9;

  get filtered() {
    return this.oportunidades.filter(o =>
      o.nombre.toLowerCase().includes(this.search.toLowerCase()) ||
      (o.cliente ?? '').toLowerCase().includes(this.search.toLowerCase())
    );
  }

  opsByEtapa(etapa: string) { return this.filtered.filter(o => o.etapa === etapa); }

  totalByEtapa(etapa: string) {
    return this.opsByEtapa(etapa).reduce((sum, o) => sum + (o.valor ?? 0), 0);
  }

  resetForm() { this.form = { nombre: '', pipeline: 'Ventas', etapa: 'prospeccion', valor: '', cliente: '' }; this.editingOp = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(op: Oportunidad) {
    this.editingOp = op;
    this.form = { nombre: op.nombre, pipeline: op.pipeline ?? '', etapa: op.etapa, valor: String(op.valor ?? ''), cliente: op.cliente ?? '' };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre) return;
    if (this.editingOp) {
      const idx = this.oportunidades.findIndex(o => o.id === this.editingOp!.id);
      if (idx > -1) {
        this.oportunidades[idx] = { ...this.oportunidades[idx], ...this.form, valor: Number(this.form.valor) || 0 };
      }
    } else {
      this.oportunidades.push({
        id: this.nextId, id_oportunidad: this.nextId,
        nombre: this.form.nombre, pipeline: this.form.pipeline,
        etapa: this.form.etapa, valor: Number(this.form.valor) || 0,
        cliente: this.form.cliente, fecha_creacion: new Date().toISOString()
      });
      this.nextId++;
    }
    this.dialogOpen = false;
    this.resetForm();
  }

  handleMove(id: number, dir: 'next' | 'prev') {
    const op = this.oportunidades.find(o => o.id === id); if (!op) return;
    const idx = this.etapas.indexOf(op.etapa);
    const ni = dir === 'next' ? idx + 1 : idx - 1;
    if (ni >= 0 && ni < this.etapas.length) { op.etapa = this.etapas[ni]; }
  }

  deleteOp(id: number) { this.oportunidades = this.oportunidades.filter(o => o.id !== id); }
  toggleExpanded(id: number) { this.expandedOp = this.expandedOp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  // Drag & Drop
  onDragStart(op: Oportunidad) { this.draggedOp = op; }
  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent, etapa: Oportunidad['etapa']) {
    event.preventDefault();
    if (this.draggedOp) {
      this.draggedOp.etapa = etapa;
      this.draggedOp = null;
    }
  }
}
