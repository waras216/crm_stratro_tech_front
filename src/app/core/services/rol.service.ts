// src/app/core/services/rol.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol, PermisoCatalogo } from '../../models/crm.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class RolService {

  constructor(private http: HttpClient) {}

  private _roles = new BehaviorSubject<Rol[]>([]);
  roles$ = this._roles.asObservable();
  get roles() { return this._roles.getValue(); }

  cargarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${API}/roles`).pipe(
      tap(roles => this._roles.next(roles))
    );
  }

  cargarPermisos(): Observable<PermisoCatalogo> {
    return this.http.get<PermisoCatalogo>(`${API}/permisos`);
  }

  crearRol(data: { nombre: string; descripcion?: string; permisos: string[] }): Observable<Rol> {
    return this.http.post<Rol>(`${API}/roles`, data).pipe(
      tap(nuevo => this._roles.next([...this.roles, nuevo]))
    );
  }

  actualizarRol(id: number, data: { nombre?: string; descripcion?: string; permisos?: string[] }): Observable<Rol> {
    return this.http.put<Rol>(`${API}/roles/${id}`, data).pipe(
      tap(actualizado => this._roles.next(this.roles.map(r => r.id_rol === id ? { ...r, ...actualizado } : r)))
    );
  }

  eliminarRol(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/roles/${id}`).pipe(
      tap(() => this._roles.next(this.roles.filter(r => r.id_rol !== id)))
    );
  }

  asignarUsuario(idRol: number, idUsuario: number): Observable<void> {
    return this.http.post<void>(`${API}/roles/${idRol}/usuarios/${idUsuario}`, {});
  }

  quitarUsuario(idRol: number, idUsuario: number): Observable<void> {
    return this.http.delete<void>(`${API}/roles/${idRol}/usuarios/${idUsuario}`);
  }
}
