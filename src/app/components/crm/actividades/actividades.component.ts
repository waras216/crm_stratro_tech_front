import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Actividad } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

const I = (p: string) =>
  `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${p}</svg>`;

@Component({ selector: 'app-actividades', standalone: false, templateUrl: './actividades.component.html', styleUrls: ['./actividades.component.scss'], animations: [modalLeave] })
export class ActividadesComponent implements OnInit {
  actividades: Actividad[] = [];
  search = ''; filterTipo = 'todos'; dialogOpen = false; editingAct: Actividad | null = null;
  cargando = false;
  completedExpanded = false;
  formError = '';

  tipoOptions: Actividad['tipo'][] = ['llamada', 'reunion', 'email', 'tarea', 'nota'];
  tipoColors: Record<string,string> = {
    llamada:'badge-blue', email:'badge-purple', reunion:'badge-green',
    tarea:'badge-amber', nota:'badge-slate',
  };
  tipoSvg: Record<string,string> = {
    llamada: I('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.62 4.5 2 2 0 0 1 3.59 2.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17z"/>'),
    email:   I('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
    reunion: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    tarea:   I('<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
    nota:    I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
  };

  form: { titulo: string; tipo: Actividad['tipo']; descripcion: string; fecha_inicio: string; hora: string; estado: Actividad['estado'] } =
    { titulo: '', tipo: 'tarea', descripcion: '', fecha_inicio: '', hora: '', estado: 'pendiente' };

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private notify: NotifyService) {}
  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    // Flush inmediato: si "cargando" queda en `true` sin pasar por un chequeo de Angular,
    // un signal-write ajeno (p. ej. un toast) puede disparar un chequeo global que lo agarra
    // en ese estado transitorio nunca visto antes, y Angular tira NG0100 en modo dev.
    this.cdr.detectChanges();
    this.crm.cargarActividades().subscribe({ next: r => { this.actividades = r.data??[]; this.cargando=false; this.cdr.detectChanges(); }, error: () => { this.cargando=false; this.cdr.detectChanges(); } });
  }

  private get filteredBase() {
    return this.actividades.filter(a => {
      const ms = a.titulo.toLowerCase().includes(this.search.toLowerCase());
      const mt = this.filterTipo==='todos' || a.tipo===this.filterTipo;
      return ms && mt;
    });
  }

  // Las completadas se sacan de la lista principal y viven en el acordeón colapsable.
  get pendientes()  { return this.filteredBase.filter(a => a.estado !== 'completada'); }
  get completadas() { return this.filteredBase.filter(a => a.estado === 'completada'); }

  // Selección en bloque (aplica tanto a pendientes como a completadas visibles)
  selectedIds = new Set<number>();
  get bulkLabel() { const n = this.selectedIds.size; return `${n} actividad${n === 1 ? '' : 'es'} seleccionada${n === 1 ? '' : 's'}`; }

  toggleSelect(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
  }

  clearSelection() { this.selectedIds.clear(); }

  async bulkDelete() {
    const n = this.selectedIds.size;
    const ok = await this.notify.confirm(`¿Eliminar ${n} actividad${n === 1 ? '' : 'es'}? Esta acción no se puede deshacer.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    forkJoin(Array.from(this.selectedIds).map(id => this.crm.deleteActividad(id))).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.cdr.detectChanges();
        this.cargar();
        this.notify.success(`${n} actividad${n === 1 ? '' : 'es'} eliminada${n === 1 ? '' : 's'}`);
      },
      error: () => this.notify.error('No se pudieron eliminar algunas actividades'),
    });
  }

  toggleActividad(id: number) {
    const a = this.actividades.find(x=>x.id_actividad===id); if(!a) return;
    this.crm.updateActividad(id, { estado: a.estado === 'completada' ? 'pendiente' : 'completada' }).subscribe(()=>this.cargar());
  }

  openNew()  { this.editingAct=null; this.form={titulo:'',tipo:'tarea',descripcion:'',fecha_inicio:'',hora:'',estado:'pendiente'}; this.formError=''; this.dialogOpen=true; }
  closeDialog() { this.dialogOpen=false; this.editingAct=null; this.formError=''; }

  handleEdit(a: Actividad) {
    this.editingAct=a;
    const { fecha, hora } = this.separarFechaHora(a.fecha_inicio);
    this.form={titulo:a.titulo, tipo:a.tipo, descripcion:a.descripcion??'', fecha_inicio:fecha, hora, estado:a.estado};
    this.formError='';
    this.dialogOpen=true;
  }

  handleSubmit() {
    if (!this.form.titulo.trim()) { this.formError = 'La actividad necesita un título.'; return; }
    const { hora, ...datos } = this.form;
    const payload = { ...datos, fecha_inicio: this.combinarFechaHora(this.form.fecha_inicio, hora) };
    const obs = this.editingAct
      ? this.crm.updateActividad(this.editingAct.id_actividad, payload)
      : this.crm.addActividad(payload);
    obs.subscribe({
      next: () => { this.closeDialog(); this.cargar(); },
      error: err => { this.formError = err.error?.message ?? 'Error al guardar la actividad'; this.cdr.detectChanges(); },
    });
  }

  private separarFechaHora(fechaHora: string | null | undefined): { fecha: string; hora: string } {
    if (!fechaHora) return { fecha: '', hora: '' };
    const [fecha, hora] = fechaHora.replace('T', ' ').split(' ');
    return { fecha: fecha ?? '', hora: hora ? hora.slice(0, 5) : '' };
  }

  private combinarFechaHora(fecha: string, hora: string): string {
    return fecha && hora ? `${fecha}T${hora}:00` : fecha;
  }

  async deleteActividad(id: number) {
    const ok = await this.notify.confirm('¿Eliminar esta actividad? Esta acción no se puede deshacer.', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deleteActividad(id).subscribe(() => { this.cargar(); this.notify.success('Actividad eliminada'); });
  }
}
