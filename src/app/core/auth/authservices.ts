import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface UserSession {
  email: string;
  nombre: string;
  empresa?: string;
  onboardingCompleto: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'crm_session';

  constructor(private router: Router) {
    this.seedDefaultUser();
  }

  private seedDefaultUser() {
    const users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    if (!users.find((u: any) => u.email === 'israel@strato.com')) {
      users.push({ nombre: 'Israel', email: 'israel@strato.com', password: '123456', empresa: 'Stratro Tech', sector: 'Tecnología', tamano: '1-10 empleados', onboardingCompleto: false });
      localStorage.setItem('crm_users', JSON.stringify(users));
    }
  }

  get session(): UserSession | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  get isLoggedIn(): boolean { return !!this.session; }
  get isOnboarded(): boolean { return !!this.session?.onboardingCompleto; }

  login(email: string, password: string): boolean {
    // Mock: cualquier credencial funciona
    const users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) return false;
    const session: UserSession = { email: user.email, nombre: user.nombre, empresa: user.empresa, onboardingCompleto: user.onboardingCompleto ?? false };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    return true;
  }

  registro(nombre: string, email: string, password: string): boolean {
    const users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    if (users.find((u: any) => u.email === email)) return false;
    users.push({ nombre, email, password, onboardingCompleto: false });
    localStorage.setItem('crm_users', JSON.stringify(users));
    const session: UserSession = { email, nombre, onboardingCompleto: false };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    return true;
  }

  completarOnboarding(data: { empresa: string; sector: string; tamano: string; sucursales?: string }) {
    const session = this.session;
    if (!session) return;
    session.empresa = data.empresa;
    session.onboardingCompleto = true;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    // Actualizar también en users
    const users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    const idx = users.findIndex((u: any) => u.email === session.email);
    if (idx > -1) { users[idx] = { ...users[idx], ...data, onboardingCompleto: true }; localStorage.setItem('crm_users', JSON.stringify(users)); }
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/auth/login']);
  }

  setLogo(dataUrl: string) {
    localStorage.setItem('crm_logo', dataUrl);
  }

  getLogo(): string | null {
    return localStorage.getItem('crm_logo');
  }
}
