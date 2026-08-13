import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModuleService, ErpTab } from '../../core/services/module.service';

@Component({
  selector: 'app-erp-page',
  standalone: false,
  template: `
    <app-erp-dashboard   *ngIf="tab==='dashboard'"></app-erp-dashboard>
    <app-erp-finanzas    *ngIf="tab==='finanzas'"></app-erp-finanzas>
    <app-erp-compras     *ngIf="tab==='compras'"></app-erp-compras>
    <app-erp-ventas      *ngIf="tab==='ventas'"></app-erp-ventas>
    <app-erp-inventario  *ngIf="tab==='inventario'"></app-erp-inventario>
    <app-erp-fabricacion *ngIf="tab==='fabricacion'"></app-erp-fabricacion>
    <app-erp-scm         *ngIf="tab==='scm'"></app-erp-scm>
    <app-erp-rrhh        *ngIf="tab==='rrhh'"></app-erp-rrhh>
    <app-erp-crm         *ngIf="tab==='crm'"></app-erp-crm>
    <app-erp-proyectos   *ngIf="tab==='proyectos'"></app-erp-proyectos>
    <app-erp-reportes    *ngIf="tab==='reportes'"></app-erp-reportes>
  `,
  // min-height (no height fija): el host nunca debe quedar más bajo que el
  // área visible, pero sí debe poder crecer más si el contenido de la
  // página es más alto — con height:100% fijo, contenido que exceda esa
  // altura queda atrapado sin que el contenedor scrolleable (.content en
  // el shell) note el overflow real, y la última fila de una tarjeta
  // termina tapada por el FAB de cambio de módulo.
  styles: [':host { display: block; min-height: 100%; }'],
})
export class ErpPageComponent implements OnInit, OnDestroy {
  tab: ErpTab = 'dashboard';
  private destroy$ = new Subject<void>();

  constructor(private moduleService: ModuleService) {}

  ngOnInit() {
    this.moduleService.erpTab$
      .pipe(takeUntil(this.destroy$))
      .subscribe(t => this.tab = t);
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
