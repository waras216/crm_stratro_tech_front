export type TipoCuenta = 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'costo' | 'gasto';
export type NaturalezaCuenta = 'deudora' | 'acreedora';
export type OrigenAsiento = 'manual' | 'venta' | 'compra' | 'nomina' | 'migracion' | 'ajuste';

export interface ErpCuentaContable {
  id: number;
  id_tenant?: number;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  id_cuenta_padre?: number | null;
  es_movible: boolean;
  activo: boolean;
}

export interface ErpAsientoDetalle {
  id: number;
  id_asiento?: number;
  id_cuenta: number;
  debe: number;
  haber: number;
  descripcion?: string | null;
  cuenta?: ErpCuentaContable;
}

export interface ErpAsiento {
  id: number;
  id_tenant?: number;
  fecha: string;
  concepto: string;
  origen: OrigenAsiento;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
  total_debe: number;
  total_haber: number;
  detalles: ErpAsientoDetalle[];
  created_at?: string;
  reversado?: boolean;
}

export interface ErpBalanceComprobacionFila {
  id_cuenta: number;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  debe: number;
  haber: number;
  saldo: number;
}

export interface ErpBalanceComprobacion {
  cuentas: ErpBalanceComprobacionFila[];
  total_debe: number;
  total_haber: number;
}

export interface ErpEstadoResultadosFila {
  codigo: string;
  nombre: string;
  monto: number;
}

export interface ErpEstadoResultados {
  ingresos: ErpEstadoResultadosFila[];
  costos: ErpEstadoResultadosFila[];
  gastos: ErpEstadoResultadosFila[];
  total_ingresos: number;
  total_costos: number;
  total_gastos: number;
  utilidad_neta: number;
}

export interface ErpBalanceGeneralFila {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface ErpBalanceGeneral {
  corte: string;
  activo: ErpBalanceGeneralFila[];
  pasivo: ErpBalanceGeneralFila[];
  capital: ErpBalanceGeneralFila[];
  resultado_ejercicio: number;
  total_activo: number;
  total_pasivo: number;
  total_capital: number;
  cuadra: boolean;
}

export interface ErpNominaPagoDetalle {
  id: number;
  id_empleado: number;
  salario: number;
  empleado?: { id: number; nombre: string; puesto: string };
}

export interface ErpNominaPago {
  id: number;
  id_tenant?: number;
  fecha: string;
  periodo: 'semanal' | 'quincenal' | 'mensual';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  total: number;
  id_asiento: number;
  detalles: ErpNominaPagoDetalle[];
}
