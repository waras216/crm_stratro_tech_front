// src/app/components/leads/leads.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { Lead, Pipeline } from '../../../models/crm.models';

@Component({ selector: 'app-leads', standalone: false, templateUrl: './leads.component.html', styleUrls: ['./leads.component.scss'] })
export class LeadsComponent implements OnInit {
  leads: Lead[]         = [];
  search                = '';
  filterEstatus         = 'todos';
  dialogOpen            = false;
  editingLead: Lead | null = null;
  cargando              = true;
  error                 = '';

  paginaActual = 1;
  totalPaginas = 1;
  total        = 0;

  // Usado en el <select> de edición (no incluye 'convertido': ese estado solo
  // lo puede poner el endpoint de conversión, no un PUT normal).
  estatusOptions       = ['nuevo', 'contactado', 'calificado', 'perdido'];
  // Usado en el filtro de la lista, sí incluye 'convertido'.
  estatusOptionsFiltro = ['nuevo', 'contactado', 'calificado', 'perdido', 'convertido'];
  fuenteOptions  = ['web', 'referido', 'llamada', 'email', 'otro'];
  estatusColors: Record<string, string> = {
    nuevo: 'badge-blue', contactado: 'badge-amber', calificado: 'badge-green',
    perdido: 'badge-red', convertido: 'badge-emerald',
  };

  form = {
    titulo: '', nombre: '', email: '', telefono: '',
    fuente: 'web', estado: 'nuevo', descripcion: '', valor_estimado: null as number | string | null,
  };

  // Conversión a Cliente + Oportunidad
  pipelines: Pipeline[] = [];
  convertDialogOpen = false;
  convertingLead: Lead | null = null;
  convertError = '';
  convertForm = {
    nombre: '', email: '', telefono: '', empresa: '', tipo: 'persona',
    id_pipeline: null as number | null, etapa: 'prospeccion', valor: null as number | string | null,
  };
  etapaOptions = ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre'];

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
    this.crm.cargarPipelines().subscribe({
      next: res => { this.pipelines = res ?? []; this.cdr.detectChanges(); },
    });
  }

  cargar() {
    this.cargando = true;
    this.error    = '';
    this.crm.cargarLeads(this.paginaActual, this.search, this.filterEstatus).subscribe({
      next: res => {
        this.leads        = res?.data ?? [];
        this.total        = res?.total ?? 0;
        this.totalPaginas = res?.last_page ?? 1;
        this.cargando     = false;

        this.cdr.detectChanges();
      },
      error: err => {
        this.error    = err.error?.message ?? 'Error al cargar leads';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filtered() { return this.leads; }

  onSearchChange()   { this.paginaActual = 1; this.cargar(); }
  onFiltroChange()   { this.paginaActual = 1; this.cargar(); }
  paginar(p: number) { if (p < 1 || p > this.totalPaginas) return; this.paginaActual = p; this.cargar(); }

  resetForm()   {
    this.form = {
      titulo: '', nombre: '', email: '', telefono: '',
      fuente: 'web', estado: 'nuevo', descripcion: '', valor_estimado: null as number | string | null,
    };
    this.editingLead = null;
  }
  openNew()     { this.resetForm(); this.dialogOpen = true; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  handleEdit(lead: Lead) {
    this.editingLead = lead;
    this.form = {
      titulo: lead.titulo, nombre: lead.nombre || '', email: lead.email || '', telefono: lead.telefono || '',
      fuente: lead.fuente, estado: lead.estado, descripcion: lead.descripcion || '', valor_estimado: lead.valor_estimado || null,
    };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.titulo) return;

    const payload = { ...this.form } as any;

    if (payload.valor_estimado === '') payload.valor_estimado = null;
    if (payload.descripcion === '') payload.descripcion = null;
    if (payload.nombre === '') payload.nombre = null;
    if (payload.email === '') payload.email = null;
    if (payload.telefono === '') payload.telefono = null;

    const obs = this.editingLead
      ? this.crm.updateLead(this.editingLead.id_lead, payload)
      : this.crm.addLead(payload);

    obs.subscribe({
      next: ()  => { this.dialogOpen = false; this.resetForm(); this.cargar(); },
      error: err => {
        console.error('Errores de Laravel:', err.error?.errors);
        this.error = err.error?.message ?? 'Error al guardar';
        this.cdr.detectChanges();
      },
    });
  }

  deleteLead(id: number) {
    if (!confirm('¿Eliminar este lead?')) return;
    this.crm.deleteLead(id).subscribe({
      next: ()  => this.cargar(),
      error: () => { this.error = 'Error al eliminar'; this.cdr.detectChanges(); },
    });
  }

  openConvert(lead: Lead) {
    if (lead.estado === 'convertido') return;
    this.convertingLead = lead;
    this.convertError = '';
    this.convertForm = {
      nombre: lead.nombre || lead.titulo || '',
      email: lead.email || '',
      telefono: lead.telefono || '',
      empresa: '',
      tipo: 'persona',
      id_pipeline: this.pipelines[0]?.id_pipeline ?? null,
      etapa: 'prospeccion',
      valor: lead.valor_estimado ?? null,
    };
    this.convertDialogOpen = true;
  }

  closeConvert() { this.convertDialogOpen = false; this.convertingLead = null; }

  submitConvert() {
    if (!this.convertingLead || !this.convertForm.id_pipeline) return;

    const payload: any = { ...this.convertForm };
    if (payload.valor === '') payload.valor = null;

    this.crm.convertirLead(this.convertingLead.id_lead, payload).subscribe({
      next: () => {
        this.convertDialogOpen = false;
        this.convertingLead = null;
        this.cargar();
      },
      error: err => {
        this.convertError = err.error?.message ?? 'Error al convertir el lead';
        this.cdr.detectChanges();
      },
    });
  }
}
