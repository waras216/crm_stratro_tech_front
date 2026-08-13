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
  imagen?: string | null;
  imagen_url?: string | null;
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
  id_usuario?: number | null;
  comprador?: { id_usuario: number; nombre: string } | null;
  fecha: string;
  created_at?: string;
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
  id_producto: number | null;
  producto?: Producto;
  descripcion?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface PedidoPago {
  metodo_pago: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito';
  monto: number;
}

export interface ErpPedido {
  id: number;
  id_tenant?: number;
  id_cliente: number;
  cliente?: Cliente;
  id_usuario?: number | null;
  cajero?: { id_usuario: number; nombre: string } | null;
  total: number;
  estado: 'pendiente' | 'enviado' | 'facturado' | 'cancelada';
  items: ErpPedidoItem[];
  pagos?: PedidoPago[];
  fecha: string;
  created_at?: string;
}

export interface ErpComandaItem {
  id: number;
  id_producto: number | null;
  producto?: Producto;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
}

export interface ErpComanda {
  id: number;
  estado: 'abierta' | 'enviada' | 'cerrada';
  enviada_cocina: boolean;
  total: number;
  items: ErpComandaItem[];
}

export interface ErpMesa {
  id: number;
  id_tenant?: number;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'cuenta' | 'reservada';
  mesero: string | null;
  comanda_activa: ErpComanda | null;
}

export interface ErpHabitacionConsumo {
  id: number;
  id_producto: number | null;
  producto?: Producto;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
}

export interface ErpHabitacion {
  id: number;
  id_tenant?: number;
  numero: number;
  tipo: string;
  precio: number | null;
  piso: number;
  estado: 'libre' | 'ocupada' | 'checkout' | 'mantenimiento';
  huesped: string | null;
  check_in: string | null;
  check_out: string | null;
  noches: number | null;
  consumos: ErpHabitacionConsumo[];
}

export interface ErpReceta {
  id: number;
  id_cliente: number;
  cliente?: Cliente;
  id_producto: number;
  producto?: Producto;
  dosis: string | null;
  cantidad: number;
  pendiente: boolean;
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
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
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
  delta?: number | null;
}

export interface ErpDashboardModulo {
  titulo: string;
  subtitulo: string;
  emoji: string;
  bg: string;
  stat: string;
  statColor: string;
  extra: string;
  icono?: string;
}

export interface ErpDashboardActividad {
  texto: string;
  dot: string;
  tiempo: string;
}

export interface ErpDashboardTendencia {
  mes: string;
  ingresos: number;
  egresos: number;
}

export interface ErpDashboardResumen {
  kpis: ErpDashboardKpi[];
  modulos: ErpDashboardModulo[];
  actividad: ErpDashboardActividad[];
  tendencia: ErpDashboardTendencia[];
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
  comprasDetalle: ErpReporteCompraDetalle[];
  ventasPorEstado: Record<string, number>;
  movimientosPorCategoria: Record<string, number>;
  movimientosPorMes: { mes: string; ingresos: number; egresos: number }[];
}

export interface ErpReporteCompraDetalle {
  id: number;
  fecha: string;
  proveedor: string;
  comprador: string | null;
  estado: 'pendiente' | 'recibida' | 'cancelada';
  items: number;
  total: number;
}
