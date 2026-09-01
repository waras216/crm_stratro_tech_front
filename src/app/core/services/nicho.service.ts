import { Injectable } from '@angular/core';
import { AuthService } from '../auth/authservices';

export interface NichoConfig {
  nicho: string;
  nombre: string;
  color: string;
  // CRM labels
  leadLabel: string;
  clienteLabel: string;
  oportunidadLabel: string;
  actividadLabel: string;
  // CRM Dashboard KPI titles
  kpiLeads: string;
  kpiOportunidades: string;
  kpiClientes: string;
  kpiPipeline: string;
  kpiPendientes: string;
  kpiTasa: string;
  // Pipeline stages
  etapas: string[];
  etapaLabels: Record<string, string>;
  // POS labels
  posTerminal: string;
  posHistorial: string;
}

const CONFIGS: Record<string, NichoConfig> = {
  hotel: {
    nicho: 'hotel', nombre: 'Hotel', color: '#f59e0b',
    leadLabel: 'Reservas', clienteLabel: 'Huéspedes', oportunidadLabel: 'Ocupación', actividadLabel: 'Check-ins',
    kpiLeads: 'Consultas', kpiOportunidades: 'Reservas activas', kpiClientes: 'Huéspedes registrados',
    kpiPipeline: 'Revenue proyectado', kpiPendientes: 'Check-ins pendientes', kpiTasa: 'Tasa de ocupación',
    etapas: ['consulta', 'cotizacion', 'reserva_tentativa', 'confirmada', 'check_in'],
    etapaLabels: { consulta: 'Consulta', cotizacion: 'Cotización', reserva_tentativa: 'Tentativa', confirmada: 'Confirmada', check_in: 'Check-in' },
    posTerminal: 'Room Service', posHistorial: 'Historial de Consumos',
  },

  restaurante: {
    nicho: 'restaurante', nombre: 'Restaurante', color: '#ef4444',
    leadLabel: 'Pedidos', clienteLabel: 'Comensales', oportunidadLabel: 'Mesas', actividadLabel: 'Órdenes',
    kpiLeads: 'Pedidos hoy', kpiOportunidades: 'Mesas activas', kpiClientes: 'Comensales atendidos',
    kpiPipeline: 'Venta del día', kpiPendientes: 'Órdenes pendientes', kpiTasa: 'Satisfacción promedio',
    etapas: ['pendiente', 'preparando', 'listo', 'entregado', 'pagado'],
    etapaLabels: { pendiente: 'Pendiente', preparando: 'Preparando', listo: 'Listo', entregado: 'Entregado', pagado: 'Pagado' },
    posTerminal: 'Comandas', posHistorial: 'Historial de Ventas',
  },

  almacen: {
    nicho: 'almacen', nombre: 'Almacén', color: '#3b82f6',
    leadLabel: 'Cotizaciones', clienteLabel: 'Distribuidores', oportunidadLabel: 'Pedidos', actividadLabel: 'Despachos',
    kpiLeads: 'Cotizaciones activas', kpiOportunidades: 'Pedidos en proceso', kpiClientes: 'Distribuidores activos',
    kpiPipeline: 'Valor en órdenes', kpiPendientes: 'Despachos pendientes', kpiTasa: 'Tasa de entrega a tiempo',
    etapas: ['prospeccion', 'cotizacion', 'orden_compra', 'despacho', 'entregado'],
    etapaLabels: { prospeccion: 'Prospección', cotizacion: 'Cotización', orden_compra: 'Orden de Compra', despacho: 'En Despacho', entregado: 'Entregado' },
    posTerminal: 'Mostrador', posHistorial: 'Historial de Ventas',
  },

  farmacia: {
    nicho: 'farmacia', nombre: 'Farmacia', color: '#10b981',
    leadLabel: 'Pacientes', clienteLabel: 'Pacientes', oportunidadLabel: 'Recetas', actividadLabel: 'Consultas',
    kpiLeads: 'Pacientes atendidos hoy', kpiOportunidades: 'Recetas activas', kpiClientes: 'Pacientes registrados',
    kpiPipeline: 'Ventas del día', kpiPendientes: 'Recetas pendientes', kpiTasa: 'Tasa de dispensación',
    etapas: ['ingreso', 'revision_receta', 'preparacion', 'listo', 'entregado'],
    etapaLabels: { ingreso: 'Ingreso', revision_receta: 'Revisión', preparacion: 'Preparación', listo: 'Listo', entregado: 'Entregado' },
    posTerminal: 'Dispensario', posHistorial: 'Historial de Ventas',
  },

  startup: {
    nicho: 'startup', nombre: 'Startup', color: '#8b5cf6',
    leadLabel: 'Leads', clienteLabel: 'Usuarios', oportunidadLabel: 'Deals', actividadLabel: 'Tareas',
    kpiLeads: 'Leads en pipeline', kpiOportunidades: 'Deals activos', kpiClientes: 'Usuarios activos',
    kpiPipeline: 'MRR', kpiPendientes: 'Tareas pendientes', kpiTasa: 'Tasa de conversión',
    etapas: ['prospecto', 'contactado', 'demo', 'propuesta', 'cerrado'],
    etapaLabels: { prospecto: 'Prospecto', contactado: 'Contactado', demo: 'Demo', propuesta: 'Propuesta', cerrado: 'Cerrado' },
    posTerminal: 'Terminal POS', posHistorial: 'Historial',
  },

  tienda: {
    nicho: 'tienda', nombre: 'Tienda', color: '#ec4899',
    leadLabel: 'Prospectos', clienteLabel: 'Compradores', oportunidadLabel: 'Ventas', actividadLabel: 'Pedidos',
    kpiLeads: 'Visitas hoy', kpiOportunidades: 'Ventas del día', kpiClientes: 'Clientes frecuentes',
    kpiPipeline: 'Ingresos del día', kpiPendientes: 'Pedidos pendientes', kpiTasa: 'Tasa de conversión',
    etapas: ['visitante', 'interesado', 'carrito', 'pago', 'fidelizado'],
    etapaLabels: { visitante: 'Visitante', interesado: 'Interesado', carrito: 'En Carrito', pago: 'Pago', fidelizado: 'Fidelizado' },
    posTerminal: 'Caja', posHistorial: 'Historial de Ventas',
  },
};

