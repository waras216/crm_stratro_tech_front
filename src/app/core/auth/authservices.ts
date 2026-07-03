import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface NichoData {
  nicho: string;
  moneda: string;
  modulos: { crm: boolean; pos: boolean; erp: boolean };
  hotelTipo?: string; hotelHabitaciones?: string; hotelAmenidades?: string[];
  restTipo?: string; restMesas?: string; restCanales?: string[];
  almacenTipo?: string; almacenSkus?: string; almacenOps?: string[];
  farmTipo?: string; farmAtencion?: string[]; farmEspecialidades?: string[];
  startupEtapa?: string; startupModelo?: string; startupMetricas?: string[];
  tiendaTipo?: string; tiendaCanales?: string[];
}

export interface UserSession {
  email: string;
  nombre: string;
  empresa?: string;
  onboardingCompleto: boolean;
  nichoData?: NichoData;
  id_usuario?: number;
  id_tenant?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'crm_session';
  private readonly TOKEN_KEY   = 'api_token';

  constructor(private http: HttpClient, private router: Router) {}

  get session(): UserSession | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  get isLoggedIn(): boolean { return !!this.session && !!this.getToken(); }
  get isOnboarded(): boolean { return !!this.session?.onboardingCompleto; }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const session: UserSession = {
          email:              res.user.email,
          nombre:             res.user.nombre ?? email,
          empresa:            res.user.empresa,
          onboardingCompleto: !!res.user.onboardingCompleto,
          nichoData:          res.user.nichoData,
          id_usuario:         res.user.id_usuario,
          id_tenant:          res.user.id_tenant,
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  registro(nombre: string, email: string, password: string): Observable<boolean> {
    return this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/register`, { nombre, email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const session: UserSession = {
          email:              res.user.email,
          nombre:             res.user.nombre ?? nombre,
          empresa:            res.user.empresa,
          onboardingCompleto: !!res.user.onboardingCompleto,
          nichoData:          res.user.nichoData,
          id_usuario:         res.user.id_usuario,
          id_tenant:          res.user.id_tenant,
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  completarOnboarding(data: { empresa: string; nichoData: NichoData }): Observable<boolean> {
    const { nicho, moneda, modulos, ...datosNicho } = data.nichoData;
    const payload = { empresa: data.empresa, nicho, moneda, modulos, datos_nicho: datosNicho };

    return this.http.post<{ empresa: string; onboardingCompleto: boolean; nichoData: NichoData }>(
      `${environment.apiUrl}/tenant/onboarding`, payload
    ).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.empresa = res.empresa;
        session.nichoData = res.nichoData;
        session.onboardingCompleto = res.onboardingCompleto;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  refreshSession(): Observable<boolean> {
    if (!this.getToken()) return of(false);
    return this.http.get<any>(`${environment.apiUrl}/user`).pipe(
      tap(user => {
        const session = this.session;
        if (!session) return;
        session.empresa = user.empresa;
        session.onboardingCompleto = !!user.onboardingCompleto;
        session.nichoData = user.nichoData;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout() {
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    }
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/auth/login']);
  }

  setLogo(dataUrl: string) {
    localStorage.setItem('crm_logo', dataUrl);
  }

  getLogo(): string | null {
    return localStorage.getItem('crm_logo');
  }
}
