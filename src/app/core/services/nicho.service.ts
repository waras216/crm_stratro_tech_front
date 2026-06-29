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
  // ERP modules priority
  erpModulos: Array<{ titulo: string; subtitulo: string; emoji: string; bg: string; stat: string; statColor: string; extra: string }>;
  erpKpis: Array<{ value: string; label: string; bg: string; color: string; svg: string }>;
  erpActividad: Array<{ texto: string; dot: string; tiempo: string }>;
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
    erpKpis: [
      { value: '$84,200', label: 'Ingresos del Mes',      bg: 'bg-amber-100',  color: 'text-amber-600',  svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { value: '28',      label: 'Habitaciones ocupadas', bg: 'bg-blue-100',   color: 'text-blue-600',   svg: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
      { value: '92%',     label: 'Tasa de ocupación',     bg: 'bg-emerald-100',color: 'text-emerald-600',svg: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>' },
      { value: '14',      label: 'Reservas pendientes',   bg: 'bg-purple-100', color: 'text-purple-600', svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
    ],
    erpModulos: [
      { titulo: 'Habitaciones', subtitulo: 'Ocupación y disponibilidad', emoji: '🛏️', bg: 'bg-amber-100', stat: '28/35 ocupadas', statColor: 'text-amber-600', extra: 'RevPAR $2,400' },
      { titulo: 'Reservas', subtitulo: 'Bookings y cancelaciones', emoji: '📅', bg: 'bg-blue-100', stat: '14 reservas entrantes', statColor: 'text-blue-600', extra: '3 cancelaciones hoy' },
      { titulo: 'Inventario Hotelero', subtitulo: 'Amenidades y suministros', emoji: '📦', bg: 'bg-indigo-100', stat: '5 alertas stock', statColor: 'text-red-500', extra: '3 almacenes' },
      { titulo: 'Room Service', subtitulo: 'Pedidos y consumos', emoji: '🍽️', bg: 'bg-orange-100', stat: '18 pedidos hoy', statColor: 'text-orange-600', extra: '$3,200 facturado' },
      { titulo: 'Mantenimiento', subtitulo: 'Solicitudes y preventivo', emoji: '🔧', bg: 'bg-slate-100', stat: '4 solicitudes abiertas', statColor: 'text-slate-600', extra: '2 preventivos esta semana' },
      { titulo: 'Finanzas', subtitulo: 'Facturación y tesorería', emoji: '💰', bg: 'bg-emerald-100', stat: '+8% vs mes anterior', statColor: 'text-emerald-600', extra: '6 facturas pendientes' },
    ],
    erpActividad: [
      { texto: 'Check-in completado: Habitación 204 - Sr. García', dot: 'bg-emerald-400', tiempo: 'Hace 5 min' },
      { texto: 'Room service pedido #89 - Hab. 312', dot: 'bg-amber-400', tiempo: 'Hace 15 min' },
      { texto: 'Stock bajo: Amenidades baño (8 unidades)', dot: 'bg-red-400', tiempo: 'Hace 1h' },
      { texto: 'Reserva confirmada para 28/06 - 3 noches', dot: 'bg-blue-400', tiempo: 'Hace 2h' },
    ],
  },

  restaurante: {
    nicho: 'restaurante', nombre: 'Restaurante', color: '#ef4444',
    leadLabel: 'Pedidos', clienteLabel: 'Comensales', oportunidadLabel: 'Mesas', actividadLabel: 'Órdenes',
    kpiLeads: 'Pedidos hoy', kpiOportunidades: 'Mesas activas', kpiClientes: 'Comensales atendidos',
    kpiPipeline: 'Venta del día', kpiPendientes: 'Órdenes pendientes', kpiTasa: 'Satisfacción promedio',
    etapas: ['pendiente', 'preparando', 'listo', 'entregado', 'pagado'],
    etapaLabels: { pendiente: 'Pendiente', preparando: 'Preparando', listo: 'Listo', entregado: 'Entregado', pagado: 'Pagado' },
    posTerminal: 'Comandas', posHistorial: 'Historial de Ventas',
    erpKpis: [
      { value: '$12,800', label: 'Venta del día',   bg: 'bg-red-100',    color: 'text-red-600',    svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { value: '42',      label: 'Pedidos hoy',     bg: 'bg-amber-100',  color: 'text-amber-600',  svg: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>' },
      { value: '$305',    label: 'Ticket promedio', bg: 'bg-emerald-100', color: 'text-emerald-600',svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>' },
      { value: '8',       label: 'Mesas ocupadas',  bg: 'bg-blue-100',   color: 'text-blue-600',   svg: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
    ],
    erpModulos: [
      { titulo: 'Comandas', subtitulo: 'Pedidos por mesa y delivery', emoji: '🍽️', bg: 'bg-red-100', stat: '8 comandas abiertas', statColor: 'text-red-600', extra: '3 para delivery' },
      { titulo: 'Inventario Cocina', subtitulo: 'Ingredientes y stock', emoji: '📦', bg: 'bg-amber-100', stat: '3 ingredientes críticos', statColor: 'text-red-500', extra: '42 productos' },
      { titulo: 'Compras', subtitulo: 'Proveedores e insumos', emoji: '🛒', bg: 'bg-blue-100', stat: '5 órdenes esta semana', statColor: 'text-blue-600', extra: '8 proveedores' },
      { titulo: 'Mesas', subtitulo: 'Distribución del salón', emoji: '🪑', bg: 'bg-indigo-100', stat: '8/14 ocupadas', statColor: 'text-indigo-600', extra: '2 reservas para hoy' },
      { titulo: 'Finanzas', subtitulo: 'Caja y facturación', emoji: '💰', bg: 'bg-emerald-100', stat: '$12,800 hoy', statColor: 'text-emerald-600', extra: 'Cierre de caja 23:00' },
      { titulo: 'Recursos Humanos', subtitulo: 'Personal de cocina y salón', emoji: '👥', bg: 'bg-purple-100', stat: '12 empleados activos', statColor: 'text-purple-600', extra: 'Turno noche: 6 personas' },
    ],
    erpActividad: [
      { texto: 'Comanda #89 lista para mesa 7', dot: 'bg-emerald-400', tiempo: 'Hace 2 min' },
      { texto: 'Delivery #12 salió a las 20:45', dot: 'bg-blue-400', tiempo: 'Hace 10 min' },
      { texto: 'Stock bajo: Pollo (2 kg restantes)', dot: 'bg-red-400', tiempo: 'Hace 30 min' },
      { texto: 'Mesa 4 solicitó la cuenta - $1,240', dot: 'bg-amber-400', tiempo: 'Hace 45 min' },
    ],
  },

  almacen: {
    nicho: 'almacen', nombre: 'Almacén', color: '#3b82f6',
    leadLabel: 'Cotizaciones', clienteLabel: 'Distribuidores', oportunidadLabel: 'Pedidos', actividadLabel: 'Despachos',
    kpiLeads: 'Cotizaciones activas', kpiOportunidades: 'Pedidos en proceso', kpiClientes: 'Distribuidores activos',
    kpiPipeline: 'Valor en órdenes', kpiPendientes: 'Despachos pendientes', kpiTasa: 'Tasa de entrega a tiempo',
    etapas: ['prospeccion', 'cotizacion', 'orden_compra', 'despacho', 'entregado'],
    etapaLabels: { prospeccion: 'Prospección', cotizacion: 'Cotización', orden_compra: 'Orden de Compra', despacho: 'En Despacho', entregado: 'Entregado' },
    posTerminal: 'Mostrador', posHistorial: 'Historial de Ventas',
    erpKpis: [
      { value: '2,450',  label: 'SKUs en inventario', bg: 'bg-blue-100',   color: 'text-blue-600',   svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
      { value: '38',     label: 'Pedidos activos',    bg: 'bg-amber-100',  color: 'text-amber-600',  svg: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>' },
      { value: '12',     label: 'Despachos hoy',      bg: 'bg-emerald-100',color: 'text-emerald-600',svg: '<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
      { value: '$580K',  label: 'Valor en stock',     bg: 'bg-purple-100', color: 'text-purple-600', svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    ],
    erpModulos: [
      { titulo: 'Inventario', subtitulo: 'SKUs, lotes y ubicaciones', emoji: '📦', bg: 'bg-blue-100', stat: '7 alertas stock bajo', statColor: 'text-red-500', extra: '2,450 SKUs activos' },
      { titulo: 'Recepción', subtitulo: 'Entradas y verificación', emoji: '📥', bg: 'bg-indigo-100', stat: '3 recepciones hoy', statColor: 'text-indigo-600', extra: 'Última: hace 2h' },
      { titulo: 'Despacho', subtitulo: 'Órdenes y envíos', emoji: '🚚', bg: 'bg-teal-100', stat: '12 despachos hoy', statColor: 'text-teal-600', extra: '95% a tiempo' },
      { titulo: 'Compras', subtitulo: 'Proveedores y órdenes', emoji: '🛒', bg: 'bg-amber-100', stat: '8 órdenes pendientes', statColor: 'text-amber-600', extra: '15 proveedores activos' },
      { titulo: 'Control de Calidad', subtitulo: 'Inspección y rechazos', emoji: '✅', bg: 'bg-emerald-100', stat: '98.5% aprobado', statColor: 'text-emerald-600', extra: '2 rechazos esta semana' },
      { titulo: 'Finanzas', subtitulo: 'Facturación y cuentas', emoji: '💰', bg: 'bg-emerald-100', stat: '$580K en órdenes', statColor: 'text-emerald-600', extra: '5 facturas por cobrar' },
    ],
    erpActividad: [
      { texto: 'Despacho #421 salió a ruta - Distribuidor Norte', dot: 'bg-emerald-400', tiempo: 'Hace 5 min' },
      { texto: 'Recepción completada: 200 unidades SKU-4421', dot: 'bg-blue-400', tiempo: 'Hace 45 min' },
      { texto: 'Alerta: Stock mínimo en SKU-0089 (3 unidades)', dot: 'bg-red-400', tiempo: 'Hace 1h' },
      { texto: 'Orden de compra #1045 aprobada', dot: 'bg-amber-400', tiempo: 'Hace 2h' },
    ],
  },

  farmacia: {
    nicho: 'farmacia', nombre: 'Farmacia', color: '#10b981',
    leadLabel: 'Pacientes', clienteLabel: 'Pacientes', oportunidadLabel: 'Recetas', actividadLabel: 'Consultas',
    kpiLeads: 'Pacientes atendidos hoy', kpiOportunidades: 'Recetas activas', kpiClientes: 'Pacientes registrados',
    kpiPipeline: 'Ventas del día', kpiPendientes: 'Recetas pendientes', kpiTasa: 'Tasa de dispensación',
    etapas: ['ingreso', 'revision_receta', 'preparacion', 'listo', 'entregado'],
    etapaLabels: { ingreso: 'Ingreso', revision_receta: 'Revisión', preparacion: 'Preparación', listo: 'Listo', entregado: 'Entregado' },
    posTerminal: 'Dispensario', posHistorial: 'Historial de Ventas',
    erpKpis: [
      { value: '$8,400', label: 'Ventas del día',           bg: 'bg-emerald-100',color: 'text-emerald-600',svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { value: '124',    label: 'Pacientes atendidos',      bg: 'bg-blue-100',   color: 'text-blue-600',   svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
      { value: '18',     label: 'Recetas pendientes',       bg: 'bg-amber-100',  color: 'text-amber-600',  svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/><line x1="12" y1="9" x2="12" y2="9"/>' },
      { value: '5',      label: 'Medicamentos por vencer',  bg: 'bg-red-100',    color: 'text-red-600',    svg: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    ],
    erpModulos: [
      { titulo: 'Inventario Farmacéutico', subtitulo: 'Medicamentos, lotes y caducidad', emoji: '💊', bg: 'bg-emerald-100', stat: '5 próximos a vencer', statColor: 'text-red-500', extra: '1,240 productos' },
      { titulo: 'Recetas', subtitulo: 'Control y dispensación', emoji: '📋', bg: 'bg-blue-100', stat: '18 recetas pendientes', statColor: 'text-blue-600', extra: '6 controlados' },
      { titulo: 'Pacientes', subtitulo: 'Historial y seguimiento', emoji: '👥', bg: 'bg-indigo-100', stat: '324 registrados', statColor: 'text-indigo-600', extra: '12 nuevos este mes' },
      { titulo: 'Compras', subtitulo: 'Proveedores y laboratorios', emoji: '🛒', bg: 'bg-amber-100', stat: '4 órdenes pendientes', statColor: 'text-amber-600', extra: '8 laboratorios' },
      { titulo: 'Finanzas', subtitulo: 'Caja y facturación', emoji: '💰', bg: 'bg-teal-100', stat: '$8,400 hoy', statColor: 'text-teal-600', extra: '3 facturas a seguros' },
      { titulo: 'Alertas', subtitulo: 'Caducidades y stock mínimo', emoji: '⚠️', bg: 'bg-red-100', stat: '5 alertas activas', statColor: 'text-red-500', extra: 'Revisar lote 2024-Q4' },
    ],
    erpActividad: [
      { texto: 'Receta #218 dispensada - Amoxicilina 500mg', dot: 'bg-emerald-400', tiempo: 'Hace 3 min' },
      { texto: 'Nuevo paciente registrado: María López', dot: 'bg-blue-400', tiempo: 'Hace 20 min' },
      { texto: 'Alerta: Paracetamol 500mg - stock crítico (10 cajas)', dot: 'bg-red-400', tiempo: 'Hace 1h' },
      { texto: 'Orden a Laboratorio Roche confirmada', dot: 'bg-amber-400', tiempo: 'Hace 2h' },
    ],
  },

  startup: {
    nicho: 'startup', nombre: 'Startup', color: '#8b5cf6',
    leadLabel: 'Leads', clienteLabel: 'Usuarios', oportunidadLabel: 'Deals', actividadLabel: 'Tareas',
    kpiLeads: 'Leads en pipeline', kpiOportunidades: 'Deals activos', kpiClientes: 'Usuarios activos',
    kpiPipeline: 'MRR', kpiPendientes: 'Tareas pendientes', kpiTasa: 'Tasa de conversión',
    etapas: ['prospecto', 'contactado', 'demo', 'propuesta', 'cerrado'],
    etapaLabels: { prospecto: 'Prospecto', contactado: 'Contactado', demo: 'Demo', propuesta: 'Propuesta', cerrado: 'Cerrado' },
    posTerminal: 'Terminal POS', posHistorial: 'Historial',
    erpKpis: [
      { value: '$12,400', label: 'MRR',            bg: 'bg-purple-100', color: 'text-purple-600', svg: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
      { value: '284',     label: 'Usuarios activos',bg: 'bg-blue-100',  color: 'text-blue-600',   svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
      { value: '3.2%',    label: 'Churn Rate',     bg: 'bg-red-100',   color: 'text-red-600',    svg: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>' },
      { value: '68',      label: 'NPS Score',       bg: 'bg-emerald-100',color:'text-emerald-600',svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    ],
    erpModulos: [
      { titulo: 'MRR / ARR', subtitulo: 'Ingresos recurrentes', emoji: '📈', bg: 'bg-purple-100', stat: '$12,400 MRR', statColor: 'text-purple-600', extra: '+18% MoM' },
      { titulo: 'Pipeline de Ventas', subtitulo: 'Deals y conversiones', emoji: '🎯', bg: 'bg-blue-100', stat: '24 deals activos', statColor: 'text-blue-600', extra: '$84K potencial' },
      { titulo: 'Churn & Retención', subtitulo: 'Cancelaciones y retención', emoji: '🔄', bg: 'bg-red-100', stat: '3.2% churn', statColor: 'text-red-500', extra: '96.8% retención' },
      { titulo: 'Usuarios & Activación', subtitulo: 'DAU / MAU y onboarding', emoji: '👥', bg: 'bg-indigo-100', stat: '284 usuarios activos', statColor: 'text-indigo-600', extra: '72% activación' },
      { titulo: 'Finanzas', subtitulo: 'Runway y gastos', emoji: '💰', bg: 'bg-emerald-100', stat: '18 meses runway', statColor: 'text-emerald-600', extra: 'Burn rate $8,200/mes' },
      { titulo: 'NPS & Satisfacción', subtitulo: 'Feedback y CSAT', emoji: '⭐', bg: 'bg-amber-100', stat: 'NPS: 68', statColor: 'text-amber-600', extra: '94 respuestas este mes' },
    ],
    erpActividad: [
      { texto: 'Nuevo deal cerrado: Acme Corp - $1,200/mes', dot: 'bg-emerald-400', tiempo: 'Hace 10 min' },
      { texto: 'Usuario #284 activó su cuenta', dot: 'bg-blue-400', tiempo: 'Hace 25 min' },
      { texto: 'Churn: ClienteX canceló su suscripción', dot: 'bg-red-400', tiempo: 'Hace 2h' },
      { texto: 'Demo programada: TechVentures - mañana 10am', dot: 'bg-purple-400', tiempo: 'Hace 3h' },
    ],
  },

  tienda: {
    nicho: 'tienda', nombre: 'Tienda', color: '#ec4899',
    leadLabel: 'Prospectos', clienteLabel: 'Compradores', oportunidadLabel: 'Ventas', actividadLabel: 'Pedidos',
    kpiLeads: 'Visitas hoy', kpiOportunidades: 'Ventas del día', kpiClientes: 'Clientes frecuentes',
    kpiPipeline: 'Ingresos del día', kpiPendientes: 'Pedidos pendientes', kpiTasa: 'Tasa de conversión',
    etapas: ['visitante', 'interesado', 'carrito', 'pago', 'fidelizado'],
    etapaLabels: { visitante: 'Visitante', interesado: 'Interesado', carrito: 'En Carrito', pago: 'Pago', fidelizado: 'Fidelizado' },
    posTerminal: 'Caja', posHistorial: 'Historial de Ventas',
    erpKpis: [
      { value: '$18,500', label: 'Ventas del día',      bg: 'bg-pink-100',   color: 'text-pink-600',   svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { value: '284',     label: 'Transacciones hoy',   bg: 'bg-blue-100',   color: 'text-blue-600',   svg: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
      { value: '$65',     label: 'Ticket promedio',     bg: 'bg-emerald-100',color: 'text-emerald-600',svg: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
      { value: '12',      label: 'Productos agotados',  bg: 'bg-red-100',    color: 'text-red-600',    svg: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    ],
    erpModulos: [
      { titulo: 'Inventario', subtitulo: 'Stock y variantes', emoji: '📦', bg: 'bg-pink-100', stat: '12 productos agotados', statColor: 'text-red-500', extra: '850 SKUs activos' },
      { titulo: 'Ventas', subtitulo: 'Transacciones del día', emoji: '🛍️', bg: 'bg-blue-100', stat: '284 ventas hoy', statColor: 'text-blue-600', extra: '$18,500 facturado' },
      { titulo: 'Clientes Frecuentes', subtitulo: 'Puntos y fidelización', emoji: '⭐', bg: 'bg-amber-100', stat: '124 clientes activos', statColor: 'text-amber-600', extra: '18 redenciones hoy' },
      { titulo: 'Compras', subtitulo: 'Proveedores y reposición', emoji: '🛒', bg: 'bg-indigo-100', stat: '6 órdenes pendientes', statColor: 'text-indigo-600', extra: '14 proveedores' },
      { titulo: 'E-commerce', subtitulo: 'Tienda online y pedidos', emoji: '💻', bg: 'bg-teal-100', stat: '38 pedidos online hoy', statColor: 'text-teal-600', extra: '$4,200 en web' },
      { titulo: 'Finanzas', subtitulo: 'Caja y corte diario', emoji: '💰', bg: 'bg-emerald-100', stat: 'Corte: $18,500', statColor: 'text-emerald-600', extra: 'Cierre caja 21:00' },
    ],
    erpActividad: [
      { texto: 'Venta #1,284: 3 artículos - $195', dot: 'bg-emerald-400', tiempo: 'Hace 1 min' },
      { texto: 'Cliente frecuente redimió 500 puntos', dot: 'bg-pink-400', tiempo: 'Hace 15 min' },
      { texto: 'Producto agotado: Camiseta M azul navy', dot: 'bg-red-400', tiempo: 'Hace 40 min' },
      { texto: 'Pedido online #38 listo para envío', dot: 'bg-blue-400', tiempo: 'Hace 1h' },
    ],
  },
};

const DEFAULT_CONFIG: NichoConfig = {
  nicho: '', nombre: 'Mi Empresa', color: '#6366f1',
  leadLabel: 'Leads', clienteLabel: 'Clientes', oportunidadLabel: 'Oportunidades', actividadLabel: 'Actividades',
  kpiLeads: 'Total Leads', kpiOportunidades: 'Oportunidades', kpiClientes: 'Clientes',
  kpiPipeline: 'Valor Pipeline', kpiPendientes: 'Actividades Pendientes', kpiTasa: 'Tasa de Cierre',
  etapas: ['prospeccion', 'contacto', 'propuesta', 'negociacion', 'cierre'],
  etapaLabels: { prospeccion: 'Prospección', contacto: 'Contacto', propuesta: 'Propuesta', negociacion: 'Negociación', cierre: 'Cierre' },
  posTerminal: 'Terminal', posHistorial: 'Historial',
  erpKpis: [
    { value: '$2.4M',   label: 'Ingresos del Mes',   bg: 'bg-emerald-100',color: 'text-emerald-600',svg: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    { value: '847',     label: 'Órdenes Activas',     bg: 'bg-amber-100',  color: 'text-amber-600',  svg: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>' },
    { value: '12,450',  label: 'Productos en Stock',  bg: 'bg-blue-100',   color: 'text-blue-600',   svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' },
    { value: '56',      label: 'Empleados Activos',   bg: 'bg-purple-100', color: 'text-purple-600', svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  ],
  erpModulos: [
    { titulo: 'Gestión Financiera', subtitulo: 'Contabilidad y tesorería', emoji: '💰', bg: 'bg-emerald-100', stat: '+12% este mes', statColor: 'text-emerald-600', extra: '3 facturas pendientes' },
    { titulo: 'Compras', subtitulo: 'Órdenes y proveedores', emoji: '🛒', bg: 'bg-amber-100', stat: '15 órdenes pendientes', statColor: 'text-amber-600', extra: '8 proveedores activos' },
    { titulo: 'Inventario', subtitulo: 'Stock y almacenes', emoji: '📦', bg: 'bg-indigo-100', stat: '7 alertas stock bajo', statColor: 'text-red-500', extra: '3 almacenes' },
    { titulo: 'Ventas', subtitulo: 'Pedidos y facturación', emoji: '📈', bg: 'bg-blue-100', stat: '$580K facturado', statColor: 'text-blue-600', extra: '24 pedidos hoy' },
    { titulo: 'RRHH', subtitulo: 'Nómina y personal', emoji: '👥', bg: 'bg-purple-100', stat: '56 empleados', statColor: 'text-purple-600', extra: 'Nómina al día' },
    { titulo: 'Logística', subtitulo: 'Envíos y entregas', emoji: '🚚', bg: 'bg-teal-100', stat: '45 envíos en tránsito', statColor: 'text-teal-600', extra: '96% a tiempo' },
  ],
  erpActividad: [
    { texto: 'Orden de compra #1045 aprobada', dot: 'bg-emerald-400', tiempo: 'Hace 5 min' },
    { texto: 'Stock bajo en producto SKU-4421', dot: 'bg-red-400', tiempo: 'Hace 1h' },
    { texto: 'Factura #2890 enviada a cliente', dot: 'bg-amber-400', tiempo: 'Hace 2h' },
  ],
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
}
