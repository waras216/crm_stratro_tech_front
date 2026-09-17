import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Pipeline } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({ selector: 'app-pipeline', standalone: false, templateUrl: './pipeline.component.html', styleUrls: ['./pipeline.component.scss'], animations: [modalLeave] })
export class PipelineComponent implements OnInit {
  pipelines: Pipeline[] = [];
  search = '';
  cargando = false;
  dialogOpen = false;
  editingPipeline: Pipeline | null = null;
  formError = '';

  form: { nombre: string; activo: boolean } = { nombre: '', activo: true };

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private notify: NotifyService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.cdr.detectChanges();
    this.crm.cargarPipelines().subscribe({
      next: r => { this.pipelines = r ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  get filtered() {
    return this.pipelines.filter(p => p.nombre.toLowerCase().includes(this.search.toLowerCase()));
  }

  openNew() { this.editingPipeline = null; this.form = { nombre: '', activo: true }; this.formError = ''; this.dialogOpen = true; }
  closeDialog() { this.dialogOpen = false; this.editingPipeline = null; this.formError = ''; }

  handleEdit(p: Pipeline) {
    this.editingPipeline = p;
    this.form = { nombre: p.nombre, activo: p.activo ?? true };
    this.formError = '';
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre.trim()) { this.formError = 'El pipeline necesita un nombre.'; return; }
    const obs = this.editingPipeline
      ? this.crm.updatePipeline(this.editingPipeline.id_pipeline, this.form)
      : this.crm.addPipeline(this.form);
    obs.subscribe({
      next: () => { this.closeDialog(); this.cargar(); },
      error: err => { this.formError = err.error?.message ?? 'Error al guardar el pipeline'; this.cdr.detectChanges(); },
    });
  }

  toggleActivo(p: Pipeline) {
    this.crm.updatePipeline(p.id_pipeline, { activo: !p.activo }).subscribe(() => this.cargar());
  }

  async deletePipeline(id: number) {
    const ok = await this.notify.confirm('¿Eliminar este pipeline? Esta acción no se puede deshacer.', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deletePipeline(id).subscribe(() => { this.cargar(); this.notify.success('Pipeline eliminado'); });
  }
}
