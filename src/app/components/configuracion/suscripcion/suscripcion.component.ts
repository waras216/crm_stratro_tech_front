import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlanService } from '../../../core/services/plan.service';
import { SuscripcionService } from '../../../core/services/suscripcion.service';
import { AuthService } from '../../../core/auth/authservices';
import { Plan, Suscripcion } from '../../../models/crm.models';

@Component({
  selector: 'app-suscripcion',
  standalone: false,
  templateUrl: './suscripcion.component.html',
  styleUrls: ['./suscripcion.component.scss'],
})
export class SuscripcionComponent implements OnInit {
  planes: Plan[] = [];
  suscripcion: Suscripcion | null = null;
  cargando = false;
  error = '';
  checkoutResultado: 'success' | 'cancel' | null = null;
  idPlanEnCurso: number | null = null;
  abriendoPortal = false;

  constructor(
    private planService: PlanService,
    private suscripcionService: SuscripcionService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit() {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'success' || checkout === 'cancel') {
      this.checkoutResultado = checkout;
      this.auth.refreshSession().subscribe();
    }

    this.cargar();
  }

  goBack() { this.location.back(); }

  cargar() {
    this.cargando = true;
    this.error = '';

    this.planService.cargarPlanes().subscribe({
      next: planes => { this.planes = planes; this.cargando = false; },
      error: () => { this.cargando = false; },
    });

    this.suscripcionService.obtenerEstado().subscribe({
      next: suscripcion => this.suscripcion = suscripcion,
      error: () => {},
    });
  }

  esPlanActual(plan: Plan): boolean {
    return this.suscripcion?.id_plan === plan.id_plan
      && ['activa', 'periodo_gracia'].includes(this.suscripcion.estado);
  }

  suscribirse(plan: Plan) {
    if (!plan.stripe_price_id) return;
    this.error = '';
    this.idPlanEnCurso = plan.id_plan;
    this.suscripcionService.iniciarCheckout(plan.id_plan).subscribe({
      next: res => { window.location.href = res.url; },
      error: err => {
        this.idPlanEnCurso = null;
        this.error = err?.error?.message || 'No se pudo iniciar el pago';
      },
    });
  }

  gestionarPago() {
    this.error = '';
    this.abriendoPortal = true;
    this.suscripcionService.abrirPortal().subscribe({
      next: res => { window.location.href = res.url; },
      error: err => {
        this.abriendoPortal = false;
        this.error = err?.error?.message || 'No se pudo abrir el portal de pago';
      },
    });
  }

  badgeEstilo(estado: string): { background: string; color: string } {
    switch (estado) {
      case 'activa': return { background: '#f0fdf4', color: '#16a34a' };
      case 'periodo_gracia': return { background: '#fffbeb', color: '#d97706' };
      case 'vencida':
      case 'cancelada': return { background: '#fef2f2', color: '#dc2626' };
      default: return { background: '#f8fafc', color: '#64748b' };
    }
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      activa: 'Activa',
      periodo_gracia: 'Período de gracia',
      vencida: 'Vencida',
      cancelada: 'Cancelada',
      incompleta: 'Incompleta',
    };
    return etiquetas[estado] ?? estado;
  }
}