// Etiquetas legibles para los ids que captura el wizard de onboarding
// (`onboarding.component.ts`) en los campos de selección múltiple por nicho.
export const HOTEL_AMENIDADES_LABELS: Record<string, string> = {
  restaurante: 'Restaurante propio', bar: 'Bar / Lounge', spa: 'Spa & Wellness',
  piscina: 'Piscina', estacionamiento: 'Estacionamiento', eventos: 'Sala de eventos',
};

// Nombre de la categoría de Inventario que se auto-crea (OnboardingService::AMENIDAD_CATEGORIAS
// en el backend, debe coincidir) por cada amenidad marcada en el onboarding.
export const HOTEL_AMENIDAD_CATEGORIAS: Record<string, string> = {
  restaurante: 'Restaurante', bar: 'Bar', spa: 'Spa',
  piscina: 'Piscina', estacionamiento: 'Estacionamiento', eventos: 'Eventos',
};

export const REST_CANALES_LABELS: Record<string, string> = {
  comedor: 'Comedor / Mesas', delivery_propio: 'Delivery propio', delivery_apps: 'Apps de delivery',
  llevar: 'Para llevar', catering: 'Catering / Eventos',
};

export const FARM_ATENCION_LABELS: Record<string, string> = {
  mostrador: 'Solo mostrador', delivery: 'Delivery a domicilio', consultas: 'Consultas con farmacéutico',
  recetas: 'Gestión de recetas médicas',
};

export const ALMACEN_OPS_LABELS: Record<string, string> = {
  recepcion: 'Recepción de mercancía', picking: 'Picking & Packing', despacho: 'Despacho / Entrega',
  calidad: 'Control de calidad', crossdocking: 'Cross-docking',
};

export const TIENDA_CANALES_LABELS: Record<string, string> = {
  fisica: 'Tienda física', ecommerce: 'E-commerce', whatsapp: 'WhatsApp / Redes',
  delivery: 'Delivery a domicilio', mayoreo: 'Venta por mayoreo',
};

export const FARM_ESPECIALIDADES_LABELS: Record<string, string> = {
  genericos: 'Medicamentos generales', controlados: 'Recetados / Controlados', dermocosmetica: 'Dermocosmética',
  suplementos: 'Suplementos & Vitaminas', veterinaria: 'Veterinaria', homeopaticos: 'Homeopáticos',
};

export const STARTUP_METRICAS_LABELS: Record<string, string> = {
  mrr: 'MRR / ARR', pipeline: 'Leads & Pipeline de ventas', cac: 'CAC / LTV',
  churn: 'Churn Rate', nps: 'NPS & Satisfacción', usuarios: 'Usuarios activos',
};

const DEFAULT_CONFIG: NichoConfig = {
  nicho: '', nombre: 'Mi Empresa', color: '#6366f1',
  leadLabel: 'Leads', clienteLabel: 'Clientes', oportunidadLabel: 'Oportunidades', actividadLabel: 'Actividades',
  kpiLeads: 'Total Leads', kpiOportunidades: 'Oportunidades', kpiClientes: 'Clientes',
  kpiPipeline: 'Valor Pipeline', kpiPendientes: 'Actividades Pendientes', kpiTasa: 'Tasa de Cierre',
  etapas: ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre'],
  etapaLabels: { prospeccion: 'Prospección', contacto: 'Contacto', propuesta: 'Propuesta', negociacion: 'Negociación', cierre: 'Cierre' },
  posTerminal: 'Terminal', posHistorial: 'Historial',
};

@Injectable({ providedIn: 'root' })
export class NichoService {
  constructor(private auth: AuthService) {}

  get config(): NichoConfig {
    const nicho = this.auth.session?.nichoData?.nicho || '';
    return CONFIGS[nicho] || DEFAULT_CONFIG;
  }

  get nicho(): string { return this.config.nicho; }
  get modulos() { return this.auth.session?.nichoData?.modulos || { crm: true, pos: false, erp: false }; }

  get hotelTiposHabitacion(): string[] {
    const configurados = this.auth.session?.nichoData?.hotelTiposHabitacion;
    return configurados && configurados.length > 0 ? configurados : ['Individual', 'Doble', 'Suite'];
  }

  get hotelTipo(): string { return this.auth.session?.nichoData?.hotelTipo || ''; }

  get hotelAmenidades(): string[] { return this.auth.session?.nichoData?.hotelAmenidades || []; }

  get restTipo(): string { return this.auth.session?.nichoData?.restTipo || ''; }

  get restCanales(): string[] {
    const configurados = this.auth.session?.nichoData?.restCanales;
    return configurados && configurados.length > 0 ? configurados : ['comedor'];
  }

  get farmAtencion(): string[] {
    const configurados = this.auth.session?.nichoData?.farmAtencion;
    return configurados && configurados.length > 0 ? configurados : ['mostrador'];
  }

  get almacenOps(): string[] { return this.auth.session?.nichoData?.almacenOps || []; }

  get tiendaCanales(): string[] {
    const configurados = this.auth.session?.nichoData?.tiendaCanales;
    return configurados && configurados.length > 0 ? configurados : ['fisica'];
  }
}
