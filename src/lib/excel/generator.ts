import ExcelJS from 'exceljs';
import { COLUMNAS_PLANTILLA, NOMBRE_HOJA_ESPERADO } from './columns';
import type { ErrorValidacion } from '@/types/database';

// Generar plantilla Excel modelo vacia
export async function generarPlantillaModelo(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema APS Preliquidacion';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet(NOMBRE_HOJA_ESPERADO);

  // Configurar columnas con encabezados
  hoja.columns = COLUMNAS_PLANTILLA.map((col, index) => ({
    header: col.nombre,
    key: col.campo,
    width: col.nombre.length + 5,
  }));

  // Estilo de encabezados
  const headerRow = hoja.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' } // Azul oscuro
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  // Marcar columnas obligatorias con color diferente
  COLUMNAS_PLANTILLA.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    if (col.obligatorio) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF991B1B' } // Rojo oscuro para obligatorios
      };
      cell.value = `${col.nombre} *`;
    }
  });

  // Agregar filas de ejemplo con datos graciosos
  const ejemplos = [
    {
      colegio: 'P-001',
      legajo: '001',
      apellido: 'SIMPSON',
      nombres: 'HOMERO JAY',
      dni: '20456789',
      cuil: '20204567891',
      situacion_revista: 'TITULAR',
      cargo: 'INSPECTOR DE SEGURIDAD NUCLEAR',
      horas: 40,
      sueldo_basico: 350000,
      total_remunerativo: 420000,
      sueldo_neto: 380000,
      nivel: 'P'
    },
    {
      colegio: 'P-001',
      legajo: '002',
      apellido: 'SIMPSON',
      nombres: 'MARJORIE BOUVIER',
      dni: '21567890',
      cuil: '27215678901',
      situacion_revista: 'TITULAR',
      cargo: 'MAESTRA DE GRADO',
      horas: 18,
      sueldo_basico: 280000,
      total_remunerativo: 340000,
      sueldo_neto: 310000,
      nivel: 'P'
    },
    {
      colegio: 'P-001',
      legajo: '003',
      apellido: 'FLANDERS',
      nombres: 'NEDWARD',
      dni: '18234567',
      cuil: '20182345671',
      situacion_revista: 'SUPLENTE',
      cargo: 'PROFESOR DE EDUCACION RELIGIOSA',
      horas: 12,
      sueldo_basico: 180000,
      total_remunerativo: 220000,
      sueldo_neto: 195000,
      nivel: 'P'
    },
    {
      colegio: 'PS-102',
      legajo: '004',
      apellido: 'SKINNER',
      nombres: 'SEYMOUR ARMIN',
      dni: '16789012',
      cuil: '20167890122',
      situacion_revista: 'TITULAR',
      cargo: 'DIRECTOR',
      horas: 36,
      sueldo_basico: 450000,
      total_remunerativo: 580000,
      sueldo_neto: 520000,
      nivel: 'PS'
    },
    {
      colegio: 'PS-102',
      legajo: '005',
      apellido: 'KRABAPPEL',
      nombres: 'EDNA',
      dni: '19345678',
      cuil: '27193456782',
      situacion_revista: 'TITULAR',
      cargo: 'PROFESORA DE LENGUA',
      horas: 24,
      sueldo_basico: 320000,
      total_remunerativo: 400000,
      sueldo_neto: 365000,
      nivel: 'PS'
    },
    {
      colegio: 'PT-050',
      legajo: '006',
      apellido: 'FRINK',
      nombres: 'JOHN NERDELBAUM',
      dni: '15678901',
      cuil: '20156789013',
      situacion_revista: 'TITULAR',
      cargo: 'PROFESOR DE FISICA CUANTICA',
      horas: 20,
      sueldo_basico: 380000,
      total_remunerativo: 460000,
      sueldo_neto: 420000,
      nivel: 'PT'
    }
  ];

  ejemplos.forEach((ejemplo, index) => {
    const row = hoja.addRow(ejemplo);
    row.font = { italic: true, color: { argb: 'FF666666' } };
  });

  // Nota al final
  const notaRow = hoja.addRow({});
  const notaRow2 = hoja.addRow({ colegio: '** ELIMINE ESTAS FILAS DE EJEMPLO ANTES DE CARGAR SUS DATOS REALES **' });
  notaRow2.font = { bold: true, color: { argb: 'FFDC2626' } };

  // Agregar notas/instrucciones en hoja separada
  const instrucciones = workbook.addWorksheet('Instrucciones');
  instrucciones.columns = [{ header: 'Instrucciones para completar la planilla', width: 100 }];

  const instruccionesTexto = [
    '',
    'IMPORTANTE: Esta plantilla es de uso obligatorio para la presentacion de preliquidaciones.',
    '',
    'COLUMNAS OBLIGATORIAS (marcadas con *):',
    '- Colegio: Codigo del colegio en formato NIVEL-NUMERO (ej: P-001, PS-102)',
    '- Legajo: Codigo interno del docente, de 1 a 3 digitos numericos',
    '- DNI: Numero de documento, solo numeros sin puntos',
    '- NIVEL: Codigo del nivel educativo (P, PE, PP, PS, PT)',
    '',
    'FORMATO DE DATOS:',
    '- DNI: Solo numeros, sin puntos (ej: 30123456)',
    '- CUIL: 11 digitos numericos, sin guiones (ej: 20301234567)',
    '- Importes: Numeros sin simbolo de moneda ni separadores de miles',
    '',
    'NIVELES VALIDOS:',
    '- P: Primario',
    '- PE: Especial',
    '- PP: Primario Especial',
    '- PS: Secundario',
    '- PT: Terciario',
    '',
    'NO MODIFIQUE:',
    '- Nombres de las hojas',
    '- Nombres de las columnas',
    '- Orden de las columnas',
    '- No agregue columnas adicionales',
    '',
    'Si el archivo es rechazado, corriga los errores indicados y vuelva a subirlo.',
  ];

  instruccionesTexto.forEach((texto, index) => {
    const row = instrucciones.addRow([texto]);
    if (texto.startsWith('IMPORTANTE') || texto.startsWith('NO MODIFIQUE')) {
      row.font = { bold: true, color: { argb: 'FFDC2626' } };
    } else if (texto.endsWith(':')) {
      row.font = { bold: true };
    }
  });

  // Generar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Generar Excel con errores (archivo original + columna de errores)
