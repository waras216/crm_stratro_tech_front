import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';
import { Oportunidad, Cliente } from '../../models/crm.models';

@Component({ selector: 'app-oportunidades', standalone: false, templateUrl: './oportunidades.component.html', styleUrls: ['./oportunidades.component.scss'] })
export class OportunidadesComponent implements OnInit {
  oportunidades: Oportunidad[] = [];
  clientes: Cliente[] = [];
  search = ''; viewMode: 'kanban' | 'lista' = 'kanban'; dialogOpen = false; editingOp: Oportunidad | null = null; expandedOp: number | null = null;

  etapas: Oportunidad['etapa'][] = ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre', 'ganada', 'perdida'];
  etapaColors: Record<string, string> = {
    prospeccion: 'col-slate', contacto: 'col-blue', propuesta: 'col-amber',
    negociacion: 'col-purple', cierre: 'col-teal', ganada: 'col-emerald', perdida: 'col-red',
  };
  etapaBadge: Record<string, string> = {
    prospeccion: 'badge-slate', contacto: 'badge-blue', propuesta: 'badge-amber',
    negociacion: 'badge-purple', cierre: 'badge-teal', ganada: 'badge-emerald', perdida: 'badge-red',
  };

  form = { nombre: '', pipeline: 'Ventas', etapa: 'prospeccion' as Oportunidad['etapa'], valor: '', cliente: '' };

  constructor(private crm: CrmService) {}
  ngOnInit() {
    this.crm.oportunidades$.subscribe(o => this.oportunidades = o);
    this.crm.clientes$.subscribe(c => this.clientes = c);
  }

  get filtered() { return this.oportunidades.filter(o => o.nombre.toLowerCase().includes(this.search.toLowerCase()) || o.cliente.toLowerCase().includes(this.search.toLowerCase())); }
  opsByEtapa(etapa: string) { return this.filtered.filter(o => o.etapa === etapa); }

  resetForm() { this.form = { nombre: '', pipeline: 'Ventas', etapa: 'prospeccion', valor: '', cliente: '' }; this.editingOp = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }
  handleEdit(op: Oportunidad) { this.editingOp = op; this.form = { nombre: op.nombre, pipeline: op.pipeline, etapa: op.etapa, valor: String(op.valor), cliente: op.cliente }; this.dialogOpen = true; }
  handleSubmit() {
    if (!this.form.nombre || !this.form.cliente) return;
    const data = { ...this.form, valor: Number(this.form.valor) || 0 };
    if (this.editingOp) { this.crm.updateOportunidad(this.editingOp.id, data); }
    else { this.crm.addOportunidad(data as any); }
    this.dialogOpen = false; this.resetForm();
  }
  handleMove(id: number, dir: 'next' | 'prev') {
    const op = this.oportunidades.find(o => o.id === id); if (!op) return;
    const idx = this.etapas.indexOf(op.etapa);
    const ni = dir === 'next' ? idx + 1 : idx - 1;
    if (ni >= 0 && ni < this.etapas.length) { this.crm.moverEtapa(id, this.etapas[ni]); }
  }
  deleteOp(id: number) { this.crm.deleteOportunidad(id); }
  toggleExpanded(id: number) { this.expandedOp = this.expandedOp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
