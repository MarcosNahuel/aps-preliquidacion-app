// Definicion de columnas esperadas en la plantilla Excel
// Basado en el Excel modelo real de los colegios (48 columnas)

// Nombre de la hoja esperada en el archivo Excel
export const NOMBRE_HOJA_ESPERADO = 'Libro Primario';

export interface ColumnaExcel {
  nombre: string;
  campo: string;
  tipo: 'string' | 'number' | 'date';
  obligatorio: boolean;
  variantes?: string[]; // Nombres alternativos que pueden aparecer
}

// Columnas exactas de la plantilla oficial (48 columnas)
// Orden segun archivo Excel real de colegios
export const COLUMNAS_PLANTILLA: ColumnaExcel[] = [
  // Identificacion
  { nombre: 'Colegio', campo: 'colegio', tipo: 'string', obligatorio: true },
  { nombre: 'Legajo', campo: 'legajo', tipo: 'string', obligatorio: true },
  { nombre: 'Apellido y Nombres', campo: 'apellido_nombres', tipo: 'string', obligatorio: false, variantes: ['Apellido y Nombre', 'Apellido y Nombres'] },
  { nombre: 'C.U.I.L.', campo: 'cuil', tipo: 'string', obligatorio: false, variantes: ['CUIL', 'C.U.I.L', 'Cuil'] },
  { nombre: 'Cargo', campo: 'cargo', tipo: 'string', obligatorio: false },
  { nombre: 'Puntaje', campo: 'puntaje', tipo: 'number', obligatorio: false },
  { nombre: 'Horas', campo: 'horas', tipo: 'number', obligatorio: false },
  { nombre: 'Asist.', campo: 'asistencia_dias', tipo: 'number', obligatorio: false, variantes: ['Asist', 'Asistencia'] },

  // Antiguedad
  { nombre: 'Años', campo: 'antiguedad_anos', tipo: 'number', obligatorio: false, variantes: ['Anos', 'Años Ant.'] },
  { nombre: 'Mes', campo: 'antiguedad_meses', tipo: 'number', obligatorio: false, variantes: ['Meses'] },
  { nombre: '% Antig,', campo: 'porcentaje_antiguedad', tipo: 'number', obligatorio: false, variantes: ['% Antig.', '% Antiguedad', '%Antig'] },

  // Datos para calculo de Arraigo
  { nombre: 'Años Ant.\nArraig', campo: 'anos_ant_arraigo', tipo: 'number', obligatorio: false, variantes: ['Años Ant. Arraig', 'Anos Ant Arraig', 'Años Ant.\nArraigo'] },
  { nombre: 'Porc. Ant.\nArraig', campo: 'porcentaje_ant_arraigo', tipo: 'number', obligatorio: false, variantes: ['Porc. Ant. Arraig', '% Ant. Arraig', 'Porc Ant Arraig'] },
  { nombre: 'Hs.\npara\nArraig', campo: 'horas_para_arraigo', tipo: 'number', obligatorio: false, variantes: ['Hs. para Arraig', 'Hs para Arraig', 'Horas Arraig'] },

  // Conceptos remunerativos
  { nombre: 'Asigación Clase', campo: 'asignacion_clase', tipo: 'number', obligatorio: false, variantes: ['Asignacion Clase', 'Asignación Clase', 'Asig. Clase'] },
  { nombre: 'Estado Docente', campo: 'estado_docente', tipo: 'string', obligatorio: false },
  { nombre: 'Antigue-dad', campo: 'antiguedad_monto', tipo: 'number', obligatorio: false, variantes: ['Antiguedad', 'Antigüedad'] },
  { nombre: 'Zona', campo: 'zona', tipo: 'number', obligatorio: false },
  { nombre: 'Presen-tismo', campo: 'presentismo', tipo: 'number', obligatorio: false, variantes: ['Presentismo'] },
  { nombre: 'Bono Remunerat.', campo: 'bono_remunerativo', tipo: 'number', obligatorio: false, variantes: ['Bono Remunerativo', 'Bono Remun.'] },
  { nombre: 'Adicion. Direct.', campo: 'adicional_directivo', tipo: 'number', obligatorio: false, variantes: ['Adicional Directivo', 'Adic. Directivo'] },
  { nombre: 'Garantia Remunerat.', campo: 'garantia_remunerativa', tipo: 'number', obligatorio: false, variantes: ['Garantía Remunerativa', 'Gtia Remun.'] },
  { nombre: 'Item Aula', campo: 'item_aula', tipo: 'number', obligatorio: false, variantes: ['Ítem Aula'] },
  { nombre: 'Otros', campo: 'otros_adicionales', tipo: 'number', obligatorio: false, variantes: ['Otros Adic.'] },
  { nombre: 'Item Arraigo', campo: 'item_arraigo', tipo: 'number', obligatorio: false, variantes: ['Ítem Arraigo', 'Item Arrigo'] },
  { nombre: 'Item especializac', campo: 'item_especializacion', tipo: 'number', obligatorio: false, variantes: ['Item Especializacion', 'Ítem Especialización'] },

  // Sueldos brutos
  { nombre: 'Sueldo \nBruto ', campo: 'sueldo_bruto', tipo: 'number', obligatorio: false, variantes: ['Sueldo Bruto', 'S.Bruto'] },
  { nombre: 'Diferencias\nParitarias Remunerat.', campo: 'diferencias_paritarias_remun', tipo: 'number', obligatorio: false, variantes: ['Diferencias Paritarias', 'Dif. Paritarias'] },
  { nombre: 'S.Bruto \nTotal', campo: 'sueldo_bruto_total', tipo: 'number', obligatorio: false, variantes: ['S.Bruto Total', 'Sueldo Bruto Total'] },

  // Conceptos no remunerativos
  { nombre: 'Salario Familiar', campo: 'salario_familiar', tipo: 'number', obligatorio: false, variantes: ['Sal. Familiar'] },
  { nombre: 'Ayuda Escolar', campo: 'ayuda_escolar', tipo: 'number', obligatorio: false },
  { nombre: 'Ayuda \nUtiles', campo: 'ayuda_utiles', tipo: 'number', obligatorio: false, variantes: ['Ayuda Utiles', 'Ayuda Útiles'] },
  { nombre: 'No Remun.\nGtia. Nacional', campo: 'no_remun_gtia_nacional', tipo: 'number', obligatorio: false, variantes: ['No Remun. Gtia. Nacional', 'No Remunerativo Gtia Nacional'] },
  { nombre: 'No Remun.\nGtia. Provincial', campo: 'no_remun_gtia_provincial', tipo: 'number', obligatorio: false, variantes: ['No Remun. Gtia. Provincial', 'No Remunerativo Gtia Provincial'] },
  { nombre: 'No Remun.\nDiferencias', campo: 'no_remun_diferencias', tipo: 'number', obligatorio: false, variantes: ['No Remun. Diferencias', 'No Remunerativo Diferencias'] },
  { nombre: 'Bono No Remunerat.\nOtros', campo: 'bono_no_remun_otros', tipo: 'number', obligatorio: false, variantes: ['Bono No Remunerativo Otros', 'Bono No Remun. Otros'] },
  { nombre: 'Incentivo Docente', campo: 'incentivo_docente', tipo: 'number', obligatorio: false },
  { nombre: 'Conectividad', campo: 'conectividad', tipo: 'number', obligatorio: false },
  { nombre: 'Otros', campo: 'otros_no_remunerativos', tipo: 'number', obligatorio: false },

  // Totales
  { nombre: 'Total de \nHaberes', campo: 'total_haberes', tipo: 'number', obligatorio: false, variantes: ['Total de Haberes', 'Total Haberes'] },

  // Deducciones
  { nombre: 'Jubilación', campo: 'jubilacion', tipo: 'number', obligatorio: false, variantes: ['Jubilacion'] },
  { nombre: 'O.Social', campo: 'obra_social', tipo: 'number', obligatorio: false, variantes: ['Obra Social', 'O. Social'] },
  { nombre: 'Sindicato', campo: 'sindicato', tipo: 'number', obligatorio: false },
  { nombre: 'Caja \nComplem.', campo: 'caja_complementaria', tipo: 'number', obligatorio: false, variantes: ['Caja Complem.', 'Caja Complementaria'] },
  { nombre: 'Otros Descuentos', campo: 'otros_descuentos', tipo: 'number', obligatorio: false, variantes: ['Otros Desc.'] },
  { nombre: 'Total \nDescuentos', campo: 'total_deducciones', tipo: 'number', obligatorio: false, variantes: ['Total Descuentos'] },

  // Neto y firmas
  { nombre: 'Neto ', campo: 'sueldo_neto', tipo: 'number', obligatorio: false, variantes: ['Neto', 'Sueldo Neto'] },
  { nombre: 'Firmas', campo: 'firmas', tipo: 'string', obligatorio: false },
];