export async function generarExcelConErrores(
  bufferOriginal: ArrayBuffer | Buffer,
  errores: ErrorValidacion[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bufferOriginal as ArrayBuffer);

  const hoja = workbook.getWorksheet(NOMBRE_HOJA_ESPERADO);
  if (!hoja) throw new Error('Hoja no encontrada');

  // Agregar columna de errores al final
  const ultimaColumna = hoja.columnCount + 1;
  const columnaErrores = hoja.getColumn(ultimaColumna);
  columnaErrores.header = 'ERRORES';
  columnaErrores.width = 60;

  // Estilo del encabezado de errores
  const headerCell = hoja.getRow(1).getCell(ultimaColumna);
  headerCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDC2626' } // Rojo
  };

  // Agrupar errores por fila
  const erroresPorFila: { [fila: number]: string[] } = {};
  for (const error of errores) {
    if (!erroresPorFila[error.fila]) {
      erroresPorFila[error.fila] = [];
    }
    erroresPorFila[error.fila].push(`[${error.columna}] ${error.mensaje}`);
  }

  // Agregar errores a cada fila
  for (const [filaStr, mensajes] of Object.entries(erroresPorFila)) {
    const fila = parseInt(filaStr);
    const row = hoja.getRow(fila);
    const cell = row.getCell(ultimaColumna);
    cell.value = mensajes.join('\n');
    cell.alignment = { wrapText: true, vertical: 'top' };
    cell.font = { color: { argb: 'FFDC2626' } };

    // Resaltar fila con error
    row.eachCell({ includeEmpty: false }, (c) => {
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' } // Rojo claro
      };
    });
  }

  // Agregar hoja de resumen de errores
  const resumen = workbook.addWorksheet('Resumen de Errores');
  resumen.columns = [
    { header: 'Fila', key: 'fila', width: 10 },
    { header: 'Columna', key: 'columna', width: 20 },
    { header: 'Valor Recibido', key: 'valor', width: 25 },
    { header: 'Mensaje de Error', key: 'mensaje', width: 70 },
  ];

  // Estilo de encabezados
  const resumenHeader = resumen.getRow(1);
  resumenHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  resumenHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };

  // Agregar cada error
  errores.forEach(error => {
    resumen.addRow({
      fila: error.fila,
      columna: error.columna,
      valor: error.valor,
      mensaje: error.mensaje
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Generar Excel consolidado de liquidaciones
export async function generarExcelConsolidado(
  liquidaciones: unknown[],
  nombreArchivo: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema APS Preliquidacion';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Consolidado');

  // Configurar columnas
  hoja.columns = [
    { header: 'Colegio', key: 'colegio', width: 12 },
    { header: 'Nivel', key: 'nivel', width: 8 },
    { header: 'Legajo', key: 'legajo', width: 10 },
    { header: 'DNI', key: 'dni', width: 12 },
    { header: 'CUIL', key: 'cuil', width: 15 },
    { header: 'Apellido', key: 'apellido', width: 20 },
    { header: 'Nombres', key: 'nombres', width: 25 },
    { header: 'Cargo', key: 'cargo', width: 30 },
    { header: 'Horas', key: 'horas', width: 8 },
    { header: 'Sueldo Basico', key: 'sueldo_basico', width: 15 },
    { header: 'Total Remunerativo', key: 'total_remunerativo', width: 18 },
    { header: 'Total Deducciones', key: 'total_deducciones', width: 18 },
    { header: 'Sueldo Neto', key: 'sueldo_neto', width: 15 },
    { header: 'Item Arraigo', key: 'item_arraigo', width: 15 },
  ];

  // Estilo de encabezados
  const headerRow = hoja.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };

  // Agregar datos
  liquidaciones.forEach((liq: unknown) => {
    hoja.addRow(liq as Record<string, unknown>);
  });

  // Formato de moneda para columnas de importes
  const columnasMonto = ['sueldo_basico', 'total_remunerativo', 'total_deducciones', 'sueldo_neto', 'item_arraigo'];
  hoja.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    columnasMonto.forEach(col => {
      const cell = row.getCell(col);
      if (cell.value) {
        cell.numFmt = '$#,##0.00';
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
