import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';
import { Automatizacion } from '../../models/crm.models';

@Component({ selector: 'app-automatizar', standalone: false, templateUrl: './automatizar.component.html', styleUrls: ['./automatizar.component.scss'] })
export class AutomatizarComponent implements OnInit {
  automatizaciones: Automatizacion[] = [];
  search = ''; dialogOpen = false; editingAuto: Automatizacion | null = null;
  form = { nombre_automatizacion: '', regla: '', evento: '', accion: '', activa: true };

  constructor(private crm: CrmService) {}
  ngOnInit() { this.crm.automatizaciones$.subscribe(a => this.automatizaciones = a); }

  get filtered() { return this.automatizaciones.filter(a => a.nombre_automatizacion.toLowerCase().includes(this.search.toLowerCase()) || a.regla.toLowerCase().includes(this.search.toLowerCase()) || a.accion.toLowerCase().includes(this.search.toLowerCase())); }

  resetForm() { this.form = { nombre_automatizacion: '', regla: '', evento: '', accion: '', activa: true }; this.editingAuto = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }
  handleEdit(a: Automatizacion) { this.editingAuto = a; this.form = { nombre_automatizacion: a.nombre_automatizacion, regla: a.regla, evento: a.evento, accion: a.accion, activa: a.activa }; this.dialogOpen = true; }
  handleSubmit() {
    if (!this.form.nombre_automatizacion || !this.form.regla || !this.form.evento || !this.form.accion) return;
    if (this.editingAuto) { this.crm.updateAutomatizacion(this.editingAuto.id, this.form); }
    else { this.crm.addAutomatizacion(this.form); }
    this.dialogOpen = false; this.resetForm();
  }
  toggle(id: number) { this.crm.toggleAutomatizacion(id); }
  delete(id: number) { this.crm.deleteAutomatizacion(id); }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
