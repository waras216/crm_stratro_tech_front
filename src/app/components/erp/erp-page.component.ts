import { Component } from '@angular/core';
import { ErpTab } from './layout/erp-layout.component';

@Component({
  selector: 'app-erp-page',
  standalone: false,
  template: `
    <app-erp-layout [tabActivo]="tab" (cambiarTab)="tab=$event">
      <app-erp-dashboard *ngIf="tab==='dashboard'"></app-erp-dashboard>
      <app-erp-finanzas *ngIf="tab==='finanzas'"></app-erp-finanzas>
      <app-erp-compras *ngIf="tab==='compras'"></app-erp-compras>
      <app-erp-ventas *ngIf="tab==='ventas'"></app-erp-ventas>
      <app-erp-inventario *ngIf="tab==='inventario'"></app-erp-inventario>
      <app-erp-fabricacion *ngIf="tab==='fabricacion'"></app-erp-fabricacion>
      <app-erp-scm *ngIf="tab==='scm'"></app-erp-scm>
      <app-erp-rrhh *ngIf="tab==='rrhh'"></app-erp-rrhh>
      <app-erp-crm *ngIf="tab==='crm'"></app-erp-crm>
      <app-erp-proyectos *ngIf="tab==='proyectos'"></app-erp-proyectos>
    </app-erp-layout>
  `,
  styles: [':host { display: block; height: 100%; }'],
})
export class ErpPageComponent {
  tab: ErpTab = 'dashboard';
}
