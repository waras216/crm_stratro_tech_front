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
  hotelTipo?: string; hotelHabitaciones?: number | null; hotelAmenidades?: string[]; hotelTiposHabitacion?: string[];
  restTipo?: string; restMesas?: number | null; restCanales?: string[];
  almacenTipo?: string; almacenSkus?: string; almacenOps?: string[];
  farmTipo?: string; farmAtencion?: string[]; farmEspecialidades?: string[];
  startupEtapa?: string; startupModelo?: string; startupMetricas?: string[];
  tiendaTipo?: string; tiendaCanales?: string[];
}

export interface FiscalData {
  rfc?: string | null;
  razonSocial?: string | null;
  regimenFiscal?: string | null;
  codigoPostal?: string | null;
}

export interface PlanInfo {
  nombre_plan: string;
  max_usuarios: number | null;
  incluye_facturacion_real?: boolean;
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
  telefono?: string | null;
  empresa?: string;
  logo?: string | null;
  sector?: string;
  idioma?: string;
  zonaHoraria?: string;
  fiscal?: FiscalData;
  onboardingCompleto: boolean;
  nichoData?: NichoData;
  id_usuario?: number;
  id_tenant?: number;
  es_admin?: boolean;
  es_superadmin?: boolean;
  /** Cajero (sin correo, entra solo por 2FA): solo debe ver el módulo POS. */
  soloPos?: boolean;
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
  // A diferencia de STORAGE_KEY/TOKEN_KEY, esto NO se borra en logout() a
  // propósito: es "qué tenant es este dispositivo/terminal", para que un
  // cajero pueda entrar solo con su código 2FA sin volver a pedir correo
  // (ver loginDosFa()). A diferencia de antes, YA NO se graba automáticamente en
  // cada login normal (un mismo navegador puede recibir logins de varios
  // tenants distintos — dispositivo compartido, pruebas, etc. — y quedaba
  // pegado al primero que entrara). Solo se graba vía vincularTerminal(),
  // una acción explícita de un admin del tenant (ver configuracion).
  private readonly TERMINAL_TENANT_KEY = 'pos_terminal_tenant';

  constructor(private http: HttpClient, private router: Router) {}

  get terminalTenantId(): number | null {
    const raw = localStorage.getItem(this.TERMINAL_TENANT_KEY);
    return raw ? Number(raw) : null;
  }

  /** ¿Esta terminal ya está vinculada al tenant de la sesión activa? */
  get terminalVinculadaAMiTenant(): boolean {
    return this.terminalTenantId !== null && this.terminalTenantId === this.session?.id_tenant;
  }

  /** Vincula explícitamente este dispositivo/navegador al tenant de la
   * sesión activa, para habilitar el login rápido por 2FA de cajero en él.
   * Debe llamarse solo desde una acción deliberada de un admin (ver
   * configuracion.component), nunca automáticamente en un login normal. */
  vincularTerminal() {
    const idTenant = this.session?.id_tenant;
    if (idTenant) localStorage.setItem(this.TERMINAL_TENANT_KEY, String(idTenant));
  }

  /** Desvincula este dispositivo: ya no ofrecerá login por 2FA hasta que
   * alguien lo vincule de nuevo explícitamente. */
  desvincularTerminal() {
    localStorage.removeItem(this.TERMINAL_TENANT_KEY);
  }

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
      telefono:           user.telefono ?? null,
      empresa:            user.empresa,
      logo:               user.logo ?? null,
      sector:             user.sector,
      idioma:             user.idioma,
      zonaHoraria:        user.zonaHoraria,
      fiscal:             user.fiscal,
      onboardingCompleto: !!user.onboardingCompleto,
      nichoData:          user.nichoData,
      id_usuario:         user.id_usuario,
      id_tenant:          user.id_tenant,
      es_admin:           !!user.es_admin,
      es_superadmin:      !!user.es_superadmin,
      soloPos:            !!user.soloPos,
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

  /** Cajeros (con 2FA configurado) del tenant recordado en este dispositivo,
   * para elegir "quién eres" antes de teclear el código. */
  cargarUsuariosDosFa(): Observable<{ id_usuario: number; nombre: string }[]> {
    const idTenant = this.terminalTenantId;
    if (!idTenant) return of([]);
    return this.http.get<{ id_usuario: number; nombre: string }[]>(`${environment.apiUrl}/2fa-login/usuarios`, { params: { id_tenant: idTenant } })
      .pipe(catchError(() => of([])));
  }

  /** Login rápido por código 2FA en este dispositivo (ver TERMINAL_TENANT_KEY). */
  loginDosFa(idUsuario: number, codigo: string): Observable<boolean> {
    const idTenant = this.terminalTenantId;
    if (!idTenant) return of(false);

    return this.http.post<{ user: any; token: string }>(`${environment.apiUrl}/2fa-login`, { id_tenant: idTenant, id_usuario: idUsuario, codigo }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.guardarSesion(this.mapSesion(res.user));
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

  completarOnboarding(data: { empresa: string; nichoData: NichoData; fiscal?: FiscalData }): Observable<boolean> {
    const { nicho, moneda, modulos, ...datosNicho } = data.nichoData;
    const payload = { empresa: data.empresa, nicho, moneda, modulos, datos_nicho: datosNicho, fiscal: data.fiscal };

    return this.http.post<{ empresa: string; onboardingCompleto: boolean; nichoData: NichoData; fiscal?: FiscalData; logo?: string | null }>(
      `${environment.apiUrl}/tenant/onboarding`, payload
    ).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.empresa = res.empresa;
        session.nichoData = res.nichoData;
        session.fiscal = res.fiscal;
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

  /** Completa el login social: guarda el token que mandó el callback de Google
   * (ver GoogleAuthController en el backend) y carga la sesión igual que login(). */
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

  actualizarPerfil(data: { nombre: string; email: string; telefono?: string | null }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/perfil`, data).pipe(
      tap(user => {
        const session = this.session;
        if (!session) return;
        session.nombre = user.nombre;
        session.email = user.email;
        session.telefono = user.telefono ?? null;
        this.guardarSesion(session);
      }),
    );
  }

  actualizarTenant(data: {
    sector?: string; idioma?: string; zonaHoraria?: string; moneda?: string;
    empresa?: string; nicho?: string; modulos?: { crm: boolean; pos: boolean; erp: boolean };
    fiscal?: FiscalData;
  }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/tenant`, data).pipe(
      tap(res => {
        const session = this.session;
        if (!session) return;
        session.sector = res.sector;
        session.idioma = res.idioma;
        session.zonaHoraria = res.zonaHoraria;
        session.empresa = res.empresa;
        if (res.fiscal) session.fiscal = res.fiscal;
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
