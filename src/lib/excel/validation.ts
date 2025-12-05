import ExcelJS from 'exceljs';
import {
  COLUMNAS_PLANTILLA,
  NOMBRE_HOJA_ESPERADO,
  NIVELES_VALIDOS,
  getNombresColumnasEsperados
} from './columns';
import type { ErrorValidacion, ResultadoValidacion, DatosExcelFila } from '@/types/database';

// Resultado de validacion estructural
export interface ResultadoEstructural {
  valido: boolean;
  mensaje: string;
  detalles?: string[];
}

// Validar extension del archivo
export function validarExtension(nombreArchivo: string): ResultadoEstructural {
  if (!nombreArchivo.toLowerCase().endsWith('.xlsx')) {
    return {
      valido: false,
      mensaje: 'El archivo debe tener extension .xlsx',
      detalles: ['Solo se aceptan archivos de Excel en formato .xlsx (Excel 2007 o superior)']
    };
  }
  return { valido: true, mensaje: 'Extension correcta' };
}

// Validar estructura del archivo Excel
export async function validarEstructura(buffer: ArrayBuffer | Buffer): Promise<ResultadoEstructural> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as ArrayBuffer);

    // Verificar que existe la hoja esperada
    const hoja = workbook.getWorksheet(NOMBRE_HOJA_ESPERADO);
    if (!hoja) {
      const nombresHojas = workbook.worksheets.map(ws => ws.name).join(', ');
      return {
        valido: false,
        mensaje: `No se encontro la hoja "${NOMBRE_HOJA_ESPERADO}" en el archivo.`,
        detalles: [
          `El archivo debe contener una hoja llamada exactamente "${NOMBRE_HOJA_ESPERADO}".`,
          `Hojas encontradas: ${nombresHojas || 'ninguna'}`,
          'Por favor, descargue la plantilla oficial y respete la estructura sin modificar nombres de hojas.'
        ]
      };
    }

    // Obtener encabezados de la primera fila
    const primeraFila = hoja.getRow(1);
    const encabezadosArchivo: string[] = [];

    primeraFila.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      encabezadosArchivo[colNumber - 1] = String(cell.value || '').trim();
    });

    // Verificar columnas esperadas
    const columnasEsperadas = getNombresColumnasEsperados();
    const erroresColumnas: string[] = [];

    // Verificar que no falten columnas
    for (const columnaEsperada of columnasEsperadas) {
      const encontrada = encabezadosArchivo.some(
        enc => enc.toLowerCase() === columnaEsperada.toLowerCase()
      );
      if (!encontrada) {
        erroresColumnas.push(`Falta la columna "${columnaEsperada}"`);
      }
    }

    // Verificar que no haya columnas adicionales
    for (const encabezado of encabezadosArchivo) {
      if (!encabezado) continue;
      const esEsperada = columnasEsperadas.some(
        col => col.toLowerCase() === encabezado.toLowerCase()
      );
      if (!esEsperada) {
        erroresColumnas.push(`Columna no permitida: "${encabezado}"`);
      }
    }

    // Verificar orden de columnas
    if (erroresColumnas.length === 0) {
      for (let i = 0; i < columnasEsperadas.length; i++) {
        if (encabezadosArchivo[i]?.toLowerCase() !== columnasEsperadas[i].toLowerCase()) {
          erroresColumnas.push(
            `Columna ${i + 1}: se esperaba "${columnasEsperadas[i]}" pero se encontro "${encabezadosArchivo[i] || '(vacio)'}"`
          );
        }
      }
    }

    if (erroresColumnas.length > 0) {
      return {
        valido: false,
        mensaje: 'La estructura de columnas no coincide con la plantilla oficial.',
        detalles: [
          ...erroresColumnas,
          '',
          'Por favor, descargue nuevamente la plantilla oficial, copie sus datos respetando los titulos de columnas y vuelva a subir.'
        ]
      };
    }

    return { valido: true, mensaje: 'Estructura correcta' };
  } catch (error) {
    return {
      valido: false,
      mensaje: 'No se pudo leer el archivo Excel.',
      detalles: [
        'El archivo puede estar corrupto o no ser un archivo Excel valido.',
        'Por favor, verifique que el archivo se abra correctamente en Excel antes de subirlo.'
      ]
    };
  }
}

// Validar DNI
function validarDNI(valor: unknown): { valido: boolean; mensaje?: string } {
  if (valor === null || valor === undefined || valor === '') {
    return { valido: false, mensaje: 'DNI invalido: el campo es obligatorio y no puede estar vacio.' };
  }

  const dniStr = String(valor).replace(/\./g, '').trim();

  if (!/^\d+$/.test(dniStr)) {
    return {
      valido: false,
      mensaje: `DNI invalido: debe contener solo numeros, sin puntos ni otros caracteres. Se recibio "${valor}".`
    };
  }

  if (dniStr.length < 7 || dniStr.length > 8) {
    return {
      valido: false,
      mensaje: `DNI invalido: debe tener entre 7 y 8 digitos. Se recibio "${valor}" (${dniStr.length} digitos).`
    };
  }

  return { valido: true };
}

