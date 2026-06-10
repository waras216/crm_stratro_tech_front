// src/app/components/leads/leads.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../core/services/crm-service';
import { Lead } from '../../models/crm.models';

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

  estatusOptions = ['nuevo', 'contactado', 'calificado', 'perdido'];
fuenteOptions  = ['web', 'referido', 'llamada', 'email', 'otro'];
  estatusColors: Record<string, string> = {
    nuevo: 'badge-blue', contactado: 'badge-amber', calificado: 'badge-green',
    perdido: 'badge-red', convertido: 'badge-emerald',
  };

  // Campos que envía la API: titulo, estado (no nombre/estatus)
  form = { titulo: '', fuente: 'web', estado: 'nuevo', descripcion: '', valor_estimado: null as number | string | null};

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargar(); }

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

  resetForm()   { this.form = { titulo: '', fuente: 'web', estado: 'nuevo', descripcion: '', valor_estimado: null as number | string | null }; this.editingLead = null; }
  openNew()     { this.resetForm(); this.dialogOpen = true; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  handleEdit(lead: Lead) {
    this.editingLead = lead;
    this.form = { titulo: lead.titulo, fuente: lead.fuente, estado: lead.estado, descripcion:lead.descripcion || '', valor_estimado: lead.valor_estimado || null };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.titulo) return;

    const payload = { ...this.form } as any;

    if (payload.valor_estimado === '') payload.valor_estimado = null;
    if (payload.descripcion === '') payload.descripcion = null;

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
      error: () => { this.error = 'Error al eliminar'; },
    });
  }
}
