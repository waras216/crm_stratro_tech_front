import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Lead, Oportunidad, Cliente, Actividad,
  MarketingCampana, Automatizacion, Integracion
} from '../models/crm.models';

const generateId = () => Math.floor(Math.random() * 1000000);
const today = () => new Date().toISOString().split('T')[0];

@Injectable({ providedIn: 'root' })
export class CrmService {

  // ── Leads ──────────────────────────────────────────────────────────────────
  private _leads = new BehaviorSubject<Lead[]>([
    { id: 1, nombre: 'Juan Pérez',    fuente: 'Web',        estatus: 'nuevo',      email: 'juan@email.com',   telefono: '555-0101', fecha_creacion: '2026-05-01' },
    { id: 2, nombre: 'María García',  fuente: 'Referido',   estatus: 'contactado', email: 'maria@email.com',  telefono: '555-0102', fecha_creacion: '2026-05-02' },
    { id: 3, nombre: 'Carlos López',  fuente: 'Red Social', estatus: 'calificado', email: 'carlos@email.com', telefono: '555-0103', fecha_creacion: '2026-05-03' },
    { id: 4, nombre: 'Ana Martínez',  fuente: 'Email',      estatus: 'nuevo',      email: 'ana@email.com',    telefono: '555-0104', fecha_creacion: '2026-05-04' },
    { id: 5, nombre: 'Pedro Sánchez', fuente: 'Llamada',    estatus: 'perdido',    email: 'pedro@email.com',  telefono: '555-0105', fecha_creacion: '2026-05-05' },
  ]);
  leads$ = this._leads.asObservable();
  get leads() { return this._leads.getValue(); }

  addLead(lead: Omit<Lead, 'id' | 'fecha_creacion'>) {
    this._leads.next([...this.leads, { ...lead, id: generateId(), fecha_creacion: today() }]);
  }
  updateLead(id: number, lead: Partial<Lead>) {
    this._leads.next(this.leads.map(l => l.id === id ? { ...l, ...lead } : l));
  }
  deleteLead(id: number) {
    this._leads.next(this.leads.filter(l => l.id !== id));
  }

  // ── Oportunidades ──────────────────────────────────────────────────────────
  private _oportunidades = new BehaviorSubject<Oportunidad[]>([
    { id: 1, nombre: 'Venta Software ERP', pipeline: 'Ventas',    etapa: 'propuesta',   valor: 50000, cliente: 'Empresa ABC',     fecha_creacion: '2026-05-01', historial_etapas: [{ etapa: 'prospeccion', fecha: '2026-05-01' }, { etapa: 'contacto', fecha: '2026-05-03' }, { etapa: 'propuesta', fecha: '2026-05-06' }] },
    { id: 2, nombre: 'Consultoría IT',     pipeline: 'Servicios', etapa: 'negociacion', valor: 25000, cliente: 'TechCorp',        fecha_creacion: '2026-05-02', historial_etapas: [{ etapa: 'prospeccion', fecha: '2026-05-02' }, { etapa: 'contacto', fecha: '2026-05-04' }, { etapa: 'propuesta', fecha: '2026-05-06' }, { etapa: 'negociacion', fecha: '2026-05-08' }] },
    { id: 3, nombre: 'Licencias Office',   pipeline: 'Ventas',    etapa: 'prospeccion', valor: 12000, cliente: 'StartupXYZ',      fecha_creacion: '2026-05-05', historial_etapas: [{ etapa: 'prospeccion', fecha: '2026-05-05' }] },
    { id: 4, nombre: 'Soporte Técnico',    pipeline: 'Servicios', etapa: 'cierre',      valor: 8000,  cliente: 'Consultora Delta', fecha_creacion: '2026-04-20', historial_etapas: [{ etapa: 'prospeccion', fecha: '2026-04-20' }, { etapa: 'contacto', fecha: '2026-04-22' }, { etapa: 'propuesta', fecha: '2026-04-25' }, { etapa: 'negociacion', fecha: '2026-05-01' }, { etapa: 'cierre', fecha: '2026-05-10' }] },
  ]);
  oportunidades$ = this._oportunidades.asObservable();
  get oportunidades() { return this._oportunidades.getValue(); }

  addOportunidad(op: Omit<Oportunidad, 'id' | 'fecha_creacion' | 'historial_etapas'>) {
    this._oportunidades.next([...this.oportunidades, { ...op, id: generateId(), fecha_creacion: today(), historial_etapas: [{ etapa: op.etapa, fecha: today() }] }]);
  }
  updateOportunidad(id: number, op: Partial<Oportunidad>) {
    this._oportunidades.next(this.oportunidades.map(o => o.id === id ? { ...o, ...op } : o));
  }
  deleteOportunidad(id: number) {
    this._oportunidades.next(this.oportunidades.filter(o => o.id !== id));
  }
  moverEtapa(id: number, nuevaEtapa: Oportunidad['etapa']) {
    this._oportunidades.next(this.oportunidades.map(o => {
      if (o.id !== id) return o;
      return { ...o, etapa: nuevaEtapa, historial_etapas: [...o.historial_etapas, { etapa: nuevaEtapa, fecha: today() }] };
    }));
  }

