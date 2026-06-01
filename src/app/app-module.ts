import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LeadsComponent } from './components/leads/leads.component';
import { OportunidadesComponent } from './components/oportunidades/oportunidades.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { ActividadesComponent } from './components/actividades/actividades.component';
import { MarketingComponent } from './components/marketing/marketing.component';
import { AutomatizarComponent } from './components/automatizar/automatizar.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { IntegracionesComponent } from './components/integraciones/integraciones.component';
import { AuthInterceptor } from '../app/core/interceptors/auth-interceptor-interceptor';
import { ErrorInterceptor } from '../app/core/interceptors/error-interceptor-interceptor';
import { Login } from './components/login/login';

@NgModule({
  declarations: [
    App,
    Login,
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
