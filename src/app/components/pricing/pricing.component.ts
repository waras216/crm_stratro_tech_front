import { Component } from '@angular/core';

@Component({
  selector: 'app-pricing',
  standalone: false,
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
})
export class PricingComponent {
  anual = true;

  planes = [
    {
      id: 'starter',
      nombre: 'Starter',
      desc: 'Para emprendedores y negocios pequeños',
      precioMensual: 29,
      precioAnual: 24,
      color: 'emerald',
      features: [
        'CRM básico',
        'Hasta 3 usuarios',
        '1 sucursal',
        '500 contactos',
        'Soporte por email',
      ],
      destacado: false,
    },
    {
      id: 'pro',
      nombre: 'Pro',
      desc: 'Para equipos en crecimiento',
      precioMensual: 79,
      precioAnual: 65,
      color: 'indigo',
      features: [
        'CRM + POS',
        'Hasta 15 usuarios',
        '5 sucursales',
        'Contactos ilimitados',
        'Automatizaciones',
        'Integraciones',
        'Soporte prioritario',
      ],
      destacado: true,
    },
    {
      id: 'enterprise',
      nombre: 'Enterprise',
      desc: 'Para empresas con operaciones complejas',
      precioMensual: 199,
      precioAnual: 166,
      color: 'purple',
      features: [
        'CRM + POS + ERP completo',
        'Usuarios ilimitados',
        'Sucursales ilimitadas',
        'Fabricación y SCM',
        'RRHH y Nómina',
        'API personalizada',
        'SLA 99.9%',
        'Soporte dedicado 24/7',
      ],
      destacado: false,
    },
  ];

  precio(plan: any): number {
    return this.anual ? plan.precioAnual : plan.precioMensual;
  }
}
