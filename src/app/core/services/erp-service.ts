// src/app/core/services/erp-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ErpInventario, ErpOrdenCompra, ErpMovimiento, ErpPedido, ErpEmpleado,
  ErpOrdenProduccion, ErpEnvio, ErpProyecto, ErpInteraccion, ErpCrmResumen,
  ErpDashboardResumen
} from '../../models/erp.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ErpService {

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════════════════
  // INVENTARIO
  // ════════════════════════════════════════════════════════════════════
  private _inventario = new BehaviorSubject<ErpInventario[]>([]);
  inventario$ = this._inventario.asObservable();
  get inventario() { return this._inventario.getValue(); }

  cargarInventario(): Observable<ErpInventario[]> {
    return this.http.get<ErpInventario[]>(`${API}/erp/inventario`).pipe(
      tap(data => this._inventario.next(data))
    );
  }

  addInventario(item: Partial<ErpInventario>): Observable<ErpInventario> {
    return this.http.post<ErpInventario>(`${API}/erp/inventario`, item).pipe(
      tap(nuevo => this._inventario.next([nuevo, ...this.inventario]))
    );
  }

  deleteInventario(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/inventario/${id}`).pipe(
      tap(() => this._inventario.next(this.inventario.filter(i => i.id !== id)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // COMPRAS (órdenes de compra)
  // ════════════════════════════════════════════════════════════════════
  private _ordenesCompra = new BehaviorSubject<ErpOrdenCompra[]>([]);
  ordenesCompra$ = this._ordenesCompra.asObservable();
  get ordenesCompra() { return this._ordenesCompra.getValue(); }

  cargarOrdenesCompra(): Observable<ErpOrdenCompra[]> {
    return this.http.get<ErpOrdenCompra[]>(`${API}/erp/compras`).pipe(
      tap(data => this._ordenesCompra.next(data))
    );
  }

  addOrdenCompra(orden: Partial<ErpOrdenCompra>): Observable<ErpOrdenCompra> {
    return this.http.post<ErpOrdenCompra>(`${API}/erp/compras`, orden).pipe(
      tap(nueva => this._ordenesCompra.next([nueva, ...this.ordenesCompra]))
    );
  }

  recibirOrdenCompra(id: number): Observable<ErpOrdenCompra> {
    return this.http.patch<ErpOrdenCompra>(`${API}/erp/compras/${id}/recibir`, {}).pipe(
      tap(actualizada => this._ordenesCompra.next(this.ordenesCompra.map(o => o.id === id ? actualizada : o)))
    );
  }

  cancelarOrdenCompra(id: number): Observable<ErpOrdenCompra> {
    return this.http.patch<ErpOrdenCompra>(`${API}/erp/compras/${id}/cancelar`, {}).pipe(
      tap(actualizada => this._ordenesCompra.next(this.ordenesCompra.map(o => o.id === id ? actualizada : o)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // FINANZAS (movimientos)
  // ════════════════════════════════════════════════════════════════════
  private _movimientos = new BehaviorSubject<ErpMovimiento[]>([]);
  movimientos$ = this._movimientos.asObservable();
  get movimientos() { return this._movimientos.getValue(); }

  cargarMovimientos(): Observable<ErpMovimiento[]> {
    return this.http.get<ErpMovimiento[]>(`${API}/erp/finanzas`).pipe(
      tap(data => this._movimientos.next(data))
    );
  }

  addMovimiento(mov: Partial<ErpMovimiento>): Observable<ErpMovimiento> {
    return this.http.post<ErpMovimiento>(`${API}/erp/finanzas`, mov).pipe(
      tap(nuevo => this._movimientos.next([nuevo, ...this.movimientos]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // VENTAS (pedidos)
  // ════════════════════════════════════════════════════════════════════
  private _pedidos = new BehaviorSubject<ErpPedido[]>([]);
  pedidos$ = this._pedidos.asObservable();
  get pedidos() { return this._pedidos.getValue(); }

  cargarPedidos(): Observable<ErpPedido[]> {
    return this.http.get<ErpPedido[]>(`${API}/erp/ventas`).pipe(
      tap(data => this._pedidos.next(data))
    );
  }

  addPedido(pedido: Partial<ErpPedido>): Observable<ErpPedido> {
    return this.http.post<ErpPedido>(`${API}/erp/ventas`, pedido).pipe(
      tap(nuevo => this._pedidos.next([nuevo, ...this.pedidos]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // RRHH (empleados)
  // ════════════════════════════════════════════════════════════════════
  private _empleados = new BehaviorSubject<ErpEmpleado[]>([]);
  empleados$ = this._empleados.asObservable();
  get empleados() { return this._empleados.getValue(); }

  cargarEmpleados(): Observable<ErpEmpleado[]> {
    return this.http.get<ErpEmpleado[]>(`${API}/erp/rrhh`).pipe(
      tap(data => this._empleados.next(data))
    );
  }

  addEmpleado(empleado: Partial<ErpEmpleado>): Observable<ErpEmpleado> {
    return this.http.post<ErpEmpleado>(`${API}/erp/rrhh`, empleado).pipe(
      tap(nuevo => this._empleados.next([nuevo, ...this.empleados]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // FABRICACIÓN (órdenes de producción)
  // ════════════════════════════════════════════════════════════════════
  private _ordenesProduccion = new BehaviorSubject<ErpOrdenProduccion[]>([]);
  ordenesProduccion$ = this._ordenesProduccion.asObservable();
  get ordenesProduccion() { return this._ordenesProduccion.getValue(); }

  cargarOrdenesProduccion(): Observable<ErpOrdenProduccion[]> {
    return this.http.get<ErpOrdenProduccion[]>(`${API}/erp/fabricacion`).pipe(
      tap(data => this._ordenesProduccion.next(data))
    );
  }

  addOrdenProduccion(orden: Partial<ErpOrdenProduccion>): Observable<ErpOrdenProduccion> {
    return this.http.post<ErpOrdenProduccion>(`${API}/erp/fabricacion`, orden).pipe(
      tap(nueva => this._ordenesProduccion.next([nueva, ...this.ordenesProduccion]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCM (envíos)
  // ════════════════════════════════════════════════════════════════════
  private _envios = new BehaviorSubject<ErpEnvio[]>([]);
  envios$ = this._envios.asObservable();
  get envios() { return this._envios.getValue(); }

  cargarEnvios(): Observable<ErpEnvio[]> {
    return this.http.get<ErpEnvio[]>(`${API}/erp/scm`).pipe(
      tap(data => this._envios.next(data))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // PROYECTOS
  // ════════════════════════════════════════════════════════════════════
  private _proyectos = new BehaviorSubject<ErpProyecto[]>([]);
  proyectos$ = this._proyectos.asObservable();
  get proyectos() { return this._proyectos.getValue(); }

  cargarProyectos(): Observable<ErpProyecto[]> {
    return this.http.get<ErpProyecto[]>(`${API}/erp/proyectos`).pipe(
      tap(data => this._proyectos.next(data))
    );
  }

  addProyecto(proyecto: Partial<ErpProyecto>): Observable<ErpProyecto> {
    return this.http.post<ErpProyecto>(`${API}/erp/proyectos`, proyecto).pipe(
      tap(nuevo => this._proyectos.next([nuevo, ...this.proyectos]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // CRM (resumen ERP)
  // ════════════════════════════════════════════════════════════════════
  cargarCrmResumen(): Observable<ErpCrmResumen> {
    return this.http.get<ErpCrmResumen>(`${API}/erp/crm/resumen`);
  }

  cargarCrmInteracciones(): Observable<ErpInteraccion[]> {
    return this.http.get<ErpInteraccion[]>(`${API}/erp/crm/interacciones`);
  }

  // ════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ════════════════════════════════════════════════════════════════════
  cargarDashboardResumen(): Observable<ErpDashboardResumen> {
    return this.http.get<ErpDashboardResumen>(`${API}/erp/dashboard/resumen`);
  }
}
