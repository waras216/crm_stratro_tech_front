import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Oportunidad, Cliente, Pipeline } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({ selector: 'app-oportunidades', standalone: false, templateUrl: './oportunidades.component.html', styleUrls: ['./oportunidades.component.scss'], animations: [modalLeave] })
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

  // Cierre de oportunidad (ganada/perdida)
  cierrePromptOpen = false;
  pendingCierreId: number | null = null;
  cierreError = '';

  // Gestión de pipelines
  pipelineManagerOpen = false;
  pipelineFormOpen = false;
  editingPipeline: Pipeline | null = null;
  pipelineForm: { nombre: string; activo: boolean } = { nombre: '', activo: true };
  pipelineError = '';

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private notify: NotifyService) {}

  ngOnInit() {
    this.cargar();
    this.crm.cargarClientes().subscribe({ next: res => { this.clientes = res.data ?? []; this.cdr.detectChanges(); } });
    this.crm.cargarPipelines().subscribe({ next: res => { this.pipelines = res ?? []; this.cdr.detectChanges(); } });
  }

  cargar() {
    this.cargando = true;
    this.crm.cargarOportunidades().subscribe({
      next: res => { this.oportunidades = res.data ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
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
    return this.opsByEtapa(etapa).reduce((sum, o) => sum + Number(o.valor ?? 0), 0);
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
    if (ni >= 0 && ni < this.etapas.length) { this.intentarMoverEtapa(op, this.etapas[ni]); }
  }

  private async intentarMoverEtapa(op: Oportunidad, nuevaEtapa: Oportunidad['etapa']) {
    if (op.etapa === nuevaEtapa) return;

    if (op.etapa === 'cierre' && op.estado !== 'abierta' && nuevaEtapa !== 'cierre') {
      const label = op.estado === 'ganada' ? 'Ganada' : 'Perdida';
      const ok = await this.notify.confirm(`Esta oportunidad está marcada como ${label}. Moverla la reabrirá. ¿Continuar?`, { confirmText: 'Reabrir' });
      if (!ok) return;
    }

    if (nuevaEtapa === 'cierre') {
      this.pendingCierreId = op.id_oportunidad;
      this.cierreError = '';
      this.cierrePromptOpen = true;
      return;
    }

    this.crm.moverEtapa(op.id_oportunidad, nuevaEtapa).subscribe({ next: () => this.cargar() });
  }

  confirmCierre(estado: 'ganada' | 'perdida') {
    if (!this.pendingCierreId) return;
    this.crm.moverEtapa(this.pendingCierreId, 'cierre', estado).subscribe({
      next: () => { this.cierrePromptOpen = false; this.pendingCierreId = null; this.cargar(); },
      error: err => { this.cierreError = err.error?.message ?? 'Error al cerrar la oportunidad'; this.cdr.detectChanges(); },
    });
  }

  cancelCierre() { this.cierrePromptOpen = false; this.pendingCierreId = null; this.cierreError = ''; }

  deleteOp(id: number) { this.crm.deleteOportunidad(id).subscribe(() => this.cargar()); }
  toggleExpanded(id: number) { this.expandedOp = this.expandedOp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  // Drag & Drop
  onDragStart(op: Oportunidad) { this.draggedOp = op; }
  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent, etapa: Oportunidad['etapa']) {
    event.preventDefault();
    if (this.draggedOp && this.draggedOp.etapa !== etapa) {
      this.intentarMoverEtapa(this.draggedOp, etapa);
    }
    this.draggedOp = null;
  }

  // Gestión de pipelines
  private cargarPipelinesList() {
    this.crm.cargarPipelines().subscribe({ next: res => { this.pipelines = res ?? []; this.cdr.detectChanges(); } });
  }

  openPipelineManager() { this.pipelineManagerOpen = true; }
  closePipelineManager() { this.pipelineManagerOpen = false; this.closePipelineForm(); }

  resetPipelineForm() { this.pipelineForm = { nombre: '', activo: true }; this.editingPipeline = null; this.pipelineError = ''; }
  openNewPipeline() { this.resetPipelineForm(); this.pipelineFormOpen = true; }
  closePipelineForm() { this.pipelineFormOpen = false; this.resetPipelineForm(); }

  handleEditPipeline(p: Pipeline) {
    this.editingPipeline = p;
    this.pipelineForm = { nombre: p.nombre, activo: p.activo ?? true };
    this.pipelineFormOpen = true;
  }

  handleSubmitPipeline() {
    if (!this.pipelineForm.nombre.trim()) return;
    const obs = this.editingPipeline
      ? this.crm.updatePipeline(this.editingPipeline.id_pipeline, this.pipelineForm)
      : this.crm.addPipeline(this.pipelineForm);
    obs.subscribe({
      next: () => { this.closePipelineForm(); this.cargarPipelinesList(); },
      error: err => { this.pipelineError = err.error?.message ?? 'Error al guardar el pipeline'; this.cdr.detectChanges(); },
    });
  }

  togglePipelineActivo(p: Pipeline) {
    this.crm.updatePipeline(p.id_pipeline, { activo: !p.activo }).subscribe({
      next: () => this.cargarPipelinesList(),
    });
  }

  async deletePipeline(p: Pipeline) {
    const enUso = this.oportunidades.some(o => o.id_pipeline === p.id_pipeline);
    const aviso = enUso
      ? `"${p.nombre}" tiene oportunidades activas. Eliminarlo también eliminará esas oportunidades. ¿Continuar?`
      : `¿Eliminar el pipeline "${p.nombre}"?`;
    const ok = await this.notify.confirm(aviso, { danger: enUso, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deletePipeline(p.id_pipeline).subscribe({
      next: () => { this.cargarPipelinesList(); this.cargar(); this.notify.success('Pipeline eliminado'); },
    });
  }
}
