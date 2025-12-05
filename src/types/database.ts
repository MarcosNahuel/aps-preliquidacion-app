// Tipos para la base de datos de Supabase

export type NivelCodigo = 'P' | 'PE' | 'PP' | 'PS' | 'PT';

export type TipoLiquidacion =
  | 'MENSUAL'
  | 'AG01'
  | 'AG02'
  | 'SUPLEMENTARIA'
  | 'RECTIFICATIVA'
  | 'LIQUIDACION_DOCENTE'
  | 'SUPLENCIAS_LICENCIAS_SIN_GOCE'
  | 'SUPLENCIAS_ENFERMEDAD_MATERNIDAD'
  | 'MAESTRANZA_SUTE'
  | 'MAESTRANZA_SOEME';

export type EstadoPresentacion = 'CARGADA' | 'CERRADA' | 'RECHAZADA';

export type TipoError = 'ESTRUCTURAL' | 'DATOS';

export type RolUsuario = 'COLEGIO' | 'AUDITOR';

export interface Colegio {
  id: string;
  codigo_nivel: NivelCodigo;
  codigo_colegio: string;
  nombre: string | null;
  cuit: string | null;
  porcentaje_subsidio: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  auth_user_id: string | null;
  email: string;
  nombre: string | null;
  rol: RolUsuario;
  id_colegio: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  colegio?: Colegio;
}

export interface Presentacion {
  id: string;
  id_colegio: string;
  periodo: string;
  tipo_liquidacion: TipoLiquidacion;
  estado: EstadoPresentacion;
  tipo_error: TipoError | null;
  motivo_rechazo: string | null;
  total_filas: number;
  filas_con_error: number;
  costo_total_presentado: number;
  id_usuario: string;
  ip_origen: string | null;
  ruta_archivo_original: string | null;
  ruta_archivo_errores: string | null;
  fecha_subida: string;
  fecha_cierre: string | null;
  created_at: string;
  updated_at: string;
  colegio?: Colegio;
  usuario?: Usuario;
}

export interface Docente {
  id: string;
  dni: string;
  cuil: string | null;
  apellido: string | null;
  nombres: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiquidacionPrivada {
  id: string;
  id_presentacion: string;
  id_colegio: string;
  id_docente: string | null;
  fila_excel: number;

  // Identificacion
  colegio: string | null;
  nivel: string | null;
  legajo: string | null;
  clave_docente: string | null;

  // Datos personales
  apellido: string | null;
  nombres: string | null;
  dni: string | null;
  cuil: string | null;
  fecha_nacimiento: string | null;

  // Datos laborales
  situacion_revista: string | null;
  cargo: string | null;
  puntaje: number | null;
  horas: number | null;
  asistencia_dias: number | null;
  inasistencia_dias: number | null;
  antiguedad_anos: number | null;

  // Conceptos salariales
  sueldo_basico: number | null;
  antiguedad_monto: number | null;
  presentismo: number | null;
  zona: number | null;
  item_arraigo: number | null;
  adicional_directivo: number | null;
  otros_adicionales: number | null;
  total_remunerativo: number | null;

  // Deducciones
  jubilacion: number | null;
  obra_social: number | null;
  sindicato: number | null;
  otros_descuentos: number | null;
  total_deducciones: number | null;

  // Neto
  sueldo_neto: number | null;

  // Campos futuros
  obligaciones_horas: number | null;
  obligaciones_dias: number | null;
  es_cargo: boolean;
  es_celador: boolean;
  codigo_regimen: string | null;

  created_at: string;
}

// Tipos para formularios y validaciones
export interface ErrorValidacion {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
}

export interface ResultadoValidacion {
  valido: boolean;
  errores: ErrorValidacion[];
  totalFilas: number;
  filasConError: number;
}

export interface DatosExcelFila {
  fila: number;
  colegio?: string;
  nivel?: string;
  legajo?: string;
  apellido?: string;
  nombres?: string;
  dni?: string;
  cuil?: string;
  fecha_nacimiento?: Date | string;
  situacion_revista?: string;
  cargo?: string;
  puntaje?: number;
  horas?: number;
  asistencia_dias?: number;
  inasistencia_dias?: number;
  antiguedad_anos?: number;
  sueldo_basico?: number;
  antiguedad_monto?: number;
  presentismo?: number;
  zona?: number;
  item_arraigo?: number;
  adicional_directivo?: number;
  otros_adicionales?: number;
  total_remunerativo?: number;
  jubilacion?: number;
  obra_social?: number;
  sindicato?: number;
  otros_descuentos?: number;
  total_deducciones?: number;
  sueldo_neto?: number;
}

// Constantes
export const NIVELES: { codigo: NivelCodigo; nombre: string }[] = [
  { codigo: 'P', nombre: 'Primario' },
  { codigo: 'PE', nombre: 'Especial' },
  { codigo: 'PP', nombre: 'Primario Especial' },
  { codigo: 'PS', nombre: 'Secundario' },
  { codigo: 'PT', nombre: 'Terciario' },
];

export const TIPOS_LIQUIDACION: { codigo: TipoLiquidacion; nombre: string }[] = [
  { codigo: 'MENSUAL', nombre: 'Liquidación Mensual' },
  { codigo: 'AG01', nombre: 'Aguinaldo 1er Semestre' },
  { codigo: 'AG02', nombre: 'Aguinaldo 2do Semestre' },
  { codigo: 'SUPLEMENTARIA', nombre: 'Suplementaria' },
  { codigo: 'RECTIFICATIVA', nombre: 'Rectificativa' },
  { codigo: 'LIQUIDACION_DOCENTE', nombre: 'Liquidación Docente' },
  { codigo: 'SUPLENCIAS_LICENCIAS_SIN_GOCE', nombre: 'Suplencias - Licencias sin Goce' },
  { codigo: 'SUPLENCIAS_ENFERMEDAD_MATERNIDAD', nombre: 'Suplencias - Enfermedad/Maternidad' },
  { codigo: 'MAESTRANZA_SUTE', nombre: 'Maestranza SUTE' },
  { codigo: 'MAESTRANZA_SOEME', nombre: 'Maestranza SOEME' },
];

export const ESTADOS_PRESENTACION: { codigo: EstadoPresentacion; nombre: string; color: string }[] = [
  { codigo: 'CARGADA', nombre: 'Cargada', color: 'bg-yellow-100 text-yellow-800' },
  { codigo: 'CERRADA', nombre: 'Cerrada', color: 'bg-green-100 text-green-800' },
  { codigo: 'RECHAZADA', nombre: 'Rechazada', color: 'bg-red-100 text-red-800' },
];
