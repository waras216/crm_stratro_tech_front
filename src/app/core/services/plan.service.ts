// src/app/core/services/plan.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plan } from '../../models/crm.models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PlanService {

  constructor(private http: HttpClient) {}

  private _planes = new BehaviorSubject<Plan[]>([]);
  planes$ = this._planes.asObservable();
  get planes() { return this._planes.getValue(); }

  cargarPlanes(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${API}/planes`).pipe(
      tap(planes => this._planes.next(planes))
    );
  }

  crearPlan(plan: Partial<Plan>): Observable<Plan> {
    return this.http.post<Plan>(`${API}/planes`, plan).pipe(
      tap(nuevo => this._planes.next([...this.planes, nuevo]))
    );
  }

  actualizarPlan(id: number, plan: Partial<Plan>): Observable<Plan> {
    return this.http.put<Plan>(`${API}/planes/${id}`, plan).pipe(
      tap(updated => this._planes.next(this.planes.map(p => p.id_plan === id ? updated : p)))
    );
  }

  eliminarPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/planes/${id}`).pipe(
      tap(() => this._planes.next(this.planes.filter(p => p.id_plan !== id)))
    );
  }
}
