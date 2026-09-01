// src/app/core/services/erp-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Producto, Categoria, Proveedor, ErpOrdenCompra, ErpMovimiento, ErpPedido, ErpEmpleado,
  ErpOrdenProduccion, ErpEnvio, ErpProyecto, ErpProyectoTarea, ErpProyectoHora, ErpInteraccion, ErpCrmResumen,
  ErpDashboardResumen, ErpReportesResumen, ErpMovimientoStock, ErpMesa, ErpHabitacion, ErpEstadia, ErpReserva, ErpDisponibilidad, ErpReceta, PedidoPago, ErpFactura
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

  subirFotoProducto(id: number, file: File): Observable<Producto> {
    const form = new FormData();
    form.append('imagen', file);
    return this.http.post<Producto>(`${API}/erp/inventario/${id}/foto`, form).pipe(
      tap(actualizado => this._inventario.next(this.inventario.map(i => i.id_productos === id ? actualizado : i)))
    );
  }

  eliminarFotoProducto(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${API}/erp/inventario/${id}/foto`).pipe(
      tap(actualizado => this._inventario.next(this.inventario.map(i => i.id_productos === id ? actualizado : i)))
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

  addCategoria(data: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.post<Categoria>(`${API}/categorias`, data);
  }

  updateCategoria(id: number, data: { nombre?: string; descripcion?: string; activo?: boolean }): Observable<Categoria> {
    return this.http.put<Categoria>(`${API}/categorias/${id}`, data);
  }

  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/categorias/${id}`);
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
  // FACTURACIÓN (registro interno o timbrado real vía PAC)
  // ════════════════════════════════════════════════════════════════════
  private _facturas = new BehaviorSubject<ErpFactura[]>([]);
  facturas$ = this._facturas.asObservable();
  get facturas() { return this._facturas.getValue(); }

  cargarFacturas(): Observable<ErpFactura[]> {
    return this.http.get<ErpFactura[]>(`${API}/erp/facturas`).pipe(
      tap(data => this._facturas.next(data))
    );
  }

  crearFactura(data: {
    id_pedido: number; tipo: 'interna' | 'timbrada'; rfc_receptor: string; razon_social_receptor: string;
    uso_cfdi?: string; forma_pago_sat?: string; metodo_pago_sat?: string; serie?: string;
  }): Observable<ErpFactura> {
    return this.http.post<ErpFactura>(`${API}/erp/facturas`, data).pipe(
      tap(nueva => this._facturas.next([nueva, ...this.facturas]))
    );
  }

  timbrarFactura(id: number): Observable<ErpFactura> {
    return this.http.post<ErpFactura>(`${API}/erp/facturas/${id}/timbrar`, {}).pipe(
      tap(actualizada => this._facturas.next(this.facturas.map(f => f.id === id ? actualizada : f)))
    );
  }

  cancelarFactura(id: number): Observable<ErpFactura> {
    return this.http.patch<ErpFactura>(`${API}/erp/facturas/${id}/cancelar`, {}).pipe(
      tap(actualizada => this._facturas.next(this.facturas.map(f => f.id === id ? actualizada : f)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // MESAS (terminal POS de restaurante)
  // ════════════════════════════════════════════════════════════════════
  private _mesas = new BehaviorSubject<ErpMesa[]>([]);
  mesas$ = this._mesas.asObservable();
  get mesas() { return this._mesas.getValue(); }

  private actualizarMesaLocal(actualizada: ErpMesa) {
    this._mesas.next(this.mesas.map(m => m.id === actualizada.id ? actualizada : m));
  }

  cargarMesas(): Observable<ErpMesa[]> {
    return this.http.get<ErpMesa[]>(`${API}/erp/mesas`).pipe(
      tap(data => this._mesas.next(data))
    );
  }

  crearMesa(mesa: { numero: number; capacidad?: number }): Observable<ErpMesa> {
    return this.http.post<ErpMesa>(`${API}/erp/mesas`, mesa).pipe(
      tap(nueva => this._mesas.next([...this.mesas, nueva]))
    );
  }

  eliminarMesa(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/mesas/${id}`).pipe(
      tap(() => this._mesas.next(this.mesas.filter(m => m.id !== id)))
    );
  }

  abrirMesa(id: number, mesero?: string): Observable<ErpMesa> {
    return this.http.patch<ErpMesa>(`${API}/erp/mesas/${id}/abrir`, { mesero }).pipe(
      tap(actualizada => this.actualizarMesaLocal(actualizada))
    );
  }

  pedirCuenta(id: number): Observable<ErpMesa> {
    return this.http.patch<ErpMesa>(`${API}/erp/mesas/${id}/pedir-cuenta`, {}).pipe(
      tap(actualizada => this.actualizarMesaLocal(actualizada))
    );
  }

  agregarItemMesa(id: number, item: { id_producto: number; cantidad?: number }): Observable<ErpMesa> {
    return this.http.post<ErpMesa>(`${API}/erp/mesas/${id}/items`, item).pipe(
      tap(actualizada => this.actualizarMesaLocal(actualizada))
    );
  }

  actualizarItemMesa(id: number, itemId: number, cantidad: number): Observable<ErpMesa> {
    return this.http.patch<ErpMesa>(`${API}/erp/mesas/${id}/items/${itemId}`, { cantidad }).pipe(
      tap(actualizada => this.actualizarMesaLocal(actualizada))
    );
  }

  quitarItemMesa(id: number, itemId: number): Observable<ErpMesa> {
    return this.http.delete<ErpMesa>(`${API}/erp/mesas/${id}/items/${itemId}`).pipe(
      tap(actualizada => this.actualizarMesaLocal(actualizada))
    );
  }

  enviarCocina(id: number): Observable<ErpMesa> {
    return this.http.post<ErpMesa>(`${API}/erp/mesas/${id}/enviar-cocina`, {}).pipe(
      tap(actualizada => this.actualizarMesaLocal(actualizada))
    );
  }

  cobrarMesa(id: number, idCliente: number, pagos: PedidoPago[]): Observable<{ mesa: ErpMesa; pedido: ErpPedido }> {
    return this.http.post<{ mesa: ErpMesa; pedido: ErpPedido }>(`${API}/erp/mesas/${id}/cobrar`, { id_cliente: idCliente, pagos }).pipe(
      tap(res => {
        this.actualizarMesaLocal(res.mesa);
        this._pedidos.next([res.pedido, ...this.pedidos]);
      })
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // HABITACIONES (terminal POS de hotel)
  // ════════════════════════════════════════════════════════════════════
  private _habitaciones = new BehaviorSubject<ErpHabitacion[]>([]);
  habitaciones$ = this._habitaciones.asObservable();
  get habitaciones() { return this._habitaciones.getValue(); }

  private actualizarHabitacionLocal(actualizada: ErpHabitacion) {
    this._habitaciones.next(this.habitaciones.map(h => h.id === actualizada.id ? actualizada : h));
  }

  cargarHabitaciones(): Observable<ErpHabitacion[]> {
    return this.http.get<ErpHabitacion[]>(`${API}/erp/habitaciones`).pipe(
      tap(data => this._habitaciones.next(data))
    );
  }

  crearHabitacion(habitacion: { numero: number; tipo?: string; precio: number; piso?: number }): Observable<ErpHabitacion> {
    return this.http.post<ErpHabitacion>(`${API}/erp/habitaciones`, habitacion).pipe(
      tap(nueva => this._habitaciones.next([...this.habitaciones, nueva]))
    );
  }

  actualizarHabitacion(id: number, cambios: { numero?: number; tipo?: string; precio?: number; piso?: number }): Observable<ErpHabitacion> {
    return this.http.patch<ErpHabitacion>(`${API}/erp/habitaciones/${id}`, cambios).pipe(
      tap(actualizada => this.actualizarHabitacionLocal(actualizada))
    );
  }

  eliminarHabitacion(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/habitaciones/${id}`).pipe(
      tap(() => this._habitaciones.next(this.habitaciones.filter(h => h.id !== id)))
    );
  }

  cargarPapeleraHabitaciones(): Observable<ErpHabitacion[]> {
    return this.http.get<ErpHabitacion[]>(`${API}/erp/habitaciones/papelera`);
  }

  cargarHistorialEstadias(): Observable<ErpEstadia[]> {
    return this.http.get<ErpEstadia[]>(`${API}/erp/habitaciones/historial`);
  }

  cargarDisponibilidad(desde?: string, hasta?: string): Observable<ErpDisponibilidad> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ErpDisponibilidad>(`${API}/erp/habitaciones/disponibilidad`, { params });
  }

  restaurarHabitacion(id: number): Observable<ErpHabitacion> {
    return this.http.patch<ErpHabitacion>(`${API}/erp/habitaciones/${id}/restaurar`, {}).pipe(
      tap(item => this._habitaciones.next([...this.habitaciones, item]))
    );
  }

  checkInHabitacion(id: number, huesped: string, noches: number): Observable<ErpHabitacion> {
    return this.http.patch<ErpHabitacion>(`${API}/erp/habitaciones/${id}/check-in`, { huesped, noches }).pipe(
      tap(actualizada => this.actualizarHabitacionLocal(actualizada))
    );
  }

  agregarConsumoHabitacion(id: number, item: { id_producto: number; cantidad?: number }): Observable<ErpHabitacion> {
    return this.http.post<ErpHabitacion>(`${API}/erp/habitaciones/${id}/consumos`, item).pipe(
      tap(actualizada => this.actualizarHabitacionLocal(actualizada))
    );
  }

  quitarConsumoHabitacion(id: number, consumoId: number): Observable<ErpHabitacion> {
    return this.http.delete<ErpHabitacion>(`${API}/erp/habitaciones/${id}/consumos/${consumoId}`).pipe(
      tap(actualizada => this.actualizarHabitacionLocal(actualizada))
    );
  }

  marcarMantenimiento(id: number, estado: 'mantenimiento' | 'libre'): Observable<ErpHabitacion> {
    return this.http.patch<ErpHabitacion>(`${API}/erp/habitaciones/${id}/mantenimiento`, { estado }).pipe(
      tap(actualizada => this.actualizarHabitacionLocal(actualizada))
    );
  }

  marcarSalidaHabitacion(id: number, estado: 'checkout' | 'ocupada'): Observable<ErpHabitacion> {
    return this.http.patch<ErpHabitacion>(`${API}/erp/habitaciones/${id}/marcar-salida`, { estado }).pipe(
      tap(actualizada => this.actualizarHabitacionLocal(actualizada))
    );
  }

  checkOutHabitacion(id: number, idCliente?: number, pagos?: PedidoPago[]): Observable<{ habitacion: ErpHabitacion; pedido: ErpPedido | null }> {
    const body = idCliente ? { id_cliente: idCliente, pagos } : {};
    return this.http.post<{ habitacion: ErpHabitacion; pedido: ErpPedido | null }>(`${API}/erp/habitaciones/${id}/check-out`, body).pipe(
      tap(res => {
        this.actualizarHabitacionLocal(res.habitacion);
        if (res.pedido) this._pedidos.next([res.pedido, ...this.pedidos]);
      })
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // RESERVAS anticipadas de hotel (fecha futura, antes del check-in real)
  // ════════════════════════════════════════════════════════════════════
  private _reservas = new BehaviorSubject<ErpReserva[]>([]);
  reservas$ = this._reservas.asObservable();
  get reservas() { return this._reservas.getValue(); }

  cargarReservas(): Observable<ErpReserva[]> {
    return this.http.get<ErpReserva[]>(`${API}/erp/reservas`).pipe(
      tap(data => this._reservas.next(data))
    );
  }

  crearReserva(reserva: { id_habitacion: number; huesped: string; telefono?: string; fecha_checkin: string; noches: number; notas?: string }): Observable<ErpReserva> {
    return this.http.post<ErpReserva>(`${API}/erp/reservas`, reserva).pipe(
      tap(nueva => this._reservas.next([...this.reservas, nueva]))
    );
  }

  cancelarReserva(id: number): Observable<ErpReserva> {
    return this.http.patch<ErpReserva>(`${API}/erp/reservas/${id}/cancelar`, {}).pipe(
      tap(actualizada => this._reservas.next(this.reservas.map(r => r.id === id ? actualizada : r)))
    );
  }

  checkInReserva(id: number): Observable<{ habitacion: ErpHabitacion; reserva: ErpReserva }> {
    return this.http.post<{ habitacion: ErpHabitacion; reserva: ErpReserva }>(`${API}/erp/reservas/${id}/check-in`, {}).pipe(
      tap(res => {
        this.actualizarHabitacionLocal(res.habitacion);
        this._reservas.next(this.reservas.map(r => r.id === id ? res.reserva : r));
      })
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // RECETAS (terminal POS de farmacia)
  // ════════════════════════════════════════════════════════════════════
  private _recetas = new BehaviorSubject<ErpReceta[]>([]);
  recetas$ = this._recetas.asObservable();
  get recetas() { return this._recetas.getValue(); }

  cargarRecetas(idCliente?: number): Observable<ErpReceta[]> {
    let params = new HttpParams();
    if (idCliente) params = params.set('id_cliente', idCliente);
    return this.http.get<ErpReceta[]>(`${API}/erp/recetas`, { params }).pipe(
      tap(data => this._recetas.next(data))
    );
  }

  addReceta(receta: { id_cliente: number; id_producto: number; dosis?: string; cantidad: number }): Observable<ErpReceta> {
    return this.http.post<ErpReceta>(`${API}/erp/recetas`, receta).pipe(
      tap(nueva => this._recetas.next([nueva, ...this.recetas]))
    );
  }

  dispensarLote(ids: number[], idCliente: number, pagos: PedidoPago[]): Observable<ErpPedido> {
    return this.http.post<ErpPedido>(`${API}/erp/recetas/dispensar-lote`, { ids, id_cliente: idCliente, pagos }).pipe(
      tap(pedido => {
        this._recetas.next(this.recetas.map(r => ids.includes(r.id) ? { ...r, pendiente: false } : r));
        this._pedidos.next([pedido, ...this.pedidos]);
      })
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

  updateEmpleado(id: number, empleado: Partial<ErpEmpleado>): Observable<ErpEmpleado> {
    return this.http.put<ErpEmpleado>(`${API}/erp/rrhh/${id}`, empleado).pipe(
      tap(actualizado => this._empleados.next(this.empleados.map(e => e.id === id ? actualizado : e)))
    );
  }

  deleteEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/rrhh/${id}`).pipe(
      tap(() => this._empleados.next(this.empleados.filter(e => e.id !== id)))
    );
  }

  cargarPapeleraEmpleados(): Observable<ErpEmpleado[]> {
    return this.http.get<ErpEmpleado[]>(`${API}/erp/rrhh/papelera`);
  }

  restaurarEmpleado(id: number): Observable<ErpEmpleado> {
    return this.http.patch<ErpEmpleado>(`${API}/erp/rrhh/${id}/restaurar`, {}).pipe(
      tap(restaurado => this._empleados.next([restaurado, ...this.empleados]))
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
