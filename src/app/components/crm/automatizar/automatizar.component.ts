import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CrmService } from '../../../core/services/crm-service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Automatizacion, AutomatizacionAccion, AutomatizacionEvento, Usuario } from '../../../models/crm.models';

const EVENTO_OPTIONS: { value: AutomatizacionEvento; label: string }[] = [
  { value: 'lead_creado', label: 'Se crea un lead nuevo' },
  { value: 'oportunidad_ganada', label: 'Una oportunidad se marca como ganada' },
  { value: 'oportunidad_perdida', label: 'Una oportunidad se marca como perdida' },
  { value: 'oportunidad_etapa_cambiada', label: 'Una oportunidad cambia de etapa' },
  { value: 'actividad_vencida', label: 'Una actividad vence sin completarse' },
];

const ACCION_OPTIONS: { value: AutomatizacionAccion; label: string }[] = [
  { value: 'enviar_email', label: 'Enviar un email' },
  { value: 'crear_actividad', label: 'Crear una actividad de seguimiento' },
  { value: 'cambiar_estado', label: 'Cambiar automáticamente el estado/etapa' },
  { value: 'notificar_usuario', label: 'Notificar a un usuario del equipo' },
  { value: 'enviar_whatsapp', label: 'Enviar un WhatsApp' },
];

const TIPO_ACTIVIDAD_OPTIONS = ['llamada', 'reunion', 'email', 'tarea', 'nota'];

const VALORES_LEAD = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'calificado', label: 'Calificado' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'convertido', label: 'Convertido' },
];

const VALORES_OPORTUNIDAD = [
  { value: 'prospeccion', label: 'Prospección' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'propuesta', label: 'Propuesta' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'cierre', label: 'Cierre' },
];

@Component({ selector: 'app-automatizar', standalone: false, templateUrl: './automatizar.component.html', styleUrls: ['./automatizar.component.scss'] })
export class AutomatizarComponent implements OnInit {
  automatizaciones: Automatizacion[] = [];
  usuarios: Usuario[] = [];
  search = ''; dialogOpen = false; editingAuto: Automatizacion | null = null;
  cargando = false;

  eventoOptions = EVENTO_OPTIONS;
  tipoActividadOptions = TIPO_ACTIVIDAD_OPTIONS;

  form = {
    nombre_automatizacion: '',
    evento: 'lead_creado' as AutomatizacionEvento,
    accion: 'enviar_email' as AutomatizacionAccion,
    activa: true,
    // Parámetros por acción — solo se envían los relevantes a la acción elegida.
    p_destinatario: 'contacto' as 'contacto' | 'admins',
    p_asunto: '',
    p_mensaje: '',
    p_titulo: '',
    p_tipo_actividad: 'tarea',
    p_dias_vencimiento: 1,
    p_id_usuario_asignado: null as number | null,
    p_valor: '',
    p_id_usuario: null as number | null,
  };

  constructor(private crm: CrmService, private usuarioService: UsuarioService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
    this.usuarioService.cargarUsuarios().subscribe({ next: u => { this.usuarios = u; this.cdr.detectChanges(); } });
  }

  cargar() {
    this.cargando = true;
    this.crm.cargarAutomatizaciones().subscribe({
      next: res => { this.automatizaciones = res.data ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  get filtered() {
    return this.automatizaciones.filter(a =>
      a.nombre_automatizacion.toLowerCase().includes(this.search.toLowerCase()) ||
      this.eventoLabel(a.evento).toLowerCase().includes(this.search.toLowerCase()) ||
      this.accionLabel(a.accion).toLowerCase().includes(this.search.toLowerCase())
    );
  }

  eventoLabel(evento: string): string { return EVENTO_OPTIONS.find(e => e.value === evento)?.label ?? evento; }
  accionLabel(accion: string): string { return ACCION_OPTIONS.find(a => a.value === accion)?.label ?? accion; }

  /** "cambiar_estado" no aplica a actividad_vencida: el motor solo sabe tocar Lead.estado u Oportunidad.etapa. */
  get accionOptions(): { value: AutomatizacionAccion; label: string }[] {
    return ACCION_OPTIONS.filter(a => a.value !== 'cambiar_estado' || this.form.evento !== 'actividad_vencida');
  }

  get valoresDestino(): { value: string; label: string }[] {
    return this.form.evento === 'lead_creado' ? VALORES_LEAD : VALORES_OPORTUNIDAD;
  }

  onEventoChange() {
    if (this.form.accion === 'cambiar_estado' && this.form.evento === 'actividad_vencida') {
      this.form.accion = 'enviar_email';
    }
    this.form.p_valor = '';
  }

  resetForm() {
    this.form = {
      nombre_automatizacion: '', evento: 'lead_creado', accion: 'enviar_email', activa: true,
      p_destinatario: 'contacto', p_asunto: '', p_mensaje: '', p_titulo: '', p_tipo_actividad: 'tarea',
      p_dias_vencimiento: 1, p_id_usuario_asignado: null, p_valor: '', p_id_usuario: null,
    };
    this.editingAuto = null;
  }

  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(a: Automatizacion) {
    this.editingAuto = a;
    const p = a.parametros ?? {};
    this.form = {
      nombre_automatizacion: a.nombre_automatizacion,
      evento: a.evento,
      accion: a.accion,
      activa: a.activa,
      p_destinatario: p['destinatario'] ?? 'contacto',
      p_asunto: p['asunto'] ?? '',
      p_mensaje: p['mensaje'] ?? '',
      p_titulo: p['titulo'] ?? '',
      p_tipo_actividad: p['tipo'] ?? 'tarea',
      p_dias_vencimiento: p['dias_vencimiento'] ?? 1,
      p_id_usuario_asignado: p['id_usuario_asignado'] ?? null,
      p_valor: p['valor'] ?? '',
      p_id_usuario: p['id_usuario'] ?? null,
    };
    this.dialogOpen = true;
  }

  private buildParametros(): Record<string, any> {
    switch (this.form.accion) {
      case 'enviar_email':
        return { destinatario: this.form.p_destinatario, asunto: this.form.p_asunto, mensaje: this.form.p_mensaje };
      case 'crear_actividad':
        return { titulo: this.form.p_titulo, tipo: this.form.p_tipo_actividad, dias_vencimiento: this.form.p_dias_vencimiento, id_usuario_asignado: this.form.p_id_usuario_asignado };
      case 'cambiar_estado':
        return { valor: this.form.p_valor };
      case 'notificar_usuario':
        return { id_usuario: this.form.p_id_usuario, mensaje: this.form.p_mensaje };
      case 'enviar_whatsapp':
        return { mensaje: this.form.p_mensaje };
    }
  }

  handleSubmit() {
    if (!this.form.nombre_automatizacion || !this.form.evento || !this.form.accion) return;

    const payload: Partial<Automatizacion> = {
      nombre_automatizacion: this.form.nombre_automatizacion,
      evento: this.form.evento,
      accion: this.form.accion,
      parametros: this.buildParametros(),
      activa: this.form.activa,
    };

    const obs = this.editingAuto
      ? this.crm.updateAutomatizacion(this.editingAuto.id, payload)
      : this.crm.addAutomatizacion(payload);
    obs.subscribe({ next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); } });
  }

  toggle(id: number) { this.crm.toggleAutomatizacion(id).subscribe(() => this.cargar()); }
  delete(id: number) { this.crm.deleteAutomatizacion(id).subscribe(() => this.cargar()); }
  closeDialog() { this.dialogOpen = false; this.resetForm(); }
}
