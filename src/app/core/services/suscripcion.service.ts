// src/app/core/services/suscripcion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Suscripcion } from '../../models/crm.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class SuscripcionService {

  constructor(private http: HttpClient) {}

  obtenerEstado(): Observable<Suscripcion | null> {
    return this.http.get<Suscripcion | null>(`${API}/suscripcion`);
  }

  iniciarCheckout(idPlan: number): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${API}/suscripcion/checkout`, { id_plan: idPlan });
  }

  abrirPortal(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${API}/suscripcion/portal`, {});
  }
}
