import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpProyecto, ErpProyectoTarea, ErpProyectoHora } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-proyectos',
  standalone: false,
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.scss'],
})
export class ErpProyectosComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form = { nombre: '', cliente: '', responsable: '', presupuesto: '' };
  proyectos: ErpProyecto[] = [];
  cargando = true;

  // Detalle expandido (kanban + horas) de un proyecto a la vez
  expandidoId: number | null = null;
  detalleTab: 'kanban' | 'horas' | 'gantt' = 'kanban';
  cargandoDetalle = false;
  tareas: ErpProyectoTarea[] = [];
  horas: ErpProyectoHora[] = [];
  draggedTarea: ErpProyectoTarea | null = null;

  estadosTarea: ErpProyectoTarea['estado'][] = ['pendiente', 'en_progreso', 'completada'];
  estadoLabels: Record<string, string> = { pendiente: 'Pendiente', en_progreso: 'En Progreso', completada: 'Completada' };

  tareaDialogOpen = false;
  tareaForm = { titulo: '', descripcion: '', asignado: '', estado: 'pendiente' as ErpProyectoTarea['estado'], fecha_inicio: '', fecha_fin: '' };
  tareaError = '';
  tareaSaving = false;

  horaDialogOpen = false;
  horaForm = { colaborador: '', fecha: '', horas: '', descripcion: '' };
  horaError = '';
  horaSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarProyectos().subscribe();
    this.erpService.proyectos$.subscribe(data => { this.proyectos = data; this.cargando = false; this.cdr.detectChanges(); });
  }

  get activos() { return this.proyectos.filter(p => p.estado === 'activo').length; }
  get horasTotales() { return this.proyectos.reduce((s, p) => s + Number(p.horas_registradas ?? 0), 0); }
  get presupuestoTotal() { return this.proyectos.reduce((s, p) => s + Number(p.presupuesto || 0), 0); }

  openNew() { this.form = { nombre: '', cliente: '', responsable: '', presupuesto: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre || !this.form.cliente || !this.form.responsable) { this.error = 'Nombre, cliente y responsable son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addProyecto({
      nombre: this.form.nombre,
      cliente: this.form.cliente,
      responsable: this.form.responsable,
      presupuesto: this.form.presupuesto ? Number(this.form.presupuesto) : null,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el proyecto. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  // ── Detalle: kanban + horas ──────────────────────────────────────────
  toggleDetalle(p: ErpProyecto) {
    if (this.expandidoId === p.id) {
      this.expandidoId = null;
      return;
    }
    this.expandidoId = p.id;
    this.detalleTab = 'kanban';
    this.cargarDetalle(p.id);
  }

  private cargarDetalle(idProyecto: number) {
    this.cargandoDetalle = true;
    this.tareas = [];
    this.horas = [];
    this.erpService.cargarTareasProyecto(idProyecto).subscribe({
      next: data => { this.tareas = data; this.cargandoDetalle = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoDetalle = false; this.cdr.detectChanges(); },
    });
    this.erpService.cargarHorasProyecto(idProyecto).subscribe({
      next: data => { this.horas = data; this.cdr.detectChanges(); },
    });
  }

  tareasByEstado(estado: string) { return this.tareas.filter(t => t.estado === estado); }
  totalHoras() { return this.horas.reduce((s, h) => s + Number(h.horas), 0); }

  // ── Kanban drag & drop ───────────────────────────────────────────────
  onDragStart(t: ErpProyectoTarea) { this.draggedTarea = t; }
  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent, estado: ErpProyectoTarea['estado']) {
    event.preventDefault();
    const t = this.draggedTarea;
    this.draggedTarea = null;
    if (!t || t.estado === estado || this.expandidoId === null) return;

    const idProyecto = this.expandidoId;
    const anterior = t.estado;
    t.estado = estado;
    this.cdr.detectChanges();

    this.erpService.moverTareaProyecto(idProyecto, t.id, estado).subscribe({
      error: () => { t.estado = anterior; this.cdr.detectChanges(); },
    });
  }

  // ── Nueva tarea ──────────────────────────────────────────────────────
  openNuevaTarea(estado: ErpProyectoTarea['estado']) {
    this.tareaForm = { titulo: '', descripcion: '', asignado: '', estado, fecha_inicio: '', fecha_fin: '' };
    this.tareaError = '';
    this.tareaDialogOpen = true;
  }

  // ── Gantt ────────────────────────────────────────────────────────────
  get tareasConFechas(): ErpProyectoTarea[] {
    return this.tareas.filter(t => t.fecha_inicio && t.fecha_fin);
  }

  get ganttRango(): { inicio: Date; fin: Date; dias: number } | null {
    const conFechas = this.tareasConFechas;
    if (!conFechas.length) return null;

    const inicios = conFechas.map(t => new Date(t.fecha_inicio!).getTime());
    const fines = conFechas.map(t => new Date(t.fecha_fin!).getTime());
    const inicio = new Date(Math.min(...inicios));
    const fin = new Date(Math.max(...fines));
    const dias = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1);
    return { inicio, fin, dias };
  }

  ganttBarStyle(t: ErpProyectoTarea): { left: string; width: string } {
    const rango = this.ganttRango;
    if (!rango || !t.fecha_inicio || !t.fecha_fin) return { left: '0%', width: '0%' };

    const offsetDias = Math.round((new Date(t.fecha_inicio).getTime() - rango.inicio.getTime()) / 86400000);
    const duracionDias = Math.max(1, Math.round((new Date(t.fecha_fin).getTime() - new Date(t.fecha_inicio).getTime()) / 86400000) + 1);
    const left = (offsetDias / rango.dias) * 100;
    const width = Math.min((duracionDias / rango.dias) * 100, 100 - left);
    return { left: left + '%', width: width + '%' };
  }

  ganttFechaChange(t: ErpProyectoTarea, campo: 'fecha_inicio' | 'fecha_fin', valor: string) {
    if (this.expandidoId === null) return;
    const idProyecto = this.expandidoId;
    this.erpService.actualizarTareaProyecto(idProyecto, t.id, { [campo]: valor || null }).subscribe({
      next: actualizada => {
        t.fecha_inicio = actualizada.fecha_inicio;
        t.fecha_fin = actualizada.fecha_fin;
        this.cdr.detectChanges();
      },
    });
  }

  submitTarea() {
    if (this.tareaSaving || this.expandidoId === null) return;
    if (!this.tareaForm.titulo.trim()) { this.tareaError = 'El título es obligatorio.'; return; }

    this.tareaSaving = true;
    this.tareaError = '';
    this.erpService.addTareaProyecto(this.expandidoId, this.tareaForm).subscribe({
      next: nueva => {
        this.tareas.push(nueva);
        this.tareaSaving = false;
        this.tareaDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: () => { this.tareaSaving = false; this.tareaError = 'No se pudo guardar la tarea.'; this.cdr.detectChanges(); },
    });
  }

  async eliminarTarea(t: ErpProyectoTarea) {
    if (this.expandidoId === null) return;
    const ok = await this.notify.confirm(`¿Eliminar la tarea "${t.titulo}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.eliminarTareaProyecto(this.expandidoId, t.id).subscribe({
      next: () => { this.tareas = this.tareas.filter(x => x.id !== t.id); this.cdr.detectChanges(); },
    });
  }

  // ── Registro de horas ────────────────────────────────────────────────
  openNuevaHora() {
    this.horaForm = { colaborador: '', fecha: new Date().toISOString().slice(0, 10), horas: '', descripcion: '' };
    this.horaError = '';
    this.horaDialogOpen = true;
  }

  submitHora() {
    if (this.horaSaving || this.expandidoId === null) return;
    if (!this.horaForm.colaborador.trim() || !this.horaForm.fecha || !this.horaForm.horas) {
      this.horaError = 'Colaborador, fecha y horas son obligatorios.';
      return;
    }

    this.horaSaving = true;
    this.horaError = '';
    const idProyecto = this.expandidoId;
    this.erpService.addHoraProyecto(idProyecto, {
      colaborador: this.horaForm.colaborador,
      fecha: this.horaForm.fecha,
      horas: Number(this.horaForm.horas),
      descripcion: this.horaForm.descripcion || undefined,
    }).subscribe({
      next: nuevo => {
        this.horas.unshift(nuevo);
        const p = this.proyectos.find(x => x.id === idProyecto);
        if (p) p.horas_registradas = (p.horas_registradas ?? 0) + nuevo.horas;
        this.horaSaving = false;
        this.horaDialogOpen = false;
        this.cdr.detectChanges();
      },
      error: () => { this.horaSaving = false; this.horaError = 'No se pudo guardar el registro.'; this.cdr.detectChanges(); },
    });
  }

  async eliminarHora(h: ErpProyectoHora) {
    if (this.expandidoId === null) return;
    const ok = await this.notify.confirm('¿Eliminar este registro de horas?', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    const idProyecto = this.expandidoId;
    this.erpService.eliminarHoraProyecto(idProyecto, h.id).subscribe({
      next: () => {
        this.horas = this.horas.filter(x => x.id !== h.id);
        const p = this.proyectos.find(x => x.id === idProyecto);
        if (p) p.horas_registradas = Math.max(0, (p.horas_registradas ?? 0) - h.horas);
        this.cdr.detectChanges();
      },
    });
  }
}
