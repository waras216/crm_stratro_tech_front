import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/authservices';
import { NichoData } from '../../../core/auth/authservices';

interface Nicho {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  colorBg: string;
  colorAccent: string;
  modulos: { crm: boolean; pos: boolean; erp: boolean };
  moduloDesc: { crm: string; pos: string; erp: string };
}

@Component({
  selector: 'app-auth-onboarding',
  standalone: false,
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class AuthOnboardingComponent {
  step = 0;
  totalSteps = 5; // 0=nicho, 1=empresa, 2=tipo, 3=servicios, 4=modulos
  showWelcome = false;
  logoPreview: string | null = null;

  // Empresa
  empresa = '';
  nichoSeleccionado: Nicho | null = null;

  // Config general
  moneda = 'MXN';
  monedas = ['MXN', 'USD', 'EUR', 'COP', 'ARS'];

  // --- Hotel ---
  hotelTipo = '';
  hotelHabitaciones = '';
  hotelAmenidades: string[] = [];
  hotelTipos = ['Boutique', 'Resort', 'Business / Corporativo', 'Hostal / Hostel'];
  hotelCapacidades = ['1-10 habitaciones', '11-30 habitaciones', '31-100 habitaciones', '100+ habitaciones'];
  hotelAmenidadesOpciones = [
    { id: 'restaurante', label: 'Restaurante propio', icon: '🍽️' },
    { id: 'bar', label: 'Bar / Lounge', icon: '🍸' },
    { id: 'spa', label: 'Spa & Wellness', icon: '💆' },
    { id: 'piscina', label: 'Piscina', icon: '🏊' },
    { id: 'estacionamiento', label: 'Estacionamiento', icon: '🅿️' },
    { id: 'eventos', label: 'Sala de eventos', icon: '🎪' },
  ];

  // --- Restaurante ---
  restTipo = '';
  restMesas = '';
  restCanales: string[] = [];
  restTipos = ['Fast Food / Comida rápida', 'Casual / Familiar', 'Fine Dining', 'Cafetería / Bakery', 'Dark Kitchen'];
  restCapacidades = ['1-5 mesas', '6-20 mesas', '21-50 mesas', '50+ mesas'];
  restCanalesOpciones = [
    { id: 'comedor', label: 'Comedor / Mesas' },
    { id: 'delivery_propio', label: 'Delivery propio' },
    { id: 'delivery_apps', label: 'Apps de delivery (Rappi, UberEats...)' },
    { id: 'llevar', label: 'Para llevar / Take out' },
    { id: 'catering', label: 'Catering / Eventos' },
  ];

  // --- Almacén ---
  almacenTipo = '';
  almacenSkus = '';
  almacenOps: string[] = [];
  almacenTipos = ['Materias primas', 'Productos terminados', 'Distribución / Mayorista', 'Logística 3PL'];
  almacenCapacidades = ['Menos de 100 SKUs', '100 - 500 SKUs', '500 - 2,000 SKUs', '2,000+ SKUs'];
  almacenOpsOpciones = [
    { id: 'recepcion', label: 'Recepción de mercancía' },
    { id: 'picking', label: 'Picking & Packing' },
    { id: 'despacho', label: 'Despacho / Entrega' },
    { id: 'calidad', label: 'Control de calidad' },
    { id: 'crossdocking', label: 'Cross-docking' },
  ];

  // --- Farmacia ---
  farmTipo = '';
  farmAtencion: string[] = [];
  farmEspecialidades: string[] = [];
  farmTipos = ['Farmacia independiente', 'Cadena de farmacias', 'Farmacia hospitalaria', 'Farmacia magistral'];
  farmAtencionOpciones = [
    { id: 'mostrador', label: 'Solo mostrador / tienda' },
    { id: 'delivery', label: 'Delivery a domicilio' },
    { id: 'consultas', label: 'Consultas con farmacéutico' },
    { id: 'recetas', label: 'Gestión de recetas médicas' },
  ];
  farmEspecialidadesOpciones = [
    { id: 'genericos', label: 'Medicamentos generales' },
    { id: 'controlados', label: 'Recetados / Controlados' },
    { id: 'dermocosmetica', label: 'Dermocosmética' },
    { id: 'suplementos', label: 'Suplementos & Vitaminas' },
    { id: 'veterinaria', label: 'Veterinaria' },
    { id: 'homeopaticos', label: 'Homeopáticos' },
  ];

  // --- Tienda ---
  tiendaTipo = '';
  tiendaCanales: string[] = [];
  tiendaTipos = ['Ropa & Moda', 'Electrónica & Tecnología', 'Abarrotes / Minisuper', 'Papelería / Librería', 'Ferretería / Materiales', 'Boutique / Accesorios'];
  tiendaCanalesOpciones = [
    { id: 'fisica', label: 'Tienda física / mostrador' },
    { id: 'ecommerce', label: 'Tienda en línea / e-commerce' },
    { id: 'whatsapp', label: 'WhatsApp / Redes sociales' },
    { id: 'delivery', label: 'Delivery a domicilio' },
    { id: 'mayoreo', label: 'Venta por mayoreo' },
  ];

  // --- Startup ---
  startupEtapa = '';
  startupModelo = '';
  startupMetricas: string[] = [];
  startupEtapas = ['Idea / Pre-seed', 'MVP / Seed', 'Product-Market Fit', 'Crecimiento / Serie A+'];
  startupModelos = ['SaaS / Software', 'Marketplace', 'E-commerce', 'B2B Services', 'D2C / DTC'];
  startupMetricasOpciones = [
    { id: 'mrr', label: 'MRR / ARR' },
    { id: 'pipeline', label: 'Leads & Pipeline de ventas' },
    { id: 'cac', label: 'CAC / LTV' },
    { id: 'churn', label: 'Churn Rate' },
    { id: 'nps', label: 'NPS & Satisfacción' },
    { id: 'usuarios', label: 'Usuarios activos' },
  ];

  // Módulos
  modulos = { crm: true, pos: false, erp: false };

  nichos: Nicho[] = [
    {
      id: 'hotel', nombre: 'Hotel', descripcion: 'Hospedaje, reservas y room service',
      color: '#f59e0b', colorBg: 'rgba(245,158,11,.12)', colorAccent: 'rgba(245,158,11,.25)',
      modulos: { crm: true, pos: true, erp: true },
      moduloDesc: { crm: 'Huéspedes, reservas y fidelización', pos: 'Room service, restaurante y minibar', erp: 'Inventario de suministros y habitaciones' }
    },
    {
      id: 'restaurante', nombre: 'Restaurante', descripcion: 'Mesas, comandas y delivery',
      color: '#ef4444', colorBg: 'rgba(239,68,68,.12)', colorAccent: 'rgba(239,68,68,.25)',
      modulos: { crm: false, pos: true, erp: true },
      moduloDesc: { crm: 'Fidelización de clientes y reservas', pos: 'Mesas, comandas y punto de caja', erp: 'Inventario de cocina y compras' }
    },
    {
      id: 'almacen', nombre: 'Almacén / Bodega', descripcion: 'Stock, compras y distribución',
      color: '#3b82f6', colorBg: 'rgba(59,130,246,.12)', colorAccent: 'rgba(59,130,246,.25)',
      modulos: { crm: true, pos: false, erp: true },
      moduloDesc: { crm: 'Clientes mayoristas y seguimiento', pos: 'Mostrador y ventas directas', erp: 'Inventario, compras y logística' }
    },
    {
      id: 'farmacia', nombre: 'Farmacia', descripcion: 'Medicamentos, recetas y pacientes',
      color: '#10b981', colorBg: 'rgba(16,185,129,.12)', colorAccent: 'rgba(16,185,129,.25)',
      modulos: { crm: true, pos: true, erp: true },
      moduloDesc: { crm: 'Pacientes, historial y recordatorios', pos: 'Ventas con recetas y medicamentos', erp: 'Inventario con lotes y caducidades' }
    },
    {
      id: 'startup', nombre: 'Startup', descripcion: 'Leads, pipeline y crecimiento rápido',
      color: '#8b5cf6', colorBg: 'rgba(139,92,246,.12)', colorAccent: 'rgba(139,92,246,.25)',
      modulos: { crm: true, pos: false, erp: false },
      moduloDesc: { crm: 'Pipeline de ventas, leads y automatizaciones', pos: 'Punto de venta físico o kiosko', erp: 'Finanzas, inventario y operaciones' }
    },
    {
      id: 'tienda', nombre: 'Tienda / Retail', descripcion: 'Ventas, inventario y clientes frecuentes',
      color: '#ec4899', colorBg: 'rgba(236,72,153,.12)', colorAccent: 'rgba(236,72,153,.25)',
      modulos: { crm: true, pos: true, erp: true },
      moduloDesc: { crm: 'Clientes frecuentes, puntos y fidelización', pos: 'Caja, ventas y tickets de compra', erp: 'Inventario, compras y control de stock' }
    },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  selectNicho(nicho: Nicho) {
    this.nichoSeleccionado = nicho;
    this.modulos = { ...nicho.modulos };
  }

  toggleLista(lista: string[], valor: string) {
    const idx = lista.indexOf(valor);
    if (idx >= 0) lista.splice(idx, 1);
    else lista.push(valor);
  }

  enLista(lista: string[], valor: string) { return lista.includes(valor); }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => this.logoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  canNext(): boolean {
    if (this.step === 0) return !!this.nichoSeleccionado;
    if (this.step === 1) return !!this.empresa.trim();
    return true;
  }

  next() {
    if (!this.canNext()) return;
    if (this.step < 4) this.step++;
    else this.finish();
  }

  prev() { if (this.step > 0) this.step--; }

  finish() {
    if (this.logoPreview) this.auth.setLogo(this.logoPreview);
    const nichoData: NichoData = {
      nicho: this.nichoSeleccionado?.id || '',
      moneda: this.moneda,
      modulos: { ...this.modulos },
      hotelTipo: this.hotelTipo, hotelHabitaciones: this.hotelHabitaciones, hotelAmenidades: [...this.hotelAmenidades],
      restTipo: this.restTipo, restMesas: this.restMesas, restCanales: [...this.restCanales],
      almacenTipo: this.almacenTipo, almacenSkus: this.almacenSkus, almacenOps: [...this.almacenOps],
      farmTipo: this.farmTipo, farmAtencion: [...this.farmAtencion], farmEspecialidades: [...this.farmEspecialidades],
      startupEtapa: this.startupEtapa, startupModelo: this.startupModelo, startupMetricas: [...this.startupMetricas],
      tiendaTipo: this.tiendaTipo, tiendaCanales: [...this.tiendaCanales],
    };
    this.auth.completarOnboarding({ empresa: this.empresa, nichoData });
    this.showWelcome = true;
  }

  goToDashboard() { this.router.navigate(['/crm/dashboard']); }

  nichoIsSelected(nicho: Nicho) { return this.nichoSeleccionado?.id === nicho.id; }

  get nichoColor() { return this.nichoSeleccionado?.color || '#6366f1'; }
  get nichoBg() { return this.nichoSeleccionado?.colorBg || 'rgba(99,102,241,.12)'; }
  get nichoAccent() { return this.nichoSeleccionado?.colorAccent || 'rgba(99,102,241,.25)'; }

  get step2Titulo(): string {
    const m: Record<string, string> = {
      hotel: 'Tu Propiedad', restaurante: 'Tu Restaurante',
      almacen: 'Tu Almacén', farmacia: 'Tu Farmacia',
      startup: 'Tu Startup', tienda: 'Tu Tienda'
    };
    return m[this.nichoSeleccionado?.id || ''] || 'Tu Negocio';
  }

  get step3Titulo(): string {
    const m: Record<string, string> = {
      hotel: 'Servicios del hotel', restaurante: 'Canales de venta',
      almacen: 'Operaciones', farmacia: 'Especialidades',
      startup: 'Métricas clave', tienda: 'Canales de venta'
    };
    return m[this.nichoSeleccionado?.id || ''] || 'Servicios';
  }
}
