import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { Oportunidad, Cliente, Pipeline } from '../../../models/crm.models';

@Component({ selector: 'app-oportunidades', standalone: false, templateUrl: './oportunidades.component.html', styleUrls: ['./oportunidades.component.scss'] })
export class OportunidadesComponent implements OnInit {
  search = '';
  viewMode: 'kanban' | 'lista' = 'kanban';
  dialogOpen = false;
  editingOp: Oportunidad | null = null;
  expandedOp: number | null = null;
  draggedOp: Oportunidad | null = null;
  cargando = false;

  etapas: Oportunidad['etapa'][] = ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre'];
  etapaColors: Record<string, string> = {
    prospeccion: 'col-slate', contacto: 'col-blue', propuesta: 'col-amber',
    negociacion: 'col-purple', cierre: 'col-teal',
  };
  etapaBadge: Record<string, string> = {
    prospeccion: 'badge-slate', contacto: 'badge-blue', propuesta: 'badge-amber',
    negociacion: 'badge-purple', cierre: 'badge-teal',
  };

  oportunidades: Oportunidad[] = [];
  clientes: Cliente[] = [];
  pipelines: Pipeline[] = [];

  form: { titulo: string; id_pipeline: number | null; etapa: Oportunidad['etapa']; valor: string; id_cliente: number | null } =
    { titulo: '', id_pipeline: null, etapa: 'prospeccion', valor: '', id_cliente: null };

  constructor(private crm: CrmService) {}

  ngOnInit() {
    this.cargar();
    this.crm.cargarClientes().subscribe({ next: res => this.clientes = res.data ?? [] });
    this.crm.cargarPipelines().subscribe({ next: res => this.pipelines = res ?? [] });
  }

  cargar() {
    this.cargando = true;
    this.crm.cargarOportunidades().subscribe({
      next: res => { this.oportunidades = res.data ?? []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  get filtered() {
    return this.oportunidades.filter(o =>
      o.titulo.toLowerCase().includes(this.search.toLowerCase()) ||
      (o.cliente?.nombre ?? '').toLowerCase().includes(this.search.toLowerCase())
    );
  }

  opsByEtapa(etapa: string) { return this.filtered.filter(o => o.etapa === etapa); }

  totalByEtapa(etapa: string) {
    return this.opsByEtapa(etapa).reduce((sum, o) => sum + (o.valor ?? 0), 0);
  }

  resetForm() { this.form = { titulo: '', id_pipeline: this.pipelines[0]?.id_pipeline ?? null, etapa: 'prospeccion', valor: '', id_cliente: null }; this.editingOp = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(op: Oportunidad) {
    this.editingOp = op;
    this.form = { titulo: op.titulo, id_pipeline: op.id_pipeline, etapa: op.etapa, valor: String(op.valor ?? ''), id_cliente: op.id_cliente };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.titulo || !this.form.id_cliente || !this.form.id_pipeline) return;
    const data = {
      titulo: this.form.titulo,
      id_cliente: this.form.id_cliente,
      id_pipeline: this.form.id_pipeline,
      etapa: this.form.etapa,
      valor: Number(this.form.valor) || 0,
    };
    const obs = this.editingOp
      ? this.crm.updateOportunidad(this.editingOp.id_oportunidad, data)
      : this.crm.addOportunidad(data);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  handleMove(id: number, dir: 'next' | 'prev') {
    const op = this.oportunidades.find(o => o.id_oportunidad === id); if (!op) return;
    const idx = this.etapas.indexOf(op.etapa);
    const ni = dir === 'next' ? idx + 1 : idx - 1;
    if (ni >= 0 && ni < this.etapas.length) { this.crm.moverEtapa(id, this.etapas[ni]).subscribe(() => this.cargar()); }
  }

  deleteOp(id: number) { this.crm.deleteOportunidad(id).subscribe(() => this.cargar()); }
  toggleExpanded(id: number) { this.expandedOp = this.expandedOp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  // Drag & Drop
  onDragStart(op: Oportunidad) { this.draggedOp = op; }
  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent, etapa: Oportunidad['etapa']) {
    event.preventDefault();
    if (this.draggedOp && this.draggedOp.etapa !== etapa) {
      this.crm.moverEtapa(this.draggedOp.id_oportunidad, etapa).subscribe(() => this.cargar());
    }
    this.draggedOp = null;
  }
}
