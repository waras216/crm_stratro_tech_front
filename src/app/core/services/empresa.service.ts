// src/app/core/services/empresa.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, EmpresaKpiNicho } from '../../models/crm.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class EmpresaService {

  constructor(private http: HttpClient) {}

  private _empresas = new BehaviorSubject<Empresa[]>([]);
  empresas$ = this._empresas.asObservable();
  get empresas() { return this._empresas.getValue(); }

  cargarEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${API}/empresas`).pipe(
      tap(empresas => this._empresas.next(empresas))
    );
  }

  cargarKpisPorNicho(): Observable<EmpresaKpiNicho[]> {
    return this.http.get<EmpresaKpiNicho[]>(`${API}/empresas/kpis/nicho`);
  }

  verEmpresa(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${API}/empresas/${id}`);
  }

  actualizarEmpresa(id: number, data: Partial<Pick<Empresa, 'estado' | 'id_plan'>>): Observable<Empresa> {
    return this.http.patch<Empresa>(`${API}/empresas/${id}`, data).pipe(
      tap(actualizada => this._empresas.next(this.empresas.map(e => e.id_tenant === id ? { ...e, ...actualizada } : e)))
    );
  }

  actualizarModulos(id: number, modulos: Partial<Empresa['modulos']>): Observable<Empresa> {
    const data: Record<string, boolean> = {};
    if (modulos.crm !== undefined) data['modulo_crm'] = modulos.crm;
    if (modulos.pos !== undefined) data['modulo_pos'] = modulos.pos;
    if (modulos.erp !== undefined) data['modulo_erp'] = modulos.erp;

    return this.http.patch<Empresa>(`${API}/empresas/${id}`, data).pipe(
      tap(actualizada => this._empresas.next(this.empresas.map(e => e.id_tenant === id ? { ...e, ...actualizada } : e)))
    );
  }

  eliminarEmpresa(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/empresas/${id}`).pipe(
      tap(() => this._empresas.next(this.empresas.filter(e => e.id_tenant !== id)))
    );
  }
}
