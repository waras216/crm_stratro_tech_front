import { Cliente } from './crm.models';

export interface Categoria {
  id_categoria: number;
  id_tenant?: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface Producto {
  id_productos: number;
  id_tenant?: number;
  id_categorias: number;
  categoria?: Categoria;
  nombre: string;
  descripcion?: string;
  sku?: string;
  precio: number;
  precio_compra: number;
  stock: number;
  stock_minimo: number;
  activo?: boolean;
}

export interface Proveedor {
  id_proveedor: number;
  id_tenant?: number;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rfc?: string;
  activo?: boolean;
}

export interface ErpMovimientoStock {
  id: number;
  id_tenant?: number;
  id_producto: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  referencia?: string;
  stock_resultante: number;
  created_at?: string;
}

export interface ErpOrdenCompraItem {
  id?: number;
  id_producto: number;
  producto?: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface ErpOrdenCompra {
  id: number;
  id_tenant?: number;
  id_proveedor: number;
  proveedor?: Proveedor;
  fecha: string;
  estado: 'pendiente' | 'recibida' | 'cancelada';
  items: ErpOrdenCompraItem[];
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

export interface ErpPedidoItem {
  id?: number;
  id_producto: number;
  producto?: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface ErpPedido {
  id: number;
  id_tenant?: number;
  id_cliente: number;
  cliente?: Cliente;
  total: number;
  estado: 'pendiente' | 'enviado' | 'facturado' | 'cancelada';
  items: ErpPedidoItem[];
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
  horas_registradas?: number;
  presupuesto?: number | null;
}

export interface ErpProyectoTarea {
  id: number;
  id_tenant?: number;
  id_proyecto: number;
  titulo: string;
  descripcion?: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  asignado?: string | null;
  orden: number;
}

export interface ErpProyectoHora {
  id: number;
  id_tenant?: number;
  id_proyecto: number;
  colaborador: string;
  fecha: string;
  horas: number;
  descripcion?: string | null;
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

export interface ErpReportesResumen {
  kpis: {
    valorInventario: number;
    ingresosTotal: number;
    egresosTotal: number;
    balance: number;
    comprasPendientes: number;
    ventasPorCobrar: number;
  };
  inventarioPorCategoria: Record<string, number>;
  comprasPorEstado: Record<string, number>;
  comprasPorProveedor: Record<string, number>;
  ventasPorEstado: Record<string, number>;
  movimientosPorCategoria: Record<string, number>;
  movimientosPorMes: { mes: string; ingresos: number; egresos: number }[];
}
