import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../core/services/crm-service';
import { Actividad } from '../../models/crm.models';

@Component({ selector: 'app-actividades', standalone: false, templateUrl: './actividades.component.html', styleUrls: ['./actividades.component.scss'] })
export class ActividadesComponent implements OnInit {
  actividades: Actividad[] = [];
  search = ''; filterTipo = 'todos'; showCompleted = true; dialogOpen = false; editingAct: Actividad | null = null;
  cargando = false;

  tipoOptions = ['llamada', 'correo', 'reunion', 'tarea', 'nota', 'seguimiento'];
  tipoColors: Record<string, string> = {
    llamada: 'badge-blue', correo: 'badge-purple', reunion: 'badge-green',
    tarea: 'badge-amber', nota: 'badge-slate', seguimiento: 'badge-teal',
  };
  tipoIcons: Record<string, string> = { llamada: '📞', correo: '✉️', reunion: '👥', tarea: '📋', nota: '📝', seguimiento: '⏰' };

  form = { actividad: '', tipo_actividad: 'tarea' as Actividad['tipo_actividad'], recordatorio: '', fecha: '', completada: false };

  constructor(private crm: CrmService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.crm.cargarActividades().subscribe({
      next: res => { this.actividades = res.data ?? []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  get filtered() {
    return this.actividades.filter(a => {
      const ms = a.actividad.toLowerCase().includes(this.search.toLowerCase());
      const mt = this.filterTipo === 'todos' || a.tipo_actividad === this.filterTipo;
      const mc = this.showCompleted || !a.completada;
      return ms && mt && mc;
    });
  }

  resetForm() { this.form = { actividad: '', tipo_actividad: 'tarea', recordatorio: '', fecha: new Date().toISOString().split('T')[0], completada: false }; this.editingAct = null; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(a: Actividad) {
    this.editingAct = a;
    this.form = { actividad: a.actividad, tipo_actividad: a.tipo_actividad, recordatorio: a.recordatorio ?? '', fecha: a.fecha ?? '', completada: a.completada ?? false };
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.actividad) return;
    const data = { ...this.form, fecha: this.form.fecha || new Date().toISOString().split('T')[0] };
    const obs = this.editingAct
      ? this.crm.updateActividad(this.editingAct.id_pk, data)
      : this.crm.addActividad(data);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  toggleActividad(id: number) { this.crm.toggleActividad(id).subscribe(() => this.cargar()); }
  deleteActividad(id: number) { this.crm.deleteActividad(id).subscribe(() => this.cargar()); }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
