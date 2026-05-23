import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';
import { Lead } from '../../models/crm.models';

@Component({ selector: 'app-leads', standalone: false, templateUrl: './leads.component.html', styleUrls: ['./leads.component.scss'] })
export class LeadsComponent implements OnInit {
  leads: Lead[] = [];
  search = '';
  filterEstatus = 'todos';
  dialogOpen = false;
  editingLead: Lead | null = null;

  estatusOptions = ['nuevo', 'contactado', 'calificado', 'perdido', 'convertido'];
  fuenteOptions = ['Web', 'Referido', 'Red Social', 'Email', 'Llamada', 'Evento', 'Otro'];
  estatusColors: Record<string, string> = {
    nuevo: 'badge-blue', contactado: 'badge-amber', calificado: 'badge-green',
    perdido: 'badge-red', convertido: 'badge-emerald',
  };

  form = { nombre: '', email: '', telefono: '', fuente: 'Web', estatus: 'nuevo' as Lead['estatus'] };

  constructor(private crm: CrmService) {}
  ngOnInit() { this.crm.leads$.subscribe(l => this.leads = l); }

  get filtered() {
    return this.leads.filter(l => {
      const ms = l.nombre.toLowerCase().includes(this.search.toLowerCase()) || l.email?.toLowerCase().includes(this.search.toLowerCase());
      const me = this.filterEstatus === 'todos' || l.estatus === this.filterEstatus;
      return ms && me;
    });
  }

  resetForm() { this.form = { nombre: '', email: '', telefono: '', fuente: 'Web', estatus: 'nuevo' }; this.editingLead = null; }

  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(lead: Lead) {
    this.editingLead = lead;
    this.form = { nombre: lead.nombre, email: lead.email || '', telefono: lead.telefono || '', fuente: lead.fuente, estatus: lead.estatus };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre) return;
    if (this.editingLead) { this.crm.updateLead(this.editingLead.id, this.form); }
    else { this.crm.addLead(this.form); }
    this.dialogOpen = false;
    this.resetForm();
  }

  deleteLead(id: number) { this.crm.deleteLead(id); }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
