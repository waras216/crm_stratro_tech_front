import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { Automatizacion } from '../../../models/crm.models';

@Component({ selector: 'app-automatizar', standalone: false, templateUrl: './automatizar.component.html', styleUrls: ['./automatizar.component.scss'] })
export class AutomatizarComponent implements OnInit {
  automatizaciones: Automatizacion[] = [];
  search = ''; dialogOpen = false; editingAuto: Automatizacion | null = null;
  cargando = false;

  form = { nombre_automatizacion: '', regla: '', evento: '', accion: '', activa: true };

  constructor(private crm: CrmService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.crm.cargarAutomatizaciones().subscribe({
      next: res => { this.automatizaciones = res.data ?? []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  get filtered() {
    return this.automatizaciones.filter(a =>
      a.nombre_automatizacion.toLowerCase().includes(this.search.toLowerCase()) ||
      a.regla.toLowerCase().includes(this.search.toLowerCase()) ||
      a.accion.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  resetForm() { this.form = { nombre_automatizacion: '', regla: '', evento: '', accion: '', activa: true }; this.editingAuto = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(a: Automatizacion) {
    this.editingAuto = a;
    this.form = { nombre_automatizacion: a.nombre_automatizacion, regla: a.regla, evento: a.evento, accion: a.accion, activa: a.activa };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre_automatizacion || !this.form.regla || !this.form.evento || !this.form.accion) return;
    const obs = this.editingAuto
      ? this.crm.updateAutomatizacion(this.editingAuto.id, this.form)
      : this.crm.addAutomatizacion(this.form);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  toggle(id: number) { this.crm.toggleAutomatizacion(id).subscribe(() => this.cargar()); }
  delete(id: number) { this.crm.deleteAutomatizacion(id).subscribe(() => this.cargar()); }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
