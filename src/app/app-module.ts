import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Shared
import { AppSwitcherComponent } from './components/shared/app-switcher.component';

// Auth
import { AuthLoginComponent } from './components/auth/login/login.component';
import { AuthRegistroComponent } from './components/auth/registro/registro.component';
import { AuthOnboardingComponent } from './components/auth/onboarding/onboarding.component';

// CRM
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

// POS
import { PosPageComponent } from './components/pos/pos-page.component';
import { PosLayoutComponent } from './components/pos/layout/pos-layout.component';
import { PosCatalogoComponent } from './components/pos/catalogo/catalogo.component';
import { PosCarritoComponent } from './components/pos/carrito/carrito.component';
import { PosTicketComponent } from './components/pos/ticket/ticket.component';

// ERP
import { ErpPageComponent } from './components/erp/erp-page.component';
import { ErpLayoutComponent } from './components/erp/layout/erp-layout.component';
import { ErpDashboardComponent } from './components/erp/dashboard/dashboard.component';
import { ErpInventarioComponent } from './components/erp/inventario/inventario.component';
import { ErpComprasComponent } from './components/erp/compras/compras.component';
import { ErpFinanzasComponent } from './components/erp/finanzas/finanzas.component';
import { ErpVentasComponent } from './components/erp/ventas/ventas.component';
import { ErpFabricacionComponent } from './components/erp/fabricacion/fabricacion.component';
import { ErpScmComponent } from './components/erp/scm/scm.component';
import { ErpRrhhComponent } from './components/erp/rrhh/rrhh.component';
import { ErpCrmComponent } from './components/erp/crm-erp/crm-erp.component';
import { ErpProyectosComponent } from './components/erp/proyectos/proyectos.component';

// Configuración
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';

// Pricing
import { PricingComponent } from './components/pricing/pricing.component';

// Interceptors
import { AuthInterceptor } from './core/interceptors/auth-interceptor-interceptor';
import { ErrorInterceptor } from './core/interceptors/error-interceptor-interceptor';

@NgModule({
  declarations: [
    App,
    AppSwitcherComponent,
    // Auth
    AuthLoginComponent,
    AuthRegistroComponent,
    AuthOnboardingComponent,
    // CRM
    LayoutComponent,
    DashboardComponent,
    LeadsComponent,
    OportunidadesComponent,
    ClientesComponent,
    ActividadesComponent,
    MarketingComponent,
    AutomatizarComponent,
    ReportesComponent,
    IntegracionesComponent,
    // POS
    PosPageComponent,
    PosLayoutComponent,
    PosCatalogoComponent,
    PosCarritoComponent,
    PosTicketComponent,
    // ERP
    ErpPageComponent,
    ErpLayoutComponent,
    ErpDashboardComponent,
    ErpInventarioComponent,
    ErpComprasComponent,
    ErpFinanzasComponent,
    ErpVentasComponent,
    ErpFabricacionComponent,
    ErpScmComponent,
    ErpRrhhComponent,
    ErpCrmComponent,
    ErpProyectosComponent,
    // Configuración
    ConfiguracionComponent,
    // Pricing
    PricingComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [App],
})
export class AppModule {}
