// src/app/core/services/usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../models/crm.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  constructor(private http: HttpClient) {}

  private _usuarios = new BehaviorSubject<Usuario[]>([]);
  usuarios$ = this._usuarios.asObservable();
  get usuarios() { return this._usuarios.getValue(); }

  cargarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API}/usuarios`).pipe(
      tap(usuarios => this._usuarios.next(usuarios))
    );
  }

  invitarUsuario(usuario: { nombre: string; email: string; password: string; es_admin?: boolean }): Observable<Usuario> {
    return this.http.post<Usuario>(`${API}/usuarios`, usuario).pipe(
      tap(nuevo => this._usuarios.next([...this.usuarios, nuevo]))
    );
  }

  actualizarUsuario(id: number, usuario: Partial<Usuario> & { password?: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${API}/usuarios/${id}`, usuario).pipe(
      tap(updated => this._usuarios.next(this.usuarios.map(u => u.id_usuario === id ? updated : u)))
    );
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/usuarios/${id}`).pipe(
      tap(() => this._usuarios.next(this.usuarios.filter(u => u.id_usuario !== id)))
    );
  }
}
