// src/app/core/services/crm-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Lead, Oportunidad, Cliente, Actividad, Pipeline, Contacto,
  MarketingCampana, Automatizacion, Integracion, Notificacion
} from '../../models/crm.models';

const API = environment.apiUrl;

export interface ApiPage<T> {
  data:         T[];
  total:        number;
  last_page:    number;
  current_page: number;
  per_page:     number;
}

function toPage<T>(res: any): ApiPage<T> {
  if (Array.isArray(res)) {
    return { data: res, total: res.length, last_page: 1, current_page: 1, per_page: res.length };
  }
  return res as ApiPage<T>;
}

@Injectable({ providedIn: 'root' })
export class CrmService {

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════════════════
  // LEADS
  // ════════════════════════════════════════════════════════════════════
  private _leads = new BehaviorSubject<Lead[]>([]);
  leads$ = this._leads.asObservable();
  get leads() { return this._leads.getValue(); }

  cargarLeads(page = 1, search = '', estado = '', perPage?: number): Observable<ApiPage<Lead>> {
    let params = new HttpParams().set('page', page);
    if (search) params = params.set('search', search);
    if (estado && estado !== 'todos') params = params.set('estado', estado);
    if (perPage) params = params.set('per_page', perPage);
    return this.http.get<any>(`${API}/leads`, { params }).pipe(
      map(res => toPage<Lead>(res)),
      tap(page => this._leads.next(page.data))
    );
  }

  addLead(lead: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(`${API}/leads`, lead).pipe(
      tap(nuevo => this._leads.next([...this.leads, nuevo]))
    );
  }

  updateLead(id: number, lead: Partial<Lead>): Observable<Lead> {
    return this.http.put<Lead>(`${API}/leads/${id}`, lead).pipe(
      tap(updated => this._leads.next(this.leads.map(l => l.id_lead === id ? updated : l)))
    );
  }