// Validar Legajo (3 digitos numericos)
function validarLegajo(valor: unknown): { valido: boolean; mensaje?: string } {
  if (valor === null || valor === undefined || valor === '') {
    return { valido: false, mensaje: 'Legajo invalido: el campo es obligatorio y no puede estar vacio.' };
  }

  const legajoStr = String(valor).trim();

  if (!/^\d{1,3}$/.test(legajoStr)) {
    return {
      valido: false,
      mensaje: `Legajo invalido: debe ser de 1 a 3 digitos numericos. Se recibio "${valor}".`
    };
  }

  return { valido: true };
}

// Validar CUIL (11 digitos + modulo 11)
function validarCUIL(valor: unknown): { valido: boolean; mensaje?: string } {
  if (valor === null || valor === undefined || valor === '') {
    return { valido: true }; // CUIL es opcional
  }

  const cuilStr = String(valor).replace(/[-\s]/g, '').trim();

  if (!/^\d{11}$/.test(cuilStr)) {
    return {
      valido: false,
      mensaje: `CUIL invalido: debe tener exactamente 11 digitos numericos. Se recibio "${valor}".`
    };
  }

  // Validacion de modulo 11
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuilStr[i]) * multiplicadores[i];
  }

  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

  if (parseInt(cuilStr[10]) !== digitoVerificador) {
    return {
      valido: false,
      mensaje: `CUIL invalido: el digito verificador no es correcto. Se recibio "${valor}".`
    };
  }

  return { valido: true };
}

// Validar codigo de colegio (NIVEL-NNN)
function validarCodigoColegio(valor: unknown): { valido: boolean; mensaje?: string } {
  if (valor === null || valor === undefined || valor === '') {
    return { valido: false, mensaje: 'Codigo de colegio invalido: el campo es obligatorio.' };
  }

  const codigoStr = String(valor).trim().toUpperCase();
  const regex = /^(P|PE|PP|PS|PT)-\d{1,4}$/;

  if (!regex.test(codigoStr)) {
    return {
      valido: false,
      mensaje: `Codigo de colegio invalido: debe usar el formato NIVEL-NUMERO (ej: P-001, PS-102). Se recibio "${valor}".`
    };
  }

  return { valido: true };
}

// Validar nivel
function validarNivel(valor: unknown): { valido: boolean; mensaje?: string } {
  if (valor === null || valor === undefined || valor === '') {
    return { valido: false, mensaje: 'Nivel invalido: el campo es obligatorio.' };
  }

  const nivelStr = String(valor).trim().toUpperCase();

  if (!NIVELES_VALIDOS.includes(nivelStr)) {
    return {
      valido: false,
      mensaje: `Nivel invalido: debe ser uno de ${NIVELES_VALIDOS.join(', ')}. Se recibio "${valor}".`
    };
  }

  return { valido: true };
}