  // ── Clientes ───────────────────────────────────────────────────────────────
  private _clientes = new BehaviorSubject<Cliente[]>([
    { id: 1, nombre: 'Empresa ABC',     telefono: '555-1001', email: 'contacto@abc.com',   direccion: 'Av. Principal 123',    sector_empresarial: 'Tecnología',  fecha_registro: '2026-01-15', tipo: 'empresa' },
    { id: 2, nombre: 'TechCorp',        telefono: '555-1002', email: 'info@techcorp.com',  direccion: 'Calle Innovación 456', sector_empresarial: 'Software',    fecha_registro: '2026-02-20', tipo: 'empresa' },
    { id: 3, nombre: 'María González',  telefono: '555-1003', email: 'maria.g@email.com',  direccion: 'Calle Flores 789',     sector_empresarial: 'Freelance',   fecha_registro: '2026-03-10', tipo: 'persona' },
    { id: 4, nombre: 'StartupXYZ',      telefono: '555-1004', email: 'hello@startupxyz.io',direccion: 'Centro Empresarial 5', sector_empresarial: 'Fintech',     fecha_registro: '2026-04-01', tipo: 'empresa' },
    { id: 5, nombre: 'Consultora Delta',telefono: '555-1005', email: 'admin@delta.com',    direccion: 'Torre Ejecutiva 10',   sector_empresarial: 'Consultoría', fecha_registro: '2026-04-15', tipo: 'empresa' },
  ]);
  clientes$ = this._clientes.asObservable();
  get clientes() { return this._clientes.getValue(); }

  addCliente(cliente: Omit<Cliente, 'id' | 'fecha_registro'>) {
    this._clientes.next([...this.clientes, { ...cliente, id: generateId(), fecha_registro: today() }]);
  }
  updateCliente(id: number, cliente: Partial<Cliente>) {
    this._clientes.next(this.clientes.map(c => c.id === id ? { ...c, ...cliente } : c));
  }
  deleteCliente(id: number) {
    this._clientes.next(this.clientes.filter(c => c.id !== id));
  }

  // ── Actividades ────────────────────────────────────────────────────────────
  private _actividades = new BehaviorSubject<Actividad[]>([
    { id_pk: 1, actividad: 'Llamada de seguimiento', tipo_actividad: 'llamada',    recordatorio: '2026-05-20T10:00', fecha: '2026-05-18', completada: false, entidad_tipo: 'lead',        entidad_id: 1 },
    { id_pk: 2, actividad: 'Enviar propuesta',        tipo_actividad: 'correo',     recordatorio: '2026-05-19T14:00', fecha: '2026-05-18', completada: false, entidad_tipo: 'oportunidad', entidad_id: 1 },
    { id_pk: 3, actividad: 'Reunión de cierre',       tipo_actividad: 'reunion',    recordatorio: '2026-05-21T11:00', fecha: '2026-05-18', completada: false, entidad_tipo: 'cliente',     entidad_id: 2 },
    { id_pk: 4, actividad: 'Actualizar CRM',          tipo_actividad: 'tarea',      recordatorio: '2026-05-18T17:00', fecha: '2026-05-18', completada: true,  entidad_tipo: 'lead',        entidad_id: 3 },
    { id_pk: 5, actividad: 'Nota: Interesado en upgrade', tipo_actividad: 'nota',   recordatorio: '2026-05-22T09:00', fecha: '2026-05-18', completada: false, entidad_tipo: 'cliente',     entidad_id: 4 },
  ]);
  actividades$ = this._actividades.asObservable();
  get actividades() { return this._actividades.getValue(); }

  addActividad(act: Omit<Actividad, 'id_pk'>) {
    this._actividades.next([...this.actividades, { ...act, id_pk: generateId() }]);
  }
  updateActividad(id: number, act: Partial<Actividad>) {
    this._actividades.next(this.actividades.map(a => a.id_pk === id ? { ...a, ...act } : a));
  }
  deleteActividad(id: number) {
    this._actividades.next(this.actividades.filter(a => a.id_pk !== id));
  }
  toggleActividad(id: number) {
    this._actividades.next(this.actividades.map(a => a.id_pk === id ? { ...a, completada: !a.completada } : a));
  }