// Nombres de hojas validos en los archivos Excel
export const NOMBRES_HOJAS_VALIDOS = [
  'Libro Primario',
  'Libro Secundario',
  'Libro Terciario',
  'PRIMARIO',
  'SECUNDARIO',
  'TERCIARIO',
  'Liquidacion',
  'Libro',
  'NOV',
  'NOVIEMBRE',
];

// Patrones de nombres de hojas (para hojas como "P08", "S08", "PRIMARIO 11-25")
export const PATRONES_HOJAS_VALIDOS = [
  /^Libro\s+\d+$/i,           // "Libro 001", "Libro 123"
  /^[PST]\d+$/i,              // "P08", "S12", "T03"
  /^PRIMARI[OA]\s+\d+-\d+$/i, // "PRIMARIO 11-25"
  /^SECUNDARI[OA]\s+\d+-\d+$/i,
  /^TERCIARI[OA]\s+\d+-\d+$/i,
];

export const NIVELES_VALIDOS = ['P', 'PE', 'PP', 'PS', 'PT', 'S', 'T'];

// Mapeo de prefijos de colegio a nivel normalizado
export const MAPEO_NIVEL: Record<string, string> = {
  'P': 'P',
  'PE': 'PE',
  'PP': 'PP',
  'PS': 'PS',
  'PT': 'PT',
  'S': 'PS',  // S-001 -> PS-001
  'T': 'PT',  // T-001 -> PT-001
};

