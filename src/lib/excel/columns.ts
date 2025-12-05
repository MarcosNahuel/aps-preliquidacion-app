// Definicion de columnas esperadas en la plantilla Excel

export interface ColumnaExcel {
  nombre: string;
  campo: string;
  tipo: 'string' | 'number' | 'date';
  obligatorio: boolean;
  validacion?: (valor: unknown) => { valido: boolean; mensaje?: string };
}

// Columnas exactas de la plantilla oficial
export const COLUMNAS_PLANTILLA: ColumnaExcel[] = [
  { nombre: 'Colegio', campo: 'colegio', tipo: 'string', obligatorio: true },
  { nombre: 'Legajo', campo: 'legajo', tipo: 'string', obligatorio: true },
  { nombre: 'Apellido', campo: 'apellido', tipo: 'string', obligatorio: false },
  { nombre: 'Nombres', campo: 'nombres', tipo: 'string', obligatorio: false },
  { nombre: 'DNI', campo: 'dni', tipo: 'string', obligatorio: true },
  { nombre: 'CUIL', campo: 'cuil', tipo: 'string', obligatorio: false },
  { nombre: 'Fecha Nacimiento', campo: 'fecha_nacimiento', tipo: 'date', obligatorio: false },
  { nombre: 'Situacion Revista', campo: 'situacion_revista', tipo: 'string', obligatorio: false },
  { nombre: 'Cargo', campo: 'cargo', tipo: 'string', obligatorio: false },
  { nombre: 'Puntaje', campo: 'puntaje', tipo: 'number', obligatorio: false },
  { nombre: 'Horas', campo: 'horas', tipo: 'number', obligatorio: false },
  { nombre: 'Asistencia', campo: 'asistencia_dias', tipo: 'number', obligatorio: false },
  { nombre: 'Inasistencia', campo: 'inasistencia_dias', tipo: 'number', obligatorio: false },
  { nombre: 'Antiguedad', campo: 'antiguedad_anos', tipo: 'number', obligatorio: false },
  { nombre: 'Sueldo Basico', campo: 'sueldo_basico', tipo: 'number', obligatorio: false },
  { nombre: 'Antiguedad Monto', campo: 'antiguedad_monto', tipo: 'number', obligatorio: false },
  { nombre: 'Presentismo', campo: 'presentismo', tipo: 'number', obligatorio: false },
  { nombre: 'Zona', campo: 'zona', tipo: 'number', obligatorio: false },
  { nombre: 'Item Arraigo', campo: 'item_arraigo', tipo: 'number', obligatorio: false },
  { nombre: 'Adicional Directivo', campo: 'adicional_directivo', tipo: 'number', obligatorio: false },
  { nombre: 'Otros Adicionales', campo: 'otros_adicionales', tipo: 'number', obligatorio: false },
  { nombre: 'Total Remunerativo', campo: 'total_remunerativo', tipo: 'number', obligatorio: false },
  { nombre: 'Jubilacion', campo: 'jubilacion', tipo: 'number', obligatorio: false },
  { nombre: 'Obra Social', campo: 'obra_social', tipo: 'number', obligatorio: false },
  { nombre: 'Sindicato', campo: 'sindicato', tipo: 'number', obligatorio: false },
  { nombre: 'Otros Descuentos', campo: 'otros_descuentos', tipo: 'number', obligatorio: false },
  { nombre: 'Total Deducciones', campo: 'total_deducciones', tipo: 'number', obligatorio: false },
  { nombre: 'Sueldo Neto', campo: 'sueldo_neto', tipo: 'number', obligatorio: false },
  { nombre: 'NIVEL', campo: 'nivel', tipo: 'string', obligatorio: true },
];

export const NOMBRE_HOJA_ESPERADO = 'Liquidacion';

export const NIVELES_VALIDOS = ['P', 'PE', 'PP', 'PS', 'PT'];

// Obtener nombres de columnas esperados
export function getNombresColumnasEsperados(): string[] {
  return COLUMNAS_PLANTILLA.map(c => c.nombre);
}

// Mapear nombre de columna a campo de base de datos
export function mapearColumnaACampo(nombreColumna: string): string | null {
  const columna = COLUMNAS_PLANTILLA.find(
    c => c.nombre.toLowerCase() === nombreColumna.toLowerCase()
  );
  return columna?.campo || null;
}
