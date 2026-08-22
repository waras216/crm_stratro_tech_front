import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { EmpresaService } from '../../../core/services/empresa.service';
import { PlanService } from '../../../core/services/plan.service';
import { NotifyService } from '../../../core/services/notify.service';
import { Empresa, EmpresaKpiNicho, Plan } from '../../../models/crm.models';

@Component({
  selector: 'app-empresas',
  standalone: false,
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.scss'],
})
export class EmpresasComponent implements OnInit {
  empresas: Empresa[] = [];
  planes: Plan[] = [];
  kpisPorNicho: EmpresaKpiNicho[] = [];
  cargando = false;
  cargandoKpis = false;
  error = '';

  expandidoId: number | null = null;
  detalle: Empresa | null = null;
  cargandoDetalle = false;
  guardandoId: number | null = null;

  constructor(
    private empresaService: EmpresaService,
    private planService: PlanService,
    private location: Location,
    private notify: NotifyService,
  ) {}

  ngOnInit() {
    this.cargarEmpresas();
    this.cargarKpisPorNicho();
    this.planService.cargarPlanes().subscribe({ next: planes => this.planes = planes });
  }

  cargarKpisPorNicho() {
    this.cargandoKpis = true;
    this.empresaService.cargarKpisPorNicho().subscribe({
      next: kpis => { this.kpisPorNicho = kpis; this.cargandoKpis = false; },
      error: () => { this.cargandoKpis = false; },
    });
  }

  goBack() { this.location.back(); }

  cargarEmpresas() {
    this.cargando = true;
    this.error = '';
    this.empresaService.cargarEmpresas().subscribe({
      next: empresas => { this.empresas = empresas; this.cargando = false; },
      error: err => { this.error = err?.error?.message || 'No se pudieron cargar las empresas'; this.cargando = false; },
    });
  }

  toggleDetalle(empresa: Empresa) {
    if (this.expandidoId === empresa.id_tenant) {
      this.expandidoId = null;
      this.detalle = null;
      return;
    }
    this.expandidoId = empresa.id_tenant;
    this.detalle = null;
    this.cargandoDetalle = true;
    this.empresaService.verEmpresa(empresa.id_tenant).subscribe({
      next: detalle => { this.detalle = detalle; this.cargandoDetalle = false; },
      error: err => { this.error = err?.error?.message || 'No se pudo cargar el detalle'; this.cargandoDetalle = false; },
    });
  }

  async toggleSuspension(empresa: Empresa) {
    const nuevoEstado = empresa.estado === 'activo' ? 'suspendido' : 'activo';
    const accion = nuevoEstado === 'suspendido' ? 'suspender' : 'reactivar';
    const ok = await this.notify.confirm(`¿Seguro que quieres ${accion} "${empresa.empresa}"?`, { danger: nuevoEstado === 'suspendido', confirmText: accion === 'suspender' ? 'Suspender' : 'Reactivar' });
    if (!ok) return;

    this.error = '';
    this.guardandoId = empresa.id_tenant;
    this.empresaService.actualizarEmpresa(empresa.id_tenant, { estado: nuevoEstado }).subscribe({
      next: actualizada => {
        empresa.estado = actualizada.estado;
        this.guardandoId = null;
        this.notify.success(accion === 'suspender' ? 'Empresa suspendida' : 'Empresa reactivada');
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudo actualizar el estado';
        this.notify.error(this.error);
        this.guardandoId = null;
      },
    });
  }

  toggleModulo(empresa: Empresa, modulo: 'crm' | 'pos' | 'erp') {
    this.error = '';
    this.guardandoId = empresa.id_tenant;
    const nuevoValor = !empresa.modulos[modulo];
    this.empresaService.actualizarModulos(empresa.id_tenant, { [modulo]: nuevoValor }).subscribe({
      next: actualizada => {
        empresa.modulos = actualizada.modulos;
        this.guardandoId = null;
        this.notify.success('Módulo actualizado');
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudo actualizar el módulo';
        this.notify.error(this.error);
        this.guardandoId = null;
      },
    });
  }

  cambiarPlan(empresa: Empresa, idPlanStr: string) {
    const idPlan = Number(idPlanStr);
    if (!idPlan || idPlan === empresa.id_plan) return;

    this.error = '';
    this.guardandoId = empresa.id_tenant;
    this.empresaService.actualizarEmpresa(empresa.id_tenant, { id_plan: idPlan }).subscribe({
      next: actualizada => {
        empresa.id_plan = actualizada.id_plan;
        empresa.plan = actualizada.plan;
        this.guardandoId = null;
        this.notify.success('Plan actualizado');
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudo cambiar el plan';
        this.notify.error(this.error);
        this.guardandoId = null;
      },
    });
  }

  async eliminar(empresa: Empresa) {
    const ok = await this.notify.confirm(`¿Eliminar la empresa "${empresa.empresa}"? Esta acción se puede revertir solo desde la base de datos.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.error = '';
    this.empresaService.eliminarEmpresa(empresa.id_tenant).subscribe({
      next: () => {
        if (this.expandidoId === empresa.id_tenant) { this.expandidoId = null; this.detalle = null; }
        this.notify.success('Empresa eliminada');
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudo eliminar la empresa';
        this.notify.error(this.error);
      },
    });
  }
}