// Validar datos de cada fila
export async function validarDatos(buffer: ArrayBuffer | Buffer): Promise<ResultadoValidacion> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);

  const hoja = workbook.getWorksheet(NOMBRE_HOJA_ESPERADO)!;
  const errores: ErrorValidacion[] = [];
  let totalFilas = 0;
  const filasConError = new Set<number>();

  // Obtener indices de columnas
  const primeraFila = hoja.getRow(1);
  const indiceColumnas: { [key: string]: number } = {};

  primeraFila.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const nombre = String(cell.value || '').trim().toLowerCase();
    indiceColumnas[nombre] = colNumber;
  });

  // Iterar sobre filas de datos (desde fila 2)
  hoja.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Saltar encabezado

    totalFilas++;
    const filaNum = rowNumber;

    // Validar DNI
    const dniCol = indiceColumnas['dni'];
    if (dniCol) {
      const dniValor = row.getCell(dniCol).value;
      const resultDNI = validarDNI(dniValor);
      if (!resultDNI.valido) {
        errores.push({
          fila: filaNum,
          columna: 'DNI',
          valor: String(dniValor || ''),
          mensaje: resultDNI.mensaje!
        });
        filasConError.add(filaNum);
      }
    }

    // Validar Legajo
    const legajoCol = indiceColumnas['legajo'];
    if (legajoCol) {
      const legajoValor = row.getCell(legajoCol).value;
      const resultLegajo = validarLegajo(legajoValor);
      if (!resultLegajo.valido) {
        errores.push({
          fila: filaNum,
          columna: 'Legajo',
          valor: String(legajoValor || ''),
          mensaje: resultLegajo.mensaje!
        });
        filasConError.add(filaNum);
      }
    }

    // Validar CUIL
    const cuilCol = indiceColumnas['cuil'];
    if (cuilCol) {
      const cuilValor = row.getCell(cuilCol).value;
      const resultCUIL = validarCUIL(cuilValor);
      if (!resultCUIL.valido) {
        errores.push({
          fila: filaNum,
          columna: 'CUIL',
          valor: String(cuilValor || ''),
          mensaje: resultCUIL.mensaje!
        });
        filasConError.add(filaNum);
      }
    }

    // Validar Colegio
    const colegioCol = indiceColumnas['colegio'];
    if (colegioCol) {
      const colegioValor = row.getCell(colegioCol).value;
      const resultColegio = validarCodigoColegio(colegioValor);
      if (!resultColegio.valido) {
        errores.push({
          fila: filaNum,
          columna: 'Colegio',
          valor: String(colegioValor || ''),
          mensaje: resultColegio.mensaje!
        });
        filasConError.add(filaNum);
      }
    }

    // Validar Nivel
    const nivelCol = indiceColumnas['nivel'];
    if (nivelCol) {
      const nivelValor = row.getCell(nivelCol).value;
      const resultNivel = validarNivel(nivelValor);
      if (!resultNivel.valido) {
        errores.push({
          fila: filaNum,
          columna: 'NIVEL',
          valor: String(nivelValor || ''),
          mensaje: resultNivel.mensaje!
        });
        filasConError.add(filaNum);
      }
    }
  });

  return {
    valido: errores.length === 0,
    errores,
    totalFilas,
    filasConError: filasConError.size
  };
}

// Extraer datos del Excel validado
export async function extraerDatos(buffer: ArrayBuffer | Buffer): Promise<DatosExcelFila[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);

  const hoja = workbook.getWorksheet(NOMBRE_HOJA_ESPERADO)!;
  const datos: DatosExcelFila[] = [];

  // Obtener indices de columnas
  const primeraFila = hoja.getRow(1);
  const indiceColumnas: { [key: string]: number } = {};

  primeraFila.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const nombre = String(cell.value || '').trim().toLowerCase();
    for (const col of COLUMNAS_PLANTILLA) {
      if (col.nombre.toLowerCase() === nombre) {
        indiceColumnas[col.campo] = colNumber;
        break;
      }
    }
  });

  // Extraer datos de cada fila
  hoja.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const getCellValue = (campo: string): unknown => {
      const col = indiceColumnas[campo];
      if (!col) return undefined;
      return row.getCell(col).value;
    };

    const getStringValue = (campo: string): string | undefined => {
      const val = getCellValue(campo);
      return val != null ? String(val).trim() : undefined;
    };

    const getNumberValue = (campo: string): number | undefined => {
      const val = getCellValue(campo);
      if (val == null) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    const fila: DatosExcelFila = {
      fila: rowNumber,
      colegio: getStringValue('colegio'),
      nivel: getStringValue('nivel')?.toUpperCase(),
      legajo: getStringValue('legajo')?.padStart(3, '0'),
      apellido: getStringValue('apellido'),
      nombres: getStringValue('nombres'),
      dni: getStringValue('dni')?.replace(/\./g, ''),
      cuil: getStringValue('cuil')?.replace(/[-\s]/g, ''),
      fecha_nacimiento: getCellValue('fecha_nacimiento') as Date | undefined,
      situacion_revista: getStringValue('situacion_revista'),
      cargo: getStringValue('cargo'),
      puntaje: getNumberValue('puntaje'),
      horas: getNumberValue('horas'),
      asistencia_dias: getNumberValue('asistencia_dias'),
      inasistencia_dias: getNumberValue('inasistencia_dias'),
      antiguedad_anos: getNumberValue('antiguedad_anos'),
      sueldo_basico: getNumberValue('sueldo_basico'),
      antiguedad_monto: getNumberValue('antiguedad_monto'),
      presentismo: getNumberValue('presentismo'),
      zona: getNumberValue('zona'),
      item_arraigo: getNumberValue('item_arraigo'),
      adicional_directivo: getNumberValue('adicional_directivo'),
      otros_adicionales: getNumberValue('otros_adicionales'),
      total_remunerativo: getNumberValue('total_remunerativo'),
      jubilacion: getNumberValue('jubilacion'),
      obra_social: getNumberValue('obra_social'),
      sindicato: getNumberValue('sindicato'),
      otros_descuentos: getNumberValue('otros_descuentos'),
      total_deducciones: getNumberValue('total_deducciones'),
      sueldo_neto: getNumberValue('sueldo_neto'),
    };

    datos.push(fila);
  });

  return datos;
}
