import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Oportunidad, Cliente, Pipeline } from '../../../models/crm.models';
import { modalLeave, tabFade } from '../../shared/animations';

@Component({ selector: 'app-oportunidades', standalone: false, templateUrl: './oportunidades.component.html', styleUrls: ['./oportunidades.component.scss'], animations: [modalLeave, tabFade] })
export class OportunidadesComponent implements OnInit {
  search = '';
  viewMode: 'kanban' | 'lista' = 'kanban';
  dialogOpen = false;
  editingOp: Oportunidad | null = null;
  expandedOp: number | null = null;
  draggedOp: Oportunidad | null = null;
  dragOverEtapa: Oportunidad['etapa'] | null = null;
  private dragEnterCount: Partial<Record<Oportunidad['etapa'], number>> = {};
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
  formError = '';

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

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private notify: NotifyService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Llega con ?q= desde un resultado de la búsqueda global del shell — el
    // Kanban y la lista ya filtran por `search` en el cliente (ver `filtered`).
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.search = q;
    this.cargar();
    this.crm.cargarClientes().subscribe({ next: res => { this.clientes = res.data ?? []; this.cdr.detectChanges(); } });
    this.crm.cargarPipelines().subscribe({ next: res => { this.pipelines = res ?? []; this.cdr.detectChanges(); } });
  }

  cargar() {
    this.cargando = true;
    // Flush inmediato: si "cargando" queda en `true` sin pasar por un chequeo de Angular,
    // un signal-write ajeno (p. ej. un toast) puede disparar un chequeo global que lo agarra
    // en ese estado transitorio y nunca visto antes, y Angular tira NG0100 en modo dev.
    this.cdr.detectChanges();
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

  // Selección en bloque (vista Lista)
  selectedIds = new Set<number>();
  get allSelected() { return this.filtered.length > 0 && this.filtered.every(o => this.selectedIds.has(o.id_oportunidad)); }
  get bulkLabel() { const n = this.selectedIds.size; return `${n} oportunidad${n === 1 ? '' : 'es'} seleccionada${n === 1 ? '' : 's'}`; }

  toggleSelect(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
  }

  toggleSelectAll() {
    if (this.allSelected) this.selectedIds.clear();
    else this.filtered.forEach(o => this.selectedIds.add(o.id_oportunidad));
  }

  clearSelection() { this.selectedIds.clear(); }

  async bulkDelete() {
    const n = this.selectedIds.size;
    const ok = await this.notify.confirm(`¿Eliminar ${n} oportunidad${n === 1 ? '' : 'es'}? Esta acción no se puede deshacer.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    forkJoin(Array.from(this.selectedIds).map(id => this.crm.deleteOportunidad(id))).subscribe({
      next: () => { this.selectedIds.clear(); this.cargar(); this.notify.success(`${n} oportunidad${n === 1 ? '' : 'es'} eliminada${n === 1 ? '' : 's'}`); },
      error: () => this.notify.error('No se pudieron eliminar algunas oportunidades'),
    });
  }

  opsByEtapa(etapa: string) { return this.filtered.filter(o => o.etapa === etapa); }

  totalByEtapa(etapa: string) {
    return this.opsByEtapa(etapa).reduce((sum, o) => sum + Number(o.valor ?? 0), 0);
  }

  resetForm() { this.form = { titulo: '', id_pipeline: this.pipelines[0]?.id_pipeline ?? null, etapa: 'prospeccion', valor: '', id_cliente: null }; this.editingOp = null; this.formError = ''; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(op: Oportunidad) {
    this.editingOp = op;
    this.form = { titulo: op.titulo, id_pipeline: op.id_pipeline, etapa: op.etapa, valor: String(op.valor ?? ''), id_cliente: op.id_cliente };
    this.formError = '';
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.titulo.trim())  { this.formError = 'El nombre de la oportunidad es obligatorio.'; return; }
    if (!this.form.id_cliente)     { this.formError = 'Selecciona un cliente.'; return; }
    if (!this.form.id_pipeline)    { this.formError = 'Selecciona un pipeline.'; return; }
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
    obs.subscribe({
      next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); },
      error: err => { this.formError = err.error?.message ?? 'Error al guardar la oportunidad'; this.cdr.detectChanges(); },
    });
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

    // Optimistic UI: aplicamos el cambio de etapa de inmediato — totalByEtapa/opsByEtapa
    // leen del mismo arreglo, así que las columnas y sus contadores de valor se
    // recalculan solos sin esperar la respuesta del servidor. Si el PATCH falla,
    // revertimos.
    const etapaPrevia = op.etapa;
    const estadoPrevio = op.estado;
    op.etapa = nuevaEtapa;
    if (etapaPrevia === 'cierre') op.estado = 'abierta';

    this.crm.moverEtapa(op.id_oportunidad, nuevaEtapa).subscribe({
      error: err => {
        op.etapa = etapaPrevia;
        op.estado = estadoPrevio;
        this.cdr.detectChanges();
        this.notify.error(err.error?.message ?? 'No se pudo mover la oportunidad');
      },
    });
  }

  confirmCierre(estado: 'ganada' | 'perdida') {
    if (!this.pendingCierreId) return;
    this.crm.moverEtapa(this.pendingCierreId, 'cierre', estado).subscribe({
      next: () => { this.cierrePromptOpen = false; this.pendingCierreId = null; this.cargar(); },
      error: err => { this.cierreError = err.error?.message ?? 'Error al cerrar la oportunidad'; this.cdr.detectChanges(); },
    });
  }

  cancelCierre() { this.cierrePromptOpen = false; this.pendingCierreId = null; this.cierreError = ''; }

  async deleteOp(id: number) {
    const ok = await this.notify.confirm('¿Eliminar esta oportunidad? Esta acción no se puede deshacer.', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deleteOportunidad(id).subscribe({
      next: () => { this.cargar(); this.notify.success('Oportunidad eliminada'); },
      error: () => this.notify.error('No se pudo eliminar la oportunidad'),
    });
  }
  toggleExpanded(id: number) { this.expandedOp = this.expandedOp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  // Drag & Drop
  trackByOp(_index: number, op: Oportunidad) { return op.id_oportunidad; }

  onDragStart(op: Oportunidad) { this.draggedOp = op; }

  onDragEnd() {
    this.draggedOp = null;
    this.dragOverEtapa = null;
    this.dragEnterCount = {};
  }

  // dragenter/dragleave burbujean entre la columna y sus tarjetas hijas, así que
  // llevamos un contador por columna para saber cuándo realmente se abandona
  // (en vez de solo pasar de una tarjeta a otra dentro de la misma columna).
  onDragEnter(etapa: Oportunidad['etapa']) {
    this.dragEnterCount[etapa] = (this.dragEnterCount[etapa] ?? 0) + 1;
    this.dragOverEtapa = etapa;
  }

  onDragLeave(etapa: Oportunidad['etapa']) {
    const count = (this.dragEnterCount[etapa] ?? 1) - 1;
    this.dragEnterCount[etapa] = count;
    if (count <= 0 && this.dragOverEtapa === etapa) this.dragOverEtapa = null;
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent, etapa: Oportunidad['etapa']) {
    event.preventDefault();
    this.dragEnterCount[etapa] = 0;
    this.dragOverEtapa = null;
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
    if (!this.pipelineForm.nombre.trim()) { this.pipelineError = 'El nombre del pipeline es obligatorio.'; return; }
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
