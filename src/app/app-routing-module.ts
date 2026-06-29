import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthLoginComponent } from './components/auth/login/login.component';
import { AuthRegistroComponent } from './components/auth/registro/registro.component';
import { AuthOnboardingComponent } from './components/auth/onboarding/onboarding.component';

import { LayoutComponent } from './components/crm/layout/layout.component';
import { DashboardComponent } from './components/crm/dashboard/dashboard.component';
import { LeadsComponent } from './components/crm/leads/leads.component';
import { OportunidadesComponent } from './components/crm/oportunidades/oportunidades.component';
import { ClientesComponent } from './components/crm/clientes/clientes.component';
import { ActividadesComponent } from './components/crm/actividades/actividades.component';
import { MarketingComponent } from './components/crm/marketing/marketing.component';
import { AutomatizarComponent } from './components/crm/automatizar/automatizar.component';
import { ReportesComponent } from './components/crm/reportes/reportes.component';
import { IntegracionesComponent } from './components/crm/integraciones/integraciones.component';

import { PosPageComponent } from './components/pos/pos-page.component';
import { ErpPageComponent } from './components/erp/erp-page.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { PricingComponent } from './components/pricing/pricing.component';

import { AuthGuard } from './core/auth/auth.guard';
import { NotFoundComponent } from './components/shared/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Auth (público)
  { path: 'auth/login', component: AuthLoginComponent },
  { path: 'auth/registro', component: AuthRegistroComponent },
  { path: 'auth/onboarding', component: AuthOnboardingComponent },

  // CRM (protegido)
  {
    path: 'crm', component: LayoutComponent, canActivate: [AuthGuard], children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'leads', component: LeadsComponent },
      { path: 'oportunidades', component: OportunidadesComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'actividades', component: ActividadesComponent },
      { path: 'marketing', component: MarketingComponent },
      { path: 'automatizar', component: AutomatizarComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: 'integraciones', component: IntegracionesComponent },
    ]
  },

  // Configuración (protegido, sin sidebar)
  { path: 'crm/configuracion', component: ConfiguracionComponent, canActivate: [AuthGuard] },

  // POS (protegido)
  { path: 'pos', component: PosPageComponent, canActivate: [AuthGuard] },

  // ERP (protegido)
  { path: 'erp', component: ErpPageComponent, canActivate: [AuthGuard] },

  // Pricing (público)
  { path: 'pricing', component: PricingComponent },

  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
