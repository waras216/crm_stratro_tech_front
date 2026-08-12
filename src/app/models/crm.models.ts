export interface Lead {
  id: number;
  id_lead: number;
  id_tenant?: number;
  titulo: string;
  estado: string;
  fuente: string;
  nombre?: string;
  estatus?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  valor_estimado?: number|string|null;
  fecha_creacion?: string;
  created_at?: string;
  cliente?: Cliente;
  usuario?: Usuario;
}

export interface Pipeline {
  id_pipeline: number;
  id_tenant?: number;
  nombre: string;
  activo?: boolean;
}

export interface Oportunidad {
  id_oportunidad: number;
  id_tenant?: number;
  id_cliente: number;
  id_pipeline: number;
  id_usuario?: number;
  titulo: string;
  valor?: number;
  probabilidad?: number;
  estado?: 'abierta' | 'ganada' | 'perdida';
  etapa: 'prospeccion' | 'contacto' | 'propuesta' | 'negociacion' | 'cierre';
  fecha_cierre?: string | null;
  cliente?: Cliente;
  pipeline?: Pipeline;
  created_at?: string;
}

export interface Notificacion {
  id_notificacion: number;
  id_tenant?: number;
  id_usuario?: number;
  id_cliente?: number | null;
  titulo: string;
  mensaje?: string;
  tipo: string;
  leida: boolean;
  url?: string | null;
  created_at?: string;
}

export interface Contacto {
  id_contacto: number;
  id_cliente?: number;
  nombre: string;
  apellido_p?: string;
  apellido_m?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  principal?: boolean;
}

export interface Cliente {
  id: number;
  id_cliente: number;
  id_tenant?: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sector_empresarial?: string;
  empresa?: string;
  rfc?: string;
  fecha_registro?: string;
  tipo: 'empresa' | 'persona';
  activo?: number;
  created_at?: string;
  contactos?: Contacto[];
  leads?: Lead[];
  oportunidades?: Oportunidad[];
  actividades?: Actividad[];
}

export interface Actividad {
  id_actividad: number;
  id_tenant?: number;
  id_usuario?: number;
  id_cliente?: number | null;
  id_lead?: number | null;
  id_oportunidad?: number | null;
  tipo: 'llamada' | 'reunion' | 'email' | 'tarea' | 'nota';
  titulo: string;
  descripcion?: string | null;
  estado: 'pendiente' | 'completada' | 'cancelada';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export interface MarketingCampana {
  id: number;
  nombre_compania: string;
  segmento: string;
  clientes?: Cliente[];
  n_contacto: number;
  estado?: string;
  fecha_inicio?: string;
}

export interface Automatizacion {
  id: number;
  nombre_automatizacion: string;
  regla: string;
  evento: string;
  accion: string;
  activa: boolean;
  fecha_creacion?: string;
}

export interface Integracion {
  id: number;
  nombre: string;
  tipo: 'whatsapp' | 'email' | 'calendario' | 'almacenamiento' | 'otro';
  estado: 'conectada' | 'desconectada' | 'error';
  configuracion?: Record<string, string | undefined>;
}

export type EstadoUsuario = 'activo' | 'ocupado' | 'suspendido';

export interface Usuario {
  id_usuario: number;
  id_tenant:  number;
  nombre:     string;
  email:      string;
  es_admin?:  boolean;
  estado?:    EstadoUsuario;
  created_at?: string;
  cuenta_existente?: boolean;
  roles?: string[];
  tiene_2fa?: boolean;
}

export interface Plan {
  id_plan: number;
  nombre_plan: string;
  precio: number;
  stripe_price_id?: string | null;
  max_usuarios: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  tenants_count?: number;
}

export type EstadoSuscripcion = 'activa' | 'periodo_gracia' | 'cancelada' | 'vencida' | 'incompleta';

export interface Suscripcion {
  id_suscripcion: number;
  id_tenant: number;
  id_plan: number;
  estado: EstadoSuscripcion;
  fecha_inicio: string | null;
  fecha_fin_periodo_actual: string | null;
  cancela_al_final_periodo: boolean;
}

export interface EmpresaMiembro {
  id_usuario: number;
  nombre: string;
  email: string;
  es_owner: boolean;
}

export interface Empresa {
  id_tenant: number;
  empresa: string;
  subdominio: string;
  estado: string;
  nicho: string | null;
  moneda: string | null;
  modulos: { crm: boolean; pos: boolean; erp: boolean };
  id_plan: number;
  plan: string | null;
  usuarios: number;
  onboardingCompleto: boolean;
  creadoEn: string;
  miembros?: EmpresaMiembro[];
}

export interface EmpresaKpiNicho {
  id_tiponegocio: number | null;
  nicho: string;
  empresas: number;
  usuarios: number;
}

export type ModuloCRM =
  | 'dashboard' | 'leads' | 'oportunidades' | 'clientes'
  | 'actividades' | 'marketing' | 'automatizar' | 'reportes' | 'integraciones' | 'configuracion';

export interface Rol {
  id_rol: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  es_sistema: boolean;
  usuarios_count?: number;
  usuarios_ids: number[];
  permisos: string[];
}

export interface PermisoCatalogoItem {
  id_permiso: number;
  clave: string;
  accion: string | null;
  descripcion: string | null;
}

export type PermisoCatalogo = Record<string, PermisoCatalogoItem[]>;
