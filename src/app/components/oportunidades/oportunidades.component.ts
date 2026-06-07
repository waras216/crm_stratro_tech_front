import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../core/services/crm-service';
import { Oportunidad, Cliente } from '../../models/crm.models';

@Component({ selector: 'app-oportunidades', standalone: false, templateUrl: './oportunidades.component.html', styleUrls: ['./oportunidades.component.scss'] })
export class OportunidadesComponent implements OnInit {
  oportunidades: Oportunidad[] = [];
  clientes: Cliente[] = [];
  search = ''; viewMode: 'kanban' | 'lista' = 'kanban'; dialogOpen = false; editingOp: Oportunidad | null = null; expandedOp: number | null = null;
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

  form = { nombre: '', pipeline: 'Ventas', etapa: 'prospeccion' as Oportunidad['etapa'], valor: '', cliente: '' };

  constructor(private crm: CrmService) {}

  ngOnInit() {
    this.cargar();
    this.crm.cargarClientes().subscribe(res => { this.clientes = res.data ?? []; });
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
      o.nombre.toLowerCase().includes(this.search.toLowerCase()) ||
      (o.cliente ?? '').toLowerCase().includes(this.search.toLowerCase())
    );
  }

  opsByEtapa(etapa: string) { return this.filtered.filter(o => o.etapa === etapa); }

  resetForm() { this.form = { nombre: '', pipeline: 'Ventas', etapa: 'prospeccion', valor: '', cliente: '' }; this.editingOp = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(op: Oportunidad) {
    this.editingOp = op;
    this.form = { nombre: op.nombre, pipeline: op.pipeline ?? '', etapa: op.etapa, valor: String(op.valor ?? ''), cliente: op.cliente ?? '' };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre) return;
    const data = { ...this.form, valor: Number(this.form.valor) || 0 };
    const obs = this.editingOp
      ? this.crm.updateOportunidad(this.editingOp.id_oportunidad, data)
      : this.crm.addOportunidad(data);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  handleMove(id: number, dir: 'next' | 'prev') {
    const op = this.oportunidades.find(o => o.id_oportunidad === id); if (!op) return;
    const idx = this.etapas.indexOf(op.etapa);
    const ni = dir === 'next' ? idx + 1 : idx - 1;
    if (ni >= 0 && ni < this.etapas.length) {
      this.crm.moverEtapa(id, this.etapas[ni]).subscribe(() => this.cargar());
    }
  }

  deleteOp(id: number) { this.crm.deleteOportunidad(id).subscribe(() => this.cargar()); }
  toggleExpanded(id: number) { this.expandedOp = this.expandedOp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
