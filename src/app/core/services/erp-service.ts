// src/app/core/services/erp-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Producto, Categoria, Proveedor, ErpOrdenCompra, ErpMovimiento, ErpPedido, ErpEmpleado,
  ErpOrdenProduccion, ErpEnvio, ErpProyecto, ErpProyectoTarea, ErpProyectoHora, ErpInteraccion, ErpCrmResumen,
  ErpDashboardResumen, ErpReportesResumen, ErpMovimientoStock
} from '../../models/erp.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ErpService {

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════════════════
  // INVENTARIO (catálogo unificado de productos)
  // ════════════════════════════════════════════════════════════════════
  private _inventario = new BehaviorSubject<Producto[]>([]);
  inventario$ = this._inventario.asObservable();
  get inventario() { return this._inventario.getValue(); }

  cargarInventario(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API}/erp/inventario`).pipe(
      tap(data => this._inventario.next(data))
    );
  }

  addInventario(item: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(`${API}/erp/inventario`, item).pipe(
      tap(nuevo => this._inventario.next([nuevo, ...this.inventario]))
    );
  }

  updateInventario(id: number, item: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${API}/erp/inventario/${id}`, item).pipe(
      tap(actualizado => this._inventario.next(this.inventario.map(i => i.id_productos === id ? actualizado : i)))
    );
  }

  deleteInventario(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/inventario/${id}`).pipe(
      tap(() => this._inventario.next(this.inventario.filter(i => i.id_productos !== id)))
    );
  }

  ajustarStockInventario(id: number, cantidad: number, motivo: string): Observable<Producto> {
    return this.http.post<Producto>(`${API}/erp/inventario/${id}/ajuste`, { cantidad, motivo }).pipe(
      tap(actualizado => this._inventario.next(this.inventario.map(i => i.id_productos === id ? actualizado : i)))
    );
  }

  cargarMovimientosStock(id: number): Observable<ErpMovimientoStock[]> {
    return this.http.get<ErpMovimientoStock[]>(`${API}/erp/inventario/${id}/movimientos`);
  }

  cargarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API}/categorias`);
  }

  cargarProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API}/productos`);
  }

  cargarPapeleraInventario(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API}/erp/inventario/papelera`);
  }

  restaurarInventario(id: number): Observable<Producto> {
    return this.http.patch<Producto>(`${API}/erp/inventario/${id}/restaurar`, {}).pipe(
      tap(item => this._inventario.next([item, ...this.inventario]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // PROVEEDORES
  // ════════════════════════════════════════════════════════════════════
  private _proveedores = new BehaviorSubject<Proveedor[]>([]);
  proveedores$ = this._proveedores.asObservable();
  get proveedores() { return this._proveedores.getValue(); }

  cargarProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${API}/erp/proveedores`).pipe(
      tap(data => this._proveedores.next(data))
    );
  }

  addProveedor(proveedor: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${API}/erp/proveedores`, proveedor).pipe(
      tap(nuevo => this._proveedores.next([nuevo, ...this.proveedores]))
    );
  }

  updateProveedor(id: number, proveedor: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${API}/erp/proveedores/${id}`, proveedor).pipe(
      tap(actualizado => this._proveedores.next(this.proveedores.map(p => p.id_proveedor === id ? actualizado : p)))
    );
  }

  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/proveedores/${id}`).pipe(
      tap(() => this._proveedores.next(this.proveedores.filter(p => p.id_proveedor !== id)))
    );
  }

  cargarPapeleraProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${API}/erp/proveedores/papelera`);
  }

  restaurarProveedor(id: number): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${API}/erp/proveedores/${id}/restaurar`, {}).pipe(
      tap(item => this._proveedores.next([item, ...this.proveedores]))
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

  deleteMovimiento(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/finanzas/${id}`).pipe(
      tap(() => this._movimientos.next(this.movimientos.filter(m => m.id !== id)))
    );
  }

  cargarPapeleraMovimientos(): Observable<ErpMovimiento[]> {
    return this.http.get<ErpMovimiento[]>(`${API}/erp/finanzas/papelera`);
  }

  restaurarMovimiento(id: number): Observable<ErpMovimiento> {
    return this.http.patch<ErpMovimiento>(`${API}/erp/finanzas/${id}/restaurar`, {}).pipe(
      tap(item => this._movimientos.next([item, ...this.movimientos]))
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

  cancelarPedido(id: number): Observable<ErpPedido> {
    return this.http.patch<ErpPedido>(`${API}/erp/ventas/${id}/cancelar`, {}).pipe(
      tap(actualizado => this._pedidos.next(this.pedidos.map(p => p.id === id ? actualizado : p)))
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

  addEnvio(envio: Partial<ErpEnvio>): Observable<ErpEnvio> {
    return this.http.post<ErpEnvio>(`${API}/erp/scm`, envio).pipe(
      tap(nuevo => this._envios.next([nuevo, ...this.envios]))
    );
  }

  updateEnvio(id: number, envio: Partial<ErpEnvio>): Observable<ErpEnvio> {
    return this.http.put<ErpEnvio>(`${API}/erp/scm/${id}`, envio).pipe(
      tap(actualizado => this._envios.next(this.envios.map(e => e.id === id ? actualizado : e)))
    );
  }

  deleteEnvio(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/scm/${id}`).pipe(
      tap(() => this._envios.next(this.envios.filter(e => e.id !== id)))
    );
  }

  cargarPapeleraEnvios(): Observable<ErpEnvio[]> {
    return this.http.get<ErpEnvio[]>(`${API}/erp/scm/papelera`);
  }

  restaurarEnvio(id: number): Observable<ErpEnvio> {
    return this.http.patch<ErpEnvio>(`${API}/erp/scm/${id}/restaurar`, {}).pipe(
      tap(item => this._envios.next([item, ...this.envios]))
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

  // Tareas (tablero kanban) de un proyecto
  cargarTareasProyecto(idProyecto: number): Observable<ErpProyectoTarea[]> {
    return this.http.get<ErpProyectoTarea[]>(`${API}/erp/proyectos/${idProyecto}/tareas`);
  }

  addTareaProyecto(idProyecto: number, tarea: Partial<ErpProyectoTarea>): Observable<ErpProyectoTarea> {
    return this.http.post<ErpProyectoTarea>(`${API}/erp/proyectos/${idProyecto}/tareas`, tarea);
  }

  moverTareaProyecto(idProyecto: number, idTarea: number, estado: ErpProyectoTarea['estado']): Observable<ErpProyectoTarea> {
    return this.http.put<ErpProyectoTarea>(`${API}/erp/proyectos/${idProyecto}/tareas/${idTarea}`, { estado });
  }

  actualizarTareaProyecto(idProyecto: number, idTarea: number, data: Partial<ErpProyectoTarea>): Observable<ErpProyectoTarea> {
    return this.http.put<ErpProyectoTarea>(`${API}/erp/proyectos/${idProyecto}/tareas/${idTarea}`, data);
  }

  eliminarTareaProyecto(idProyecto: number, idTarea: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/proyectos/${idProyecto}/tareas/${idTarea}`);
  }

  // Registro de horas de un proyecto
  cargarHorasProyecto(idProyecto: number): Observable<ErpProyectoHora[]> {
    return this.http.get<ErpProyectoHora[]>(`${API}/erp/proyectos/${idProyecto}/horas`);
  }

  addHoraProyecto(idProyecto: number, registro: Partial<ErpProyectoHora>): Observable<ErpProyectoHora> {
    return this.http.post<ErpProyectoHora>(`${API}/erp/proyectos/${idProyecto}/horas`, registro);
  }

  eliminarHoraProyecto(idProyecto: number, idHora: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/proyectos/${idProyecto}/horas/${idHora}`);
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

  // ════════════════════════════════════════════════════════════════════
  // REPORTES
  // ════════════════════════════════════════════════════════════════════
  cargarReportesResumen(desde?: string, hasta?: string): Observable<ErpReportesResumen> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ErpReportesResumen>(`${API}/erp/reportes/resumen`, { params });
  }
}
