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
  controla_stock?: boolean;
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
  operacion?: string | null;
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
  /** Sección del hotel que originó el item (Bar, Spa, Hospedaje...), si el pedido vino de un check-out. */
  seccion?: string | null;
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
  canal?: string | null;
  items: ErpPedidoItem[];
  pagos?: PedidoPago[];
  fecha: string;
  created_at?: string;
}

export interface ErpFactura {
  id: number;
  id_tenant?: number;
  id_pedido: number;
  pedido?: ErpPedido;
  id_usuario?: number | null;
  usuario?: { id_usuario: number; nombre: string } | null;
  tipo: 'interna' | 'timbrada';
  estado: 'registrada' | 'pendiente_timbrado' | 'timbrada' | 'error' | 'cancelada';
  serie: string;
  folio: number;
  rfc_receptor: string;
  razon_social_receptor: string;
  uso_cfdi?: string | null;
  forma_pago_sat?: string | null;
  metodo_pago_sat?: string | null;
  subtotal: number;
  iva: number;
  total: number;
  uuid?: string | null;
  xml_path?: string | null;
  pdf_path?: string | null;
  fecha_timbrado?: string | null;
  error_mensaje?: string | null;
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
  /** Categoría del producto al momento de cargarlo (Bar, Spa...): la sección del hotel que lo vendió. */
  seccion?: string | null;
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
  estado_limpieza: 'limpia' | 'sucia' | 'en_limpieza' | 'inspeccion';
  huesped: string | null;
  check_in: string | null;
  check_out: string | null;
  noches: number | null;
  consumos: ErpHabitacionConsumo[];
  estadia_activa?: ErpEstadia | null;
}

export interface ErpHabitacionIncidencia {
  id: number;
  id_habitacion: number;
  habitacion?: { id: number; numero: number; tipo: string };
  titulo: string;
  descripcion: string | null;
  prioridad: 'baja' | 'media' | 'alta';
  fuera_de_servicio: boolean;
  estado: 'abierta' | 'resuelta';
  resuelta_at: string | null;
  created_at: string;
}

export interface ErpReporteOcupacion {
  desde: string;
  hasta: string;
  total_habitaciones: number;
  noches_disponibles: number;
  noches_vendidas: number;
  ingresos_hospedaje: number;
  ocupacion_pct: number;
  adr: number;
  revpar: number;
  por_dia: { fecha: string; ocupadas: number; total_habitaciones: number }[];
  ingresos_por_seccion: { seccion: string; total: number }[];
}

export interface ErpSolicitudHuesped {
  id: number;
  id_habitacion: number;
  habitacion?: { id: number; numero: number; tipo: string };
  huesped: string | null;
  titulo: string;
  descripcion: string | null;
  categoria: 'queja' | 'solicitud' | 'otro';
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'abierta' | 'en_progreso' | 'resuelta';
  resuelta_at: string | null;
  created_at: string;
}

export interface ErpEstadia {
  id: number;
  id_habitacion: number;
  habitacion?: { id: number; numero: number; tipo: string };
  huesped: string;
  id_cliente: number | null;
  cliente?: { id_cliente: number; nombre: string } | null;
  check_in: string;
  check_out_programado: string | null;
  noches: number | null;
  check_out_real: string | null;
  total_hospedaje: number;
  total_consumos: number;
  total: number;
  id_pedido: number | null;
  estado: 'activa' | 'finalizada';
  documento_tipo: string | null;
  documento_numero: string | null;
  firma_url: string | null;
  firmado_at: string | null;
}

export type ErpDisponibilidadEstado = 'libre' | 'ocupada' | 'reservada' | 'mantenimiento';

export interface ErpDisponibilidadHabitacion {
  id: number;
  numero: number;
  tipo: string;
  dias: Record<string, ErpDisponibilidadEstado>;
}

export interface ErpDisponibilidad {
  dias: string[];
  habitaciones: ErpDisponibilidadHabitacion[];
}

export interface ErpReserva {
  id: number;
  id_habitacion: number;
  habitacion?: { id: number; numero: number; tipo: string };
  huesped: string;
  id_cliente: number | null;
  telefono: string | null;
  fecha_checkin: string;
  fecha_checkout: string;
  noches: number;
  notas: string | null;
  estado: 'pendiente' | 'cancelada' | 'convertida';
}

export interface ErpTarifaTemporada {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_ajuste: 'porcentaje' | 'monto_fijo';
  valor: number;
}

export interface ErpEstimadoHospedaje {
  total: number;
  detalle: { fecha: string; tarifa: number; temporada: string | null }[];
}

export interface ErpHistorialCliente {
  total_estadias: number;
  estadias: ErpEstadia[];
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

export type ErpPeriodicidadNomina = 'semanal' | 'quincenal' | 'mensual';

export interface ErpEmpleado {
  id: number;
  id_tenant?: number;
  nombre: string;
  departamento: string;
  puesto: string;
  estado: 'activo' | 'inactivo';
  salario?: number | null;
  periodicidad: ErpPeriodicidadNomina;
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
  ventasDetalle: ErpReporteVentaDetalle[];
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

export interface ErpReporteVentaDetalle {
  id: number;
  fecha: string;
  cliente: string;
  cajero: string | null;
  estado: 'pendiente' | 'enviado' | 'facturado' | 'cancelada';
  items: number;
  total: number;
}
