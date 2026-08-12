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

  invitarUsuario(usuario: { nombre: string; email: string; password: string; es_admin?: boolean; id_rol?: number | null }): Observable<Usuario> {
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

  /** Genera un secreto TOTP nuevo para este usuario y lo devuelve como QR
   * (data URI) + clave manual, para enrolarlo en una app tipo Google
   * Authenticator. No se persiste hasta confirmarDosFa(). */
  iniciarDosFa(idUsuario: number): Observable<{ secret: string; qr: string }> {
    return this.http.post<{ secret: string; qr: string }>(`${API}/usuarios/${idUsuario}/2fa/iniciar`, {});
  }

  /** Confirma el enrolamiento con un código generado a partir del secreto
   * recibido de iniciarDosFa(). Recién acá queda guardado en el backend. */
  confirmarDosFa(idUsuario: number, secret: string, codigo: string): Observable<{ tiene_2fa: boolean }> {
    return this.http.post<{ tiene_2fa: boolean }>(`${API}/usuarios/${idUsuario}/2fa/confirmar`, { secret, codigo }).pipe(
      tap(() => this._usuarios.next(this.usuarios.map(u => u.id_usuario === idUsuario ? { ...u, tiene_2fa: true } : u)))
    );
  }

  /** Borra el 2FA configurado de este usuario (p. ej. perdió el teléfono),
   * para poder enrolarlo de nuevo desde cero. */
  restablecerDosFa(idUsuario: number): Observable<{ tiene_2fa: boolean }> {
    return this.http.delete<{ tiene_2fa: boolean }>(`${API}/usuarios/${idUsuario}/2fa`).pipe(
      tap(() => this._usuarios.next(this.usuarios.map(u => u.id_usuario === idUsuario ? { ...u, tiene_2fa: false } : u)))
    );
  }
}
