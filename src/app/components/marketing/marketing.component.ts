import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';
import { MarketingCampana, ContactoMarketing } from '../../models/crm.models';

@Component({ selector: 'app-marketing', standalone: false, templateUrl: './marketing.component.html', styleUrls: ['./marketing.component.scss'] })
export class MarketingComponent implements OnInit {
  campanas: MarketingCampana[] = [];
  search = ''; dialogOpen = false; editingCamp: MarketingCampana | null = null; expandedCamp: number | null = null;
  estadoColors: Record<string, string> = { activa: 'badge-green', pausada: 'badge-amber', finalizada: 'badge-slate' };
  form = { nombre_compania: '', segmento: '', estado: 'activa' as MarketingCampana['estado'], fecha_inicio: '' };
  contactosInput = '';

  constructor(private crm: CrmService) {}
  ngOnInit() { this.crm.campanas$.subscribe(c => this.campanas = c); }

  get filtered() { return this.campanas.filter(c => c.nombre_compania.toLowerCase().includes(this.search.toLowerCase()) || c.segmento.toLowerCase().includes(this.search.toLowerCase())); }

  resetForm() { this.form = { nombre_compania: '', segmento: '', estado: 'activa', fecha_inicio: '' }; this.contactosInput = ''; this.editingCamp = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }
  handleEdit(camp: MarketingCampana) {
    this.editingCamp = camp;
    this.form = { nombre_compania: camp.nombre_compania, segmento: camp.segmento, estado: camp.estado, fecha_inicio: camp.fecha_inicio };
    this.contactosInput = camp.lista_contactos.map(c => `${c.nombre}, ${c.email}${c.telefono ? ', ' + c.telefono : ''}`).join('\n');
    this.dialogOpen = true;
  }
  parseContactos(input: string): ContactoMarketing[] {
    return input.split('\n').filter(l => l.trim()).map((l, i) => {
      const p = l.split(',').map(x => x.trim());
      return { id: i + 1, nombre: p[0] || '', email: p[1] || '', telefono: p[2] || '' };
    });
  }
  handleSubmit() {
    if (!this.form.nombre_compania) return;
    const lista_contactos = this.contactosInput ? this.parseContactos(this.contactosInput) : [];
    const data = { ...this.form, fecha_inicio: this.form.fecha_inicio || new Date().toISOString().split('T')[0], lista_contactos };
    if (this.editingCamp) { this.crm.updateCampana(this.editingCamp.id, data); }
    else { this.crm.addCampana(data); }
    this.dialogOpen = false; this.resetForm();
  }
  deleteCampana(id: number) { this.crm.deleteCampana(id); }
  toggleExpanded(id: number) { this.expandedCamp = this.expandedCamp === id ? null : id; }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
