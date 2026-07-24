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
  hotelTipo?: string; hotelHabitaciones?: number | null; hotelAmenidades?: string[];
  restTipo?: string; restMesas?: number | null; restCanales?: string[];
  almacenTipo?: string; almacenSkus?: string; almacenOps?: string[];
  farmTipo?: string; farmAtencion?: string[]; farmEspecialidades?: string[];
  startupEtapa?: string; startupModelo?: string; startupMetricas?: string[];
  tiendaTipo?: string; tiendaCanales?: string[];
}

export interface PlanInfo {
  nombre_plan: string;
  max_usuarios: number | null;
  usuarios_actuales: number;
  estado_suscripcion?: string;
  fecha_fin_periodo_actual?: string | null;
  cancela_al_final_periodo?: boolean;
}

export interface MembresiaInfo {
  id_tenant: number;
  empresa: string;
  es_owner: boolean;
}

export interface UserSession {
  email: string;
  nombre: string;
  empresa?: string;
  logo?: string | null;
  sector?: string;
  idioma?: string;
  zonaHoraria?: string;
  onboardingCompleto: boolean;
  nichoData?: NichoData;
  id_usuario?: number;
  id_tenant?: number;
  es_admin?: boolean;
  es_superadmin?: boolean;
  plan?: PlanInfo | null;
  membresias?: MembresiaInfo[];
  foto_perfil?: string | null;
  permisos?: string[];
  estado?: 'activo' | 'ocupado' | 'suspendido';
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

  /** ¿Tiene el usuario el permiso dado ("recurso.accion") en el tenant activo? */
  tienePermiso(clave: string): boolean {
    const permisos = this.session?.permisos;
    return !!permisos && (permisos.includes('*') || permisos.includes(clave));
  }

  /**
   * Construye un UserSession completo a partir de la respuesta del backend
   * (forma de AuthController::serializeUser, usada por /login, /register,
   * /user y mis-empresas/{id}/activar). Único lugar donde se mapean estos
   * campos para no repetirlos en cada método.
   */
  private mapSesion(user: any, fallback?: { nombre?: string; email?: string }): UserSession {
    return {
      email:              user.email ?? fallback?.email ?? '',
      nombre:             user.nombre ?? fallback?.nombre ?? '',
      empresa:            user.empresa,
      logo:               user.logo ?? null,
      sector:             user.sector,
      idioma:             user.idioma,
      zonaHoraria:        user.zonaHoraria,
      onboardingCompleto: !!user.onboardingCompleto,
      nichoData:          user.nichoData,
      id_usuario:         user.id_usuario,
      id_tenant:          user.id_tenant,
      es_admin:           !!user.es_admin,
      es_superadmin:      !!user.es_superadmin,
      plan:               user.plan,
      membresias:         user.membresias,
      foto_perfil:        user.foto_perfil ?? null,
      permisos:           user.permisos ?? [],
      estado:             user.estado ?? 'activo',
    };
  }

  private guardarSesion(session: UserSession) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
  }

  forgotPassword(email: string): Observable<boolean> {
    return this.http.post(`${environment.apiUrl}/forgot-password`, { email }).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  resetPassword(email: string, token: string, password: string, passwordConfirmation: string): Observable<boolean> {
    return this.http.post(`${environment.apiUrl}/reset-password`, {
      email, token, password, password_confirmation: passwordConfirmation,
    }).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.guardarSesion(this.mapSesion(res.user, { email }));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  registro(nombre: string, email: string, password: string): Observable<boolean> {
    return this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/register`, { nombre, email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.guardarSesion(this.mapSesion(res.user, { nombre, email }));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  completarOnboarding(data: { empresa: string; nichoData: NichoData }): Observable<boolean> {
    const { nicho, moneda, modulos, ...datosNicho } = data.nichoData;
    const payload = { empresa: data.empresa, nicho, moneda, modulos, datos_nicho: datosNicho };

    return this.http.post<{ empresa: string; onboardingCompleto: boolean; nichoData: NichoData; logo?: string | null }>(
      `${environment.apiUrl}/tenant/onboarding`, payload
    ).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.empresa = res.empresa;
        session.nichoData = res.nichoData;
        session.onboardingCompleto = res.onboardingCompleto;
        if (res.logo !== undefined) session.logo = res.logo;
        this.guardarSesion(session);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  cambiarMiEstado(estado: 'activo' | 'ocupado'): Observable<boolean> {
    return this.http.patch<any>(`${environment.apiUrl}/perfil/estado`, { estado }).pipe(
      tap(user => this.guardarSesion(this.mapSesion(user))),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** Completa el login social: guarda el token que mandó el callback de Auth0
   * (ver Auth0Controller en el backend) y carga la sesión igual que login(). */
  iniciarSesionConToken(token: string): Observable<boolean> {
    localStorage.setItem(this.TOKEN_KEY, token);
    return this.refreshSession();
  }

  refreshSession(): Observable<boolean> {
    if (!this.getToken()) return of(false);
    return this.http.get<any>(`${environment.apiUrl}/user`).pipe(
      tap(user => this.guardarSesion(this.mapSesion(user))),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  cambiarEmpresa(idTenant: number): Observable<boolean> {
    return this.http.post<any>(`${environment.apiUrl}/mis-empresas/${idTenant}/activar`, {}).pipe(
      tap(user => this.guardarSesion(this.mapSesion(user))),
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

  subirLogoEmpresa(file: File): Observable<boolean> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<any>(`${environment.apiUrl}/tenant/logo`, form).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.logo = res.logo ?? null;
        this.guardarSesion(session);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  eliminarLogoEmpresa(): Observable<boolean> {
    return this.http.delete<any>(`${environment.apiUrl}/tenant/logo`).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.logo = res.logo ?? null;
        this.guardarSesion(session);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  actualizarPerfil(data: { nombre: string; email: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/perfil`, data).pipe(
      tap(user => {
        const session = this.session;
        if (!session) return;
        session.nombre = user.nombre;
        session.email = user.email;
        this.guardarSesion(session);
      }),
    );
  }

  actualizarTenant(data: {
    sector?: string; idioma?: string; zonaHoraria?: string; moneda?: string;
    empresa?: string; nicho?: string; modulos?: { crm: boolean; pos: boolean; erp: boolean };
  }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/tenant`, data).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.sector = res.sector;
        session.idioma = res.idioma;
        session.zonaHoraria = res.zonaHoraria;
        session.empresa = res.empresa;
        if (res.nichoData) session.nichoData = res.nichoData;
        this.guardarSesion(session);
      }),
    );
  }

  subirFotoPerfil(file: File): Observable<boolean> {
    const form = new FormData();
    form.append('foto', file);
    return this.http.post<any>(`${environment.apiUrl}/perfil/foto`, form).pipe(
      tap(user => {
        const session = this.session;
        if (!session) return;
        session.foto_perfil = user.foto_perfil ?? null;
        this.guardarSesion(session);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  eliminarFotoPerfil(): Observable<boolean> {
    return this.http.delete<any>(`${environment.apiUrl}/perfil/foto`).pipe(
      tap(user => {
        const session = this.session;
        if (!session) return;
        session.foto_perfil = null;
        this.guardarSesion(session);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
