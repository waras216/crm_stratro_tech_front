import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';

@Component({ selector: 'app-auth-onboarding', standalone: false, templateUrl: './onboarding.component.html', styleUrls: ['./onboarding.component.scss'] })
export class AuthOnboardingComponent {
  step = 1;
  totalSteps = 3;
  showWelcome = false;
  logoPreview: string | null = null;

  // Step 1 - Empresa
  empresa = '';
  sector = '';
  // Step 2 - Configuración
  tamano = '';
  sucursales = '';
  moneda = 'MXN';
  // Step 3 - Módulos
  modulos = { crm: true, pos: false, erp: false };

  sectores = ['Tecnología', 'Retail', 'Servicios', 'Manufactura', 'Salud', 'Educación', 'Finanzas', 'Otro'];
  tamanos = ['1-10 empleados', '11-50 empleados', '51-200 empleados', '200+ empleados'];
  opcionesSucursales = ['1 sucursal', '2-5 sucursales', '6-20 sucursales', '20+ sucursales'];
  monedas = ['MXN', 'USD', 'EUR', 'COP', 'ARS'];

  constructor(private auth: AuthService, private router: Router) {
    if (!this.auth.isLoggedIn) this.router.navigate(['/auth/login']);
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.logoPreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  next() {
    if (this.step === 1 && !this.empresa) return;
    if (this.step < this.totalSteps) this.step++;
    else this.finish();
  }

  prev() { if (this.step > 1) this.step--; }

  finish() {
    this.auth.completarOnboarding({ empresa: this.empresa, sector: this.sector, tamano: this.tamano, sucursales: this.sucursales });
    if (this.logoPreview) this.auth.setLogo(this.logoPreview);
    this.showWelcome = true;
  }

  goToDashboard() {
    this.router.navigate(['/crm']);
  }
}
