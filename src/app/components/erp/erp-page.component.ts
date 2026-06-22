import { Component } from '@angular/core';
import { ErpTab } from './layout/erp-layout.component';

@Component({
  selector: 'app-erp-page',
  standalone: false,
  template: `
    <app-erp-layout [tabActivo]="tab" (cambiarTab)="tab=$event">
      <app-erp-inventario *ngIf="tab==='inventario'"></app-erp-inventario>
      <app-erp-compras *ngIf="tab==='compras'"></app-erp-compras>
      <app-erp-finanzas *ngIf="tab==='finanzas'"></app-erp-finanzas>
    </app-erp-layout>
  `,
  styles: [':host { display: block; height: 100%; }'],
})
export class ErpPageComponent {
  tab: ErpTab = 'inventario';
}
