// src/app/core/services/contabilidad-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ErpCuentaContable, ErpAsiento, ErpBalanceComprobacion, ErpEstadoResultados,
  ErpBalanceGeneral, ErpNominaPago,
} from '../../models/contabilidad.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ContabilidadService {

  constructor(private http: HttpClient) {}

  // ════════════════════════════════════════════════════════════════════
  // PLAN DE CUENTAS
  // ════════════════════════════════════════════════════════════════════
  private _cuentas = new BehaviorSubject<ErpCuentaContable[]>([]);
  cuentas$ = this._cuentas.asObservable();
  get cuentas() { return this._cuentas.getValue(); }

  cargarCuentas(): Observable<ErpCuentaContable[]> {
    return this.http.get<ErpCuentaContable[]>(`${API}/erp/contabilidad/cuentas`).pipe(
      tap(data => this._cuentas.next(data))
    );
  }

  get cuentasMovibles(): ErpCuentaContable[] {
    return this.cuentas.filter(c => c.es_movible);
  }

  addCuenta(cuenta: Partial<ErpCuentaContable>): Observable<ErpCuentaContable> {
    return this.http.post<ErpCuentaContable>(`${API}/erp/contabilidad/cuentas`, cuenta).pipe(
      tap(nueva => this._cuentas.next([...this.cuentas, nueva].sort((a, b) => a.codigo.localeCompare(b.codigo))))
    );
  }

  updateCuenta(id: number, cuenta: Partial<ErpCuentaContable>): Observable<ErpCuentaContable> {
    return this.http.put<ErpCuentaContable>(`${API}/erp/contabilidad/cuentas/${id}`, cuenta).pipe(
      tap(actualizada => this._cuentas.next(this.cuentas.map(c => c.id === id ? actualizada : c)))
    );
  }

  deleteCuenta(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/erp/contabilidad/cuentas/${id}`).pipe(
      tap(() => this._cuentas.next(this.cuentas.filter(c => c.id !== id)))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // ASIENTOS
  // ════════════════════════════════════════════════════════════════════
  private _asientos = new BehaviorSubject<ErpAsiento[]>([]);
  asientos$ = this._asientos.asObservable();
  get asientos() { return this._asientos.getValue(); }

  cargarAsientos(filtros?: { desde?: string; hasta?: string; origen?: string }): Observable<ErpAsiento[]> {
    let params = new HttpParams();
    if (filtros?.desde) params = params.set('desde', filtros.desde);
    if (filtros?.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros?.origen) params = params.set('origen', filtros.origen);

    return this.http.get<ErpAsiento[]>(`${API}/erp/contabilidad/asientos`, { params }).pipe(
      tap(data => this._asientos.next(data))
    );
  }

  crearAsiento(asiento: { fecha: string; concepto: string; lineas: Array<{ id_cuenta: number; debe?: number; haber?: number; descripcion?: string }> }): Observable<ErpAsiento> {
    return this.http.post<ErpAsiento>(`${API}/erp/contabilidad/asientos`, asiento).pipe(
      tap(nuevo => this._asientos.next([nuevo, ...this.asientos]))
    );
  }

  reversarAsiento(id: number): Observable<ErpAsiento> {
    return this.http.post<ErpAsiento>(`${API}/erp/contabilidad/asientos/${id}/reversar`, {}).pipe(
      tap(reversa => this._asientos.next([reversa, ...this.asientos]))
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // ESTADOS FINANCIEROS
  // ════════════════════════════════════════════════════════════════════
  cargarBalanceComprobacion(desde?: string, hasta?: string): Observable<ErpBalanceComprobacion> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ErpBalanceComprobacion>(`${API}/erp/contabilidad/balance-comprobacion`, { params });
  }

  cargarEstadoResultados(desde?: string, hasta?: string): Observable<ErpEstadoResultados> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<ErpEstadoResultados>(`${API}/erp/contabilidad/estado-resultados`, { params });
  }

  cargarBalanceGeneral(corte?: string): Observable<ErpBalanceGeneral> {
    let params = new HttpParams();
    if (corte) params = params.set('corte', corte);
    return this.http.get<ErpBalanceGeneral>(`${API}/erp/contabilidad/balance-general`, { params });
  }

  // ════════════════════════════════════════════════════════════════════
  // NÓMINA
  // ════════════════════════════════════════════════════════════════════
  private _nomina = new BehaviorSubject<ErpNominaPago[]>([]);
  nomina$ = this._nomina.asObservable();
  get nomina() { return this._nomina.getValue(); }

  cargarHistorialNomina(): Observable<ErpNominaPago[]> {
    return this.http.get<ErpNominaPago[]>(`${API}/erp/rrhh/nomina`).pipe(
      tap(data => this._nomina.next(data))
    );
  }

  procesarNomina(datos: { fecha?: string; empleados?: number[] }): Observable<ErpNominaPago> {
    return this.http.post<ErpNominaPago>(`${API}/erp/rrhh/nomina/procesar`, datos).pipe(
      tap(pago => this._nomina.next([pago, ...this.nomina]))
    );
  }
}
