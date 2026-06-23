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

export interface HistorialEtapa {
  etapa: string;
  fecha: string;
  notas?: string;
}

export interface Oportunidad {
  id: number;
  id_oportunidad: number;
  nombre: string;
  pipeline: string;
  etapa: 'prospeccion' | 'contacto' | 'propuesta' | 'negociacion' | 'cierre' | 'ganada' | 'perdida';
  historial_etapas?: HistorialEtapa[];
  valor?: number;
  cliente?: string;
  fecha_creacion?: string;
  created_at?: string;
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
}

export interface Actividad {
  id_pk: number;
  actividad: string;
  tipo_actividad: 'llamada' | 'correo' | 'reunion' | 'tarea' | 'nota' | 'seguimiento';
  recordatorio?: string;
  fecha?: string;
  completada?: boolean;
  entidad_tipo?: string;
  entidad_id?: number;
}

export interface ContactoMarketing {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface MarketingCampana {
  id: number;
  nombre_compania: string;
  segmento: string;
  lista_contactos: ContactoMarketing[];
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

export interface Usuario {
  id_usuario: number;
  id_tenant:  number;
  nombre:     string;
  email:      string;
}

export type ModuloCRM =
  | 'dashboard' | 'leads' | 'oportunidades' | 'clientes'
  | 'actividades' | 'marketing' | 'automatizar' | 'reportes' | 'integraciones' | 'configuracion';