  // ── Marketing ──────────────────────────────────────────────────────────────
  private _campanas = new BehaviorSubject<MarketingCampana[]>([
    { id: 1, nombre_compania: 'Campaña Verano 2026',   segmento: 'Empresas Tecnología', lista_contactos: [{ id: 1, nombre: 'Contacto A', email: 'a@empresa.com' }, { id: 2, nombre: 'Contacto B', email: 'b@empresa.com' }], n_contacto: 2, estado: 'activa',  fecha_inicio: '2026-05-01' },
    { id: 2, nombre_compania: 'Lanzamiento Producto X', segmento: 'Startups',            lista_contactos: [{ id: 3, nombre: 'Contacto C', email: 'c@startup.com' }, { id: 4, nombre: 'Contacto D', email: 'd@startup.com' }, { id: 5, nombre: 'Contacto E', email: 'e@startup.com' }], n_contacto: 3, estado: 'activa',  fecha_inicio: '2026-05-10' },
    { id: 3, nombre_compania: 'Webinar Mensual',        segmento: 'General',             lista_contactos: [{ id: 6, nombre: 'Contacto F', email: 'f@email.com' }], n_contacto: 1, estado: 'pausada', fecha_inicio: '2026-04-15' },
  ]);
  campanas$ = this._campanas.asObservable();
  get campanas() { return this._campanas.getValue(); }

  addCampana(camp: Omit<MarketingCampana, 'id' | 'n_contacto'>) {
    this._campanas.next([...this.campanas, { ...camp, id: generateId(), n_contacto: camp.lista_contactos.length }]);
  }
  updateCampana(id: number, camp: Partial<MarketingCampana>) {
    this._campanas.next(this.campanas.map(c => c.id === id ? { ...c, ...camp, n_contacto: camp.lista_contactos ? camp.lista_contactos.length : c.n_contacto } : c));
  }
  deleteCampana(id: number) {
    this._campanas.next(this.campanas.filter(c => c.id !== id));
  }

  // ── Automatizaciones ───────────────────────────────────────────────────────
  private _automatizaciones = new BehaviorSubject<Automatizacion[]>([
    { id: 1, nombre_automatizacion: 'Bienvenida Nuevo Lead',  regla: 'Cuando se crea un nuevo lead',        evento: 'lead_creado',       accion: 'Enviar email de bienvenida',    activa: true,  fecha_creacion: '2026-04-01' },
    { id: 2, nombre_automatizacion: 'Seguimiento 3 días',     regla: 'Si no hay actividad en 3 días',       evento: 'inactividad',       accion: 'Crear tarea de seguimiento',    activa: true,  fecha_creacion: '2026-04-05' },
    { id: 3, nombre_automatizacion: 'Notificación Cierre',    regla: 'Cuando una oportunidad se gana',      evento: 'oportunidad_ganada',accion: 'Notificar al equipo',           activa: false, fecha_creacion: '2026-04-10' },
    { id: 4, nombre_automatizacion: 'Recordatorio Cumpleaños',regla: 'Día del cumpleaños del cliente',      evento: 'fecha_especial',    accion: 'Enviar mensaje personalizado',  activa: true,  fecha_creacion: '2026-05-01' },
  ]);
  automatizaciones$ = this._automatizaciones.asObservable();
  get automatizaciones() { return this._automatizaciones.getValue(); }

  addAutomatizacion(auto: Omit<Automatizacion, 'id' | 'fecha_creacion'>) {
    this._automatizaciones.next([...this.automatizaciones, { ...auto, id: generateId(), fecha_creacion: today() }]);
  }
  updateAutomatizacion(id: number, auto: Partial<Automatizacion>) {
    this._automatizaciones.next(this.automatizaciones.map(a => a.id === id ? { ...a, ...auto } : a));
  }
  deleteAutomatizacion(id: number) {
    this._automatizaciones.next(this.automatizaciones.filter(a => a.id !== id));
  }
  toggleAutomatizacion(id: number) {
    this._automatizaciones.next(this.automatizaciones.map(a => a.id === id ? { ...a, activa: !a.activa } : a));
  }

  // ── Integraciones ──────────────────────────────────────────────────────────
  private _integraciones = new BehaviorSubject<Integracion[]>([
    { id: 1, nombre: 'WhatsApp Business', tipo: 'whatsapp',      estado: 'conectada',    configuracion: { telefono: '+52-555-0199', cuenta: '', carpeta: '' } },
    { id: 2, nombre: 'Gmail',             tipo: 'email',         estado: 'conectada',    configuracion: { cuenta: 'crm@empresa.com', telefono: '', carpeta: '' } },
    { id: 3, nombre: 'Google Calendar',   tipo: 'calendario',    estado: 'desconectada' },
    { id: 4, nombre: 'Google Drive',      tipo: 'almacenamiento',estado: 'conectada',    configuracion: { carpeta: '/CRM Docs', telefono: '', cuenta: '' } },
    { id: 5, nombre: 'Slack',             tipo: 'otro',          estado: 'desconectada' },
  ]);
  integraciones$ = this._integraciones.asObservable();
  get integraciones() { return this._integraciones.getValue(); }

  toggleIntegracion(id: number) {
    const estados: Array<'conectada' | 'desconectada' | 'error'> = ['conectada', 'desconectada', 'error'];
    this._integraciones.next(this.integraciones.map(i => {
      if (i.id !== id) return i;
      const idx = estados.indexOf(i.estado);
      return { ...i, estado: estados[(idx + 1) % estados.length] };
    }));
  }
}