// Obtener nombres de columnas esperados
export function getNombresColumnasEsperados(): string[] {
  return COLUMNAS_PLANTILLA.map(c => c.nombre);
}

// Mapear nombre de columna a campo de base de datos
// Maneja variantes y nombres con saltos de linea
export function mapearColumnaACampo(nombreColumna: string): string | null {
  const nombreNormalizado = nombreColumna.trim().replace(/\s+/g, ' ');

  for (const columna of COLUMNAS_PLANTILLA) {
    // Comparar nombre principal
    const nombrePrincipalNorm = columna.nombre.replace(/\s+/g, ' ').trim();
    if (nombrePrincipalNorm.toLowerCase() === nombreNormalizado.toLowerCase()) {
      return columna.campo;
    }

    // Comparar variantes
    if (columna.variantes) {
      for (const variante of columna.variantes) {
        if (variante.toLowerCase() === nombreNormalizado.toLowerCase()) {
          return columna.campo;
        }
      }
    }
  }

  return null;
}

// Obtener tipo de dato de una columna
export function getTipoColumna(campo: string): 'string' | 'number' | 'date' | null {
  const columna = COLUMNAS_PLANTILLA.find(c => c.campo === campo);
  return columna?.tipo || null;
}

// Verificar si una columna es obligatoria
export function esColumnaObligatoria(campo: string): boolean {
  const columna = COLUMNAS_PLANTILLA.find(c => c.campo === campo);
  return columna?.obligatorio || false;
}

// Normalizar nivel de colegio
export function normalizarNivel(nivel: string): string {
  const nivelUpper = nivel.toUpperCase().trim();
  return MAPEO_NIVEL[nivelUpper] || nivelUpper;
}

// Validar formato de codigo de colegio (ej: P-001, PS-012)
export function validarCodigoColegio(codigo: string): { valido: boolean; nivel?: string; numero?: string; mensaje?: string } {
  const regex = /^(P|PE|PP|PS|PT|S|T)-?(\d{1,3})$/i;
  const match = codigo.trim().match(regex);

  if (!match) {
    return {
      valido: false,
      mensaje: 'Formato invalido. Use: P-001, PS-012, PT-003, etc.'
    };
  }

  const nivel = normalizarNivel(match[1]);
  const numero = match[2].padStart(3, '0');

  return { valido: true, nivel, numero };
}
