import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthLoginComponent }     from './components/auth/login/login.component';
import { AuthRegistroComponent }  from './components/auth/registro/registro.component';
import { AuthOnboardingComponent }from './components/auth/onboarding/onboarding.component';
import { AuthForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { AuthResetPasswordComponent }  from './components/auth/reset-password/reset-password.component';
import { AuthSocialCallbackComponent } from './components/auth/social-callback/social-callback.component';

import { ShellLayoutComponent }   from './components/shell/shell-layout.component';

import { DashboardComponent }     from './components/crm/dashboard/dashboard.component';
import { LeadsComponent }         from './components/crm/leads/leads.component';
import { OportunidadesComponent } from './components/crm/oportunidades/oportunidades.component';
import { ClientesComponent }      from './components/crm/clientes/clientes.component';
import { ActividadesComponent }   from './components/crm/actividades/actividades.component';
import { MarketingComponent }     from './components/crm/marketing/marketing.component';
import { AutomatizarComponent }   from './components/crm/automatizar/automatizar.component';
import { ReportesComponent }      from './components/crm/reportes/reportes.component';
import { IntegracionesComponent } from './components/crm/integraciones/integraciones.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';

import { ErpPageComponent }       from './components/erp/erp-page.component';
import { PosPageComponent }       from './components/pos/pos-page.component';
import { PricingComponent }       from './components/pricing/pricing.component';
import { NotFoundComponent }      from './components/shared/not-found/not-found.component';
import { AuthGuard }              from './core/auth/auth.guard';
import { ModuloGuard }            from './core/auth/modulo.guard';

import { PlanesComponent }        from './components/admin/planes/planes.component';
import { EmpresasComponent }      from './components/admin/empresas/empresas.component';
import { RolesComponent }         from './components/admin/roles/roles.component';
import { SuperAdminGuard }        from './core/auth/superadmin.guard';
import { AdminTenantGuard }       from './core/auth/admin-tenant.guard';

const routes: Routes = [
  { path: '', redirectTo: 'crm/dashboard', pathMatch: 'full' },

  // Public routes
  { path: 'auth/login',       component: AuthLoginComponent },
  { path: 'auth/registro',    component: AuthRegistroComponent },
  { path: 'auth/onboarding',  component: AuthOnboardingComponent },
  { path: 'auth/forgot-password', component: AuthForgotPasswordComponent },
  { path: 'auth/reset-password',  component: AuthResetPasswordComponent },
  { path: 'auth/social-callback', component: AuthSocialCallbackComponent },
  { path: 'pricing',          component: PricingComponent },

  // Shell: single persistent layout for all authenticated modules
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'crm',
        canActivate: [ModuloGuard],
        data: { modulo: 'crm' },
        children: [
          { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard',    component: DashboardComponent },
          { path: 'leads',        component: LeadsComponent },
          { path: 'oportunidades',component: OportunidadesComponent },
          { path: 'clientes',     component: ClientesComponent },
          { path: 'actividades',  component: ActividadesComponent },
          { path: 'marketing',    component: MarketingComponent },
          { path: 'automatizar',  component: AutomatizarComponent },
          { path: 'reportes',     component: ReportesComponent },
          { path: 'integraciones',component: IntegracionesComponent },
        ],
      },
      { path: 'erp', component: ErpPageComponent, canActivate: [ModuloGuard], data: { modulo: 'erp' } },
      { path: 'pos', component: PosPageComponent, canActivate: [ModuloGuard], data: { modulo: 'pos' } },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'admin/planes', component: PlanesComponent, canActivate: [SuperAdminGuard] },
      { path: 'admin/empresas', component: EmpresasComponent, canActivate: [SuperAdminGuard] },
      { path: 'admin/roles', component: RolesComponent, canActivate: [AdminTenantGuard] },
    ],
  },

  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
