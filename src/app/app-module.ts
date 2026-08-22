import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LucideSearch, LucidePlus, LucidePencil, LucideTrash2, LucideX, LucideBuilding2, LucideUser, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Shell
import { ShellLayoutComponent } from './components/shell/shell-layout.component';

// Shared
import { AppSwitcherComponent } from './components/shared/app-switcher.component';
import { ReportExportButtonsComponent } from './components/shared/report-export-buttons/report-export-buttons.component';
import { PuedeDirective } from './core/directives/puede.directive';
import { RolesComponent } from './components/admin/roles/roles.component';
import { ToastContainerComponent } from './components/shared/toast/toast-container.component';
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';

// Auth
import { AuthLoginComponent }      from './components/auth/login/login.component';
import { AuthRegistroComponent }   from './components/auth/registro/registro.component';
import { AuthOnboardingComponent } from './components/auth/onboarding/onboarding.component';
import { AuthForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { AuthResetPasswordComponent }  from './components/auth/reset-password/reset-password.component';
import { AuthSocialCallbackComponent } from './components/auth/social-callback/social-callback.component';

// CRM
import { DashboardComponent }    from './components/crm/dashboard/dashboard.component';
import { LeadsComponent }        from './components/crm/leads/leads.component';
import { OportunidadesComponent }from './components/crm/oportunidades/oportunidades.component';
import { ClientesComponent }     from './components/crm/clientes/clientes.component';
import { ActividadesComponent }  from './components/crm/actividades/actividades.component';
import { MarketingComponent }    from './components/crm/marketing/marketing.component';
import { AutomatizarComponent }  from './components/crm/automatizar/automatizar.component';
import { ReportesComponent }     from './components/crm/reportes/reportes.component';
import { IntegracionesComponent }from './components/crm/integraciones/integraciones.component';

// POS
import { PosPageComponent }              from './components/pos/pos-page.component';
import { PosCatalogoComponent }          from './components/pos/catalogo/catalogo.component';
import { PosCarritoComponent }           from './components/pos/carrito/carrito.component';
import { PosTicketComponent }            from './components/pos/ticket/ticket.component';
import { PosTerminalFarmaciaComponent }  from './components/pos/terminal-farmacia/terminal-farmacia.component';
import { PosTerminalHotelComponent }     from './components/pos/terminal-hotel/terminal-hotel.component';
import { PosTerminalRestauranteComponent }from './components/pos/terminal-restaurante/terminal-restaurante.component';
import { PagoModalComponent }            from './components/pos/pago-modal/pago-modal.component';

// ERP
import { ErpPageComponent }      from './components/erp/erp-page.component';
import { ErpDashboardComponent } from './components/erp/dashboard/dashboard.component';
import { ErpReportesComponent } from './components/erp/reportes/reportes.component';
import { ErpInventarioComponent }from './components/erp/inventario/inventario.component';
import { ErpComprasComponent }   from './components/erp/compras/compras.component';
import { ErpFinanzasComponent }  from './components/erp/finanzas/finanzas.component';
import { ErpVentasComponent }    from './components/erp/ventas/ventas.component';
import { ErpReservasHotelAdminComponent } from './components/erp/ventas/reservas-hotel-admin.component';
import { ErpFacturacionComponent } from './components/erp/facturacion/facturacion.component';
import { ErpFabricacionComponent }from './components/erp/fabricacion/fabricacion.component';
import { ErpScmComponent }       from './components/erp/scm/scm.component';
import { ErpRrhhComponent }      from './components/erp/rrhh/rrhh.component';
import { ErpCrmComponent }       from './components/erp/crm-erp/crm-erp.component';
import { ErpProyectosComponent } from './components/erp/proyectos/proyectos.component';

// Other
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { PricingComponent }       from './components/pricing/pricing.component';
import { NotFoundComponent }      from './components/shared/not-found/not-found.component';

// Admin
import { PlanesComponent } from './components/admin/planes/planes.component';
import { EmpresasComponent } from './components/admin/empresas/empresas.component';
import { SuscripcionComponent } from './components/configuracion/suscripcion/suscripcion.component';

// Interceptors
import { AuthInterceptor }  from './core/interceptors/auth-interceptor-interceptor';
import { ErrorInterceptor } from './core/interceptors/error-interceptor-interceptor';

@NgModule({
  declarations: [
    App,
    // Shell
    ShellLayoutComponent,
    // Shared
    AppSwitcherComponent,
    ReportExportButtonsComponent,
    PuedeDirective,
    // Auth
    AuthLoginComponent,
    AuthRegistroComponent,
    AuthOnboardingComponent,
    AuthForgotPasswordComponent,
    AuthResetPasswordComponent,
    AuthSocialCallbackComponent,
    // CRM
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
    PosCatalogoComponent,
    PosCarritoComponent,
    PosTicketComponent,
    PosTerminalFarmaciaComponent,
    PosTerminalHotelComponent,
    PosTerminalRestauranteComponent,
    PagoModalComponent,
    // ERP
    ErpPageComponent,
    ErpDashboardComponent,
    ErpReportesComponent,
    ErpInventarioComponent,
    ErpComprasComponent,
    ErpFinanzasComponent,
    ErpVentasComponent,
    ErpReservasHotelAdminComponent,
    ErpFacturacionComponent,
    ErpFabricacionComponent,
    ErpScmComponent,
    ErpRrhhComponent,
    ErpCrmComponent,
    ErpProyectosComponent,
    // Other
    ConfiguracionComponent,
    PricingComponent,
    // Admin
    PlanesComponent,
    EmpresasComponent,
    RolesComponent,
    SuscripcionComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    NotFoundComponent,
    ToastContainerComponent,
    ConfirmDialogComponent,
    // Lucide icons (pilot: crm/clientes, crm/leads)
    LucideSearch,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideX,
    LucideBuilding2,
    LucideUser,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,  multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [App],
})
export class AppModule {}
