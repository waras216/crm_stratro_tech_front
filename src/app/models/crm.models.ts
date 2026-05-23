export interface Lead {
  id: number;
  nombre: string;
  fuente: string;
  estatus: 'nuevo' | 'contactado' | 'calificado' | 'perdido' | 'convertido';
  email?: string;
  telefono?: string;
  fecha_creacion: string;
}

export interface HistorialEtapa {
  etapa: string;
  fecha: string;
  notas?: string;
}

export interface Oportunidad {
  id: number;
  nombre: string;
  pipeline: string;
  etapa: 'prospeccion' | 'contacto' | 'propuesta' | 'negociacion' | 'cierre' | 'ganada' | 'perdida';
  historial_etapas: HistorialEtapa[];
  valor: number;
  cliente: string;
  fecha_creacion: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  sector_empresarial: string;
  fecha_registro: string;
  tipo: 'empresa' | 'persona';
}

export interface Actividad {
  id_pk: number;
  actividad: string;
  tipo_actividad: 'llamada' | 'correo' | 'reunion' | 'tarea' | 'nota' | 'seguimiento';
  recordatorio: string;
  fecha: string;
  completada: boolean;
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
  estado: 'activa' | 'pausada' | 'finalizada';
  fecha_inicio: string;
}

export interface Automatizacion {
  id: number;
  nombre_automatizacion: string;
  regla: string;
  evento: string;
  accion: string;
  activa: boolean;
  fecha_creacion: string;
}

export interface Integracion {
  id: number;
  nombre: string;
  tipo: 'whatsapp' | 'email' | 'calendario' | 'almacenamiento' | 'otro';
  estado: 'conectada' | 'desconectada' | 'error';
  configuracion?: Record<string, string | undefined>;
}

export type ModuloCRM =
  | 'dashboard'
  | 'leads'
  | 'oportunidades'
  | 'clientes'
  | 'actividades'
  | 'marketing'
  | 'automatizar'
  | 'reportes'
  | 'integraciones';
