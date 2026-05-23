import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

@NgModule({
  declarations: [
    App,
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
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule {}
