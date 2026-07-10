import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { PlanService } from '../../../core/services/plan.service';
import { Plan } from '../../../models/crm.models';

@Component({
  selector: 'app-planes',
  standalone: false,
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.scss'],
})
export class PlanesComponent implements OnInit {
  planes: Plan[] = [];
  cargando = false;
  error = '';

  editandoId: number | null = null;
  guardando = false;
  form: { nombre_plan: string; precio: number | null; max_usuarios: number | null; fecha_inicio: string; fecha_fin: string } =
    this.formVacio();

  constructor(private planService: PlanService, private location: Location) {}

  ngOnInit() {
    this.cargarPlanes();
  }

  goBack() { this.location.back(); }

  private formVacio() {
    return { nombre_plan: '', precio: null, max_usuarios: null, fecha_inicio: '', fecha_fin: '' };
  }

  cargarPlanes() {
    this.cargando = true;
    this.planService.cargarPlanes().subscribe({
      next: planes => { this.planes = planes; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  editar(plan: Plan) {
    this.editandoId = plan.id_plan;
    this.form = {
      nombre_plan: plan.nombre_plan,
      precio: plan.precio,
      max_usuarios: plan.max_usuarios,
      fecha_inicio: plan.fecha_inicio?.slice(0, 10),
      fecha_fin: plan.fecha_fin?.slice(0, 10),
    };
  }

  cancelar() {
    this.editandoId = null;
    this.form = this.formVacio();
  }

  guardar() {
    if (!this.form.nombre_plan || this.form.precio === null || !this.form.fecha_inicio || !this.form.fecha_fin) return;
    this.error = '';
    this.guardando = true;
    const payload: Partial<Plan> = { ...this.form, precio: this.form.precio! };
    const obs = this.editandoId
      ? this.planService.actualizarPlan(this.editandoId, payload)
      : this.planService.crearPlan(payload);

    obs.subscribe({
      next: () => { this.guardando = false; this.cancelar(); },
      error: err => { this.guardando = false; this.error = err?.error?.message || 'No se pudo guardar el plan'; },
    });
  }

  eliminar(plan: Plan) {
    if (!confirm(`¿Eliminar el plan "${plan.nombre_plan}"?`)) return;
    this.error = '';
    this.planService.eliminarPlan(plan.id_plan).subscribe({
      error: err => { this.error = err?.error?.message || 'No se pudo eliminar el plan'; },
    });
  }
}