  deleteLead(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/leads/${id}`).pipe(
      tap(() => this._leads.next(this.leads.filter(l => l.id_lead !== id)))
    );
  }

  convertirLead(id: number, payload: {
    id_pipeline: number; etapa?: string; valor?: number;
    nombre?: string; email?: string; telefono?: string; empresa?: string; tipo?: string;
  }): Observable<{ lead: Lead; cliente: Cliente; oportunidad: Oportunidad }> {
    return this.http.post<{ lead: Lead; cliente: Cliente; oportunidad: Oportunidad }>(
      `${API}/leads/${id}/convertir`, payload
    ).pipe(
      tap(res => this._leads.next(this.leads.map(l => l.id_lead === id ? res.lead : l)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // CLIENTES
  // ════════════════════════════════════════════════════════════════════
  private _clientes = new BehaviorSubject<Cliente[]>([]);
  clientes$ = this._clientes.asObservable();
  get clientes() { return this._clientes.getValue(); }

  cargarClientes(page = 1, search = '', tipo = '', perPage?: number): Observable<ApiPage<Cliente>> {
    let params = new HttpParams().set('page', page);
    if (search) params = params.set('search', search);
    if (tipo && tipo !== 'todos') params = params.set('tipo', tipo);
    if (perPage) params = params.set('per_page', perPage);
    return this.http.get<any>(`${API}/clientes`, { params }).pipe(
      map(res => toPage<Cliente>(res)),
      tap(page => this._clientes.next(page.data))
    );
  }

  addCliente(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(`${API}/clientes`, cliente).pipe(
      tap(nuevo => this._clientes.next([...this.clientes, nuevo]))
    );
  }

  updateCliente(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${API}/clientes/${id}`, cliente).pipe(
      tap(updated => this._clientes.next(this.clientes.map(c => c.id_cliente === id ? updated : c)))
    );
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/clientes/${id}`).pipe(
      tap(() => this._clientes.next(this.clientes.filter(c => c.id_cliente !== id)))
    );
  }

  verCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${API}/clientes/${id}`);
  }

  private clienteMostradorId: number | null = null;
  private static readonly CLIENTE_MOSTRADOR = 'Público General';

  /** Cliente genérico para ventas de mostrador (POS) que no piden datos del cliente -- se crea una vez por tenant. */
  obtenerClienteMostrador(): Observable<number> {
    if (this.clienteMostradorId) return of(this.clienteMostradorId);

    return this.cargarClientes(1, CrmService.CLIENTE_MOSTRADOR, '', 5).pipe(
      switchMap(pagina => {
        const existente = pagina.data.find(c => c.nombre === CrmService.CLIENTE_MOSTRADOR);
        if (existente) {
          this.clienteMostradorId = existente.id_cliente;
          return of(existente.id_cliente);
        }
        return this.addCliente({ nombre: CrmService.CLIENTE_MOSTRADOR, tipo: 'persona' }).pipe(
          map(c => { this.clienteMostradorId = c.id_cliente; return c.id_cliente; }),
        );
      }),
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // CONTACTOS
  // ════════════════════════════════════════════════════════════════════
  addContacto(contacto: Partial<Contacto> & { id_cliente: number }): Observable<Contacto> {
    return this.http.post<Contacto>(`${API}/contactos`, contacto);
  }

  updateContacto(id: number, contacto: Partial<Contacto>): Observable<Contacto> {
    return this.http.put<Contacto>(`${API}/contactos/${id}`, contacto);
  }

  deleteContacto(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/contactos/${id}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // PIPELINES
  // ════════════════════════════════════════════════════════════════════
  cargarPipelines(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(`${API}/pipelines`);
  }

  addPipeline(pipeline: Partial<Pipeline>): Observable<Pipeline> {
    return this.http.post<Pipeline>(`${API}/pipelines`, pipeline);
  }

  updatePipeline(id: number, pipeline: Partial<Pipeline>): Observable<Pipeline> {
    return this.http.put<Pipeline>(`${API}/pipelines/${id}`, pipeline);
  }

  deletePipeline(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/pipelines/${id}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // OPORTUNIDADES
  // ════════════════════════════════════════════════════════════════════

  private _oportunidades = new BehaviorSubject<Oportunidad[]>([]);
  oportunidades$ = this._oportunidades.asObservable();
  get oportunidades() { return this._oportunidades.getValue(); }

  cargarOportunidades(): Observable<ApiPage<Oportunidad>> {
    return this.http.get<any>(`${API}/oportunidades`).pipe(
      map(res => toPage<Oportunidad>(res)),
      tap(page => this._oportunidades.next(page.data))
    );
  }

  addOportunidad(op: Partial<Oportunidad>): Observable<Oportunidad> {
    return this.http.post<Oportunidad>(`${API}/oportunidades`, op).pipe(
      tap(nuevo => this._oportunidades.next([...this.oportunidades, nuevo]))
    );
  }

  updateOportunidad(id: number, op: Partial<Oportunidad>): Observable<Oportunidad> {
    return this.http.put<Oportunidad>(`${API}/oportunidades/${id}`, op).pipe(
      tap(updated => this._oportunidades.next(this.oportunidades.map(o => o.id_oportunidad === id ? updated : o)))
    );
  }

  deleteOportunidad(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/oportunidades/${id}`).pipe(
      tap(() => this._oportunidades.next(this.oportunidades.filter(o => o.id_oportunidad !== id)))
    );
  }

  moverEtapa(id: number, nuevaEtapa: Oportunidad['etapa'], estado?: Oportunidad['estado']): Observable<Oportunidad> {
    const body: any = { etapa: nuevaEtapa };
    if (estado) body.estado = estado;
    return this.http.patch<Oportunidad>(`${API}/oportunidades/${id}/etapa`, body).pipe(
      tap(updated => this._oportunidades.next(this.oportunidades.map(o => o.id_oportunidad === id ? updated : o)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ════════════════════════════════════════════════════════════════════
  cargarNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${API}/notificaciones`);
  }

  marcarNotificacionLeida(id: number): Observable<Notificacion> {
    return this.http.patch<Notificacion>(`${API}/notificaciones/${id}/leer`, {});
  }

  marcarTodasNotificacionesLeidas(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API}/notificaciones/leer-todas`, {});
  }

  // ════════════════════════════════════════════════════════════════════
  // ACTIVIDADES
  // ════════════════════════════════════════════════════════════════════
  private _actividades = new BehaviorSubject<Actividad[]>([]);
  actividades$ = this._actividades.asObservable();
  get actividades() { return this._actividades.getValue(); }

  cargarActividades(page = 1): Observable<ApiPage<Actividad>> {
    const params = new HttpParams().set('page', page);
    return this.http.get<any>(`${API}/actividades`, { params }).pipe(
      map(res => toPage<Actividad>(res)),
      tap(page => this._actividades.next(page.data))
    );
  }

  addActividad(act: Partial<Actividad>): Observable<Actividad> {
    return this.http.post<Actividad>(`${API}/actividades`, act).pipe(
      tap(nuevo => this._actividades.next([...this.actividades, nuevo]))
    );
  }

  updateActividad(id: number, act: Partial<Actividad>): Observable<Actividad> {
    return this.http.put<Actividad>(`${API}/actividades/${id}`, act).pipe(
      tap(updated => this._actividades.next(this.actividades.map(a => a.id_actividad === id ? updated : a)))
    );
  }

  deleteActividad(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/actividades/${id}`).pipe(
      tap(() => this._actividades.next(this.actividades.filter(a => a.id_actividad !== id)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // MARKETING — CAMPAÑAS
  // ════════════════════════════════════════════════════════════════════
  private _campanas = new BehaviorSubject<MarketingCampana[]>([]);
  campanas$ = this._campanas.asObservable();
  get campanas() { return this._campanas.getValue(); }

  cargarCampanas(page = 1): Observable<ApiPage<MarketingCampana>> {
    const params = new HttpParams().set('page', page);
    return this.http.get<any>(`${API}/marketing/campanas`, { params }).pipe(
      map(res => toPage<MarketingCampana>(res)),
      tap(page => this._campanas.next(page.data))
    );
  }

  addCampana(camp: any): Observable<MarketingCampana> {
    return this.http.post<MarketingCampana>(`${API}/marketing/campanas`, camp).pipe(
      tap(nuevo => this._campanas.next([...this.campanas, nuevo]))
    );
  }

  updateCampana(id: number, camp: any): Observable<MarketingCampana> {
    return this.http.put<MarketingCampana>(`${API}/marketing/campanas/${id}`, camp).pipe(
      tap(updated => this._campanas.next(this.campanas.map(c => c.id === id ? updated : c)))
    );
  }

  deleteCampana(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/marketing/campanas/${id}`).pipe(
      tap(() => this._campanas.next(this.campanas.filter(c => c.id !== id)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // AUTOMATIZACIONES
  // ════════════════════════════════════════════════════════════════════
  private _automatizaciones = new BehaviorSubject<Automatizacion[]>([]);
  automatizaciones$ = this._automatizaciones.asObservable();
  get automatizaciones() { return this._automatizaciones.getValue(); }

  cargarAutomatizaciones(): Observable<ApiPage<Automatizacion>> {
    return this.http.get<any>(`${API}/automatizaciones`).pipe(
      map(res => toPage<Automatizacion>(res)),
      tap(page => this._automatizaciones.next(page.data))
    );
  }

  addAutomatizacion(auto: Partial<Automatizacion>): Observable<Automatizacion> {
    return this.http.post<Automatizacion>(`${API}/automatizaciones`, auto).pipe(
      tap(nuevo => this._automatizaciones.next([...this.automatizaciones, nuevo]))
    );
  }

  updateAutomatizacion(id: number, auto: Partial<Automatizacion>): Observable<Automatizacion> {
    return this.http.put<Automatizacion>(`${API}/automatizaciones/${id}`, auto).pipe(
      tap(updated => this._automatizaciones.next(this.automatizaciones.map(a => a.id === id ? updated : a)))
    );
  }

  deleteAutomatizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/automatizaciones/${id}`).pipe(
      tap(() => this._automatizaciones.next(this.automatizaciones.filter(a => a.id !== id)))
    );
  }

  toggleAutomatizacion(id: number): Observable<Automatizacion> {
    return this.http.patch<Automatizacion>(`${API}/automatizaciones/${id}/toggle`, {}).pipe(
      tap(updated => this._automatizaciones.next(this.automatizaciones.map(a => a.id === id ? updated : a)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // INTEGRACIONES
  // ════════════════════════════════════════════════════════════════════
  private _integraciones = new BehaviorSubject<Integracion[]>([]);
  integraciones$ = this._integraciones.asObservable();
  get integraciones() { return this._integraciones.getValue(); }

  cargarIntegraciones(): Observable<ApiPage<Integracion>> {
    return this.http.get<any>(`${API}/integraciones`).pipe(
      map(res => toPage<Integracion>(res)),
      tap(page => this._integraciones.next(page.data))
    );
  }

  toggleIntegracion(id: number): Observable<Integracion> {
    return this.http.patch<Integracion>(`${API}/integraciones/${id}/toggle`, {}).pipe(
      tap(updated => this._integraciones.next(this.integraciones.map(i => i.id === id ? updated : i)))
    );
  }
    
}
