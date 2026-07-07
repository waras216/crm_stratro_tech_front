export interface ErpInventario {
  id: number;
  id_tenant?: number;
  nombre: string;
  sku: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  precio_compra: number;
  precio_venta: number;
}

export interface ErpOrdenCompra {
  id: number;
  id_tenant?: number;
  proveedor: string;
  fecha: string;
  estado: 'pendiente' | 'recibida' | 'cancelada';
  items: number;
  total: number;
}

export interface ErpMovimiento {
  id: number;
  id_tenant?: number;
  concepto: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  fecha: string;
  categoria: string;
}

export interface ErpPedido {
  id: number;
  id_tenant?: number;
  cliente: string;
  total: number;
  estado: 'pendiente' | 'enviado' | 'facturado';
  fecha: string;
}

export interface ErpEmpleado {
  id: number;
  id_tenant?: number;
  nombre: string;
  departamento: string;
  puesto: string;
  estado: 'activo' | 'inactivo';
  salario?: number | null;
}

export interface ErpOrdenProduccion {
  id: number;
  id_tenant?: number;
  producto: string;
  cantidad: number;
  progreso: number;
  estado: 'en proceso' | 'completada';
}

export interface ErpEnvio {
  id: number;
  id_tenant?: number;
  destino: string;
  transportista: string;
  eta: string;
  estado: 'en_transito' | 'entregado';
}

export interface ErpProyecto {
  id: number;
  id_tenant?: number;
  nombre: string;
  cliente: string;
  responsable: string;
  estado: 'activo' | 'pausado' | 'completado';
  progreso: number;
  horas: number;
  presupuesto?: number | null;
}

export interface ErpInteraccion {
  cliente: string;
  tipo: string;
  asunto: string;
  fecha: string;
}

export interface ErpCrmResumen {
  contactos: number;
  oportunidades: number;
  ticketsAbiertos: number;
}

export interface ErpDashboardKpi {
  value: string;
  label: string;
  bg: string;
  color: string;
  icon: string;
}

export interface ErpDashboardModulo {
  titulo: string;
  subtitulo: string;
  emoji: string;
  bg: string;
  stat: string;
  statColor: string;
  extra: string;
}

export interface ErpDashboardActividad {
  texto: string;
  dot: string;
  tiempo: string;
}

export interface ErpDashboardResumen {
  kpis: ErpDashboardKpi[];
  modulos: ErpDashboardModulo[];
  actividad: ErpDashboardActividad[];
}
