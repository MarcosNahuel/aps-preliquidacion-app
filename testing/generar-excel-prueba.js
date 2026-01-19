// Script para generar archivos Excel de prueba
// Ejecutar: node testing/generar-excel-prueba.js

const ExcelJS = require('exceljs');
const path = require('path');

// Columnas del Excel (basado en columns.ts)
const COLUMNAS = [
  'Colegio', 'Legajo', 'Apellido y Nombres', 'C.U.I.L.', 'Cargo', 'Puntaje', 'Horas', 'Asist.',
  'Años', 'Mes', '% Antig,',
  'Años Ant.\nArraig', 'Porc. Ant.\nArraig', 'Hs.\npara\nArraig',
  'Asigación Clase', 'Estado Docente', 'Antigue-dad', 'Zona', 'Presen-tismo', 'Bono Remunerat.',
  'Adicion. Direct.', 'Garantia Remunerat.', 'Item Aula', 'Otros', 'Item Arraigo', 'Item especializac',
  'Sueldo Bruto', 'Diferencias\nParitarias Remunerat.', 'S.Bruto \nTotal',
  'Salario Familiar', 'Ayuda Escolar', 'Ayuda \nUtiles', 'No Remun.\nGtia. Nacional',
  'No Remun.\nGtia. Provincial', 'No Remun.\nDiferencias', 'Bono No Remunerat.\nOtros',
  'Incentivo Docente', 'Conectividad', 'Otros',
  'Total de \nHaberes',
  'Jubilación', 'O.Social', 'Sindicato', 'Caja \nComplem.', 'Otros Descuentos', 'Total \nDescuentos',
  'Neto',
  'Nivel', 'Tipo Planta', 'Tipo Liquidacion'
];

async function generarExcelCorrecto() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PRELIQ-DGE Testing';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Libro Primario');

  // Configurar encabezados
  hoja.columns = COLUMNAS.map((nombre, index) => ({
    header: nombre,
    key: `col_${index}`,
    width: 15
  }));

  // Estilo de encabezados
  const headerRow = hoja.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.height = 40;

  // Datos de prueba CORRECTOS - Colegio P-001 (Primario)
  const datosCorrectos = [
    {
      colegio: 'P-001', legajo: '001', nombre: 'GONZALEZ, MARIA ELENA', cuil: '27234567891',
      cargo: 'MAESTRA DE GRADO', puntaje: 85, horas: 20, asist: 22,
      anosAnt: 15, mesAnt: 6, porcAnt: 75,
      anosArraigo: 10, porcArraigo: 50, hsArraigo: 20,
      asigClase: 150000, estadoDoc: 'TITULAR', antiguedad: 112500, zona: 30000,
      presentismo: 15000, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 25000, otros: 0, itemArraigo: 45000, itemEspec: 0,
      sueldoBruto: 377500, difParit: 0, brutTotal: 377500,
      salFam: 12000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 15000, conectiv: 5000, otrosNoRem: 0,
      totalHab: 409500,
      jubilacion: 41625, obraSocial: 11325, sindicato: 7550, cajaCompl: 3775, otrosDesc: 0, totalDesc: 64275,
      neto: 345225,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    {
      colegio: 'P-001', legajo: '002', nombre: 'RODRIGUEZ, JUAN CARLOS', cuil: '20198765432',
      cargo: 'PROFESOR DE EDUCACION FISICA', puntaje: 72, horas: 12, asist: 22,
      anosAnt: 8, mesAnt: 3, porcAnt: 40,
      anosArraigo: 5, porcArraigo: 25, hsArraigo: 12,
      asigClase: 90000, estadoDoc: 'TITULAR', antiguedad: 36000, zona: 18000,
      presentismo: 9000, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 15000, otros: 0, itemArraigo: 18000, itemEspec: 0,
      sueldoBruto: 186000, difParit: 0, brutTotal: 186000,
      salFam: 24000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 9000, conectiv: 3000, otrosNoRem: 0,
      totalHab: 222000,
      jubilacion: 20460, obraSocial: 5580, sindicato: 3720, cajaCompl: 1860, otrosDesc: 0, totalDesc: 31620,
      neto: 190380,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    {
      colegio: 'P-001', legajo: '003', nombre: 'MARTINEZ, ANA LUCIA', cuil: '27301234567',
      cargo: 'DIRECTORA', puntaje: 95, horas: 36, asist: 22,
      anosAnt: 25, mesAnt: 0, porcAnt: 120,
      anosArraigo: 20, porcArraigo: 100, hsArraigo: 36,
      asigClase: 270000, estadoDoc: 'TITULAR', antiguedad: 324000, zona: 54000,
      presentismo: 27000, bonoRemun: 0, adicDirectivo: 85000, gtiaRemun: 0,
      itemAula: 0, otros: 0, itemArraigo: 135000, itemEspec: 15000,
      sueldoBruto: 910000, difParit: 0, brutTotal: 910000,
      salFam: 0, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 27000, conectiv: 9000, otrosNoRem: 0,
      totalHab: 946000,
      jubilacion: 100100, obraSocial: 27300, sindicato: 18200, cajaCompl: 9100, otrosDesc: 0, totalDesc: 154700,
      neto: 791300,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    {
      colegio: 'P-001', legajo: '004', nombre: 'LOPEZ, CARLOS ALBERTO', cuil: '20256789012',
      cargo: 'MAESTRO DE MUSICA', puntaje: 68, horas: 8, asist: 20,
      anosAnt: 5, mesAnt: 9, porcAnt: 25,
      anosArraigo: 3, porcArraigo: 15, hsArraigo: 8,
      asigClase: 60000, estadoDoc: 'SUPLENTE', antiguedad: 15000, zona: 12000,
      presentismo: 5455, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 10000, otros: 0, itemArraigo: 7200, itemEspec: 0,
      sueldoBruto: 109655, difParit: 0, brutTotal: 109655,
      salFam: 18000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 6000, conectiv: 2000, otrosNoRem: 0,
      totalHab: 135655,
      jubilacion: 12062, obraSocial: 3290, sindicato: 2193, cajaCompl: 1097, otrosDesc: 0, totalDesc: 18642,
      neto: 117013,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    {
      colegio: 'P-001', legajo: '005', nombre: 'FERNANDEZ, LAURA BEATRIZ', cuil: '27289012345',
      cargo: 'SECRETARIA', puntaje: 78, horas: 36, asist: 22,
      anosAnt: 12, mesAnt: 4, porcAnt: 60,
      anosArraigo: 8, porcArraigo: 40, hsArraigo: 36,
      asigClase: 200000, estadoDoc: 'TITULAR', antiguedad: 120000, zona: 40000,
      presentismo: 20000, bonoRemun: 0, adicDirectivo: 45000, gtiaRemun: 0,
      itemAula: 0, otros: 0, itemArraigo: 64000, itemEspec: 0,
      sueldoBruto: 489000, difParit: 0, brutTotal: 489000,
      salFam: 12000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 18000, conectiv: 6000, otrosNoRem: 0,
      totalHab: 525000,
      jubilacion: 53790, obraSocial: 14670, sindicato: 9780, cajaCompl: 4890, otrosDesc: 0, totalDesc: 83130,
      neto: 441870,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    }
  ];

  // Agregar filas de datos
  datosCorrectos.forEach(d => {
    hoja.addRow([
      d.colegio, d.legajo, d.nombre, d.cuil, d.cargo, d.puntaje, d.horas, d.asist,
      d.anosAnt, d.mesAnt, d.porcAnt,
      d.anosArraigo, d.porcArraigo, d.hsArraigo,
      d.asigClase, d.estadoDoc, d.antiguedad, d.zona, d.presentismo, d.bonoRemun,
      d.adicDirectivo, d.gtiaRemun, d.itemAula, d.otros, d.itemArraigo, d.itemEspec,
      d.sueldoBruto, d.difParit, d.brutTotal,
      d.salFam, d.ayudaEsc, d.ayudaUtil, d.noRemunNac,
      d.noRemunProv, d.noRemunDif, d.bonoNoRemun,
      d.incentDoc, d.conectiv, d.otrosNoRem,
      d.totalHab,
      d.jubilacion, d.obraSocial, d.sindicato, d.cajaCompl, d.otrosDesc, d.totalDesc,
      d.neto,
      d.nivel, d.tipoPlanta, d.tipoLiq
    ]);
  });

  // Guardar archivo
  const rutaArchivo = path.join(__dirname, 'P-001_correcto_prueba.xlsx');
  await workbook.xlsx.writeFile(rutaArchivo);
  console.log(`Archivo correcto creado: ${rutaArchivo}`);
  return rutaArchivo;
}

async function generarExcelConErrores() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PRELIQ-DGE Testing';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet('Libro Primario');

  // Configurar encabezados
  hoja.columns = COLUMNAS.map((nombre, index) => ({
    header: nombre,
    key: `col_${index}`,
    width: 15
  }));

  // Estilo de encabezados
  const headerRow = hoja.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.height = 40;

  // Datos con ERRORES intencionales
  const datosConErrores = [
    // Fila 1: CUIL invalido (10 digitos en vez de 11)
    {
      colegio: 'P-001', legajo: '001', nombre: 'PEREZ, ROBERTO', cuil: '2723456789', // ERROR: CUIL con 10 digitos
      cargo: 'MAESTRO DE GRADO', puntaje: 80, horas: 20, asist: 22,
      anosAnt: 10, mesAnt: 0, porcAnt: 50,
      anosArraigo: 8, porcArraigo: 40, hsArraigo: 20,
      asigClase: 150000, estadoDoc: 'TITULAR', antiguedad: 75000, zona: 30000,
      presentismo: 15000, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 25000, otros: 0, itemArraigo: 36000, itemEspec: 0,
      sueldoBruto: 331000, difParit: 0, brutTotal: 331000,
      salFam: 12000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 15000, conectiv: 5000, otrosNoRem: 0,
      totalHab: 363000,
      jubilacion: 36410, obraSocial: 9930, sindicato: 6620, cajaCompl: 3310, otrosDesc: 0, totalDesc: 56270,
      neto: 306730,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    // Fila 2: Colegio con formato invalido
    {
      colegio: 'PRIMARIO-001', // ERROR: formato de colegio invalido
      legajo: '002', nombre: 'SANCHEZ, MARIA', cuil: '27198765432',
      cargo: 'PROFESORA DE INGLES', puntaje: 75, horas: 16, asist: 22,
      anosAnt: 6, mesAnt: 8, porcAnt: 35,
      anosArraigo: 4, porcArraigo: 20, hsArraigo: 16,
      asigClase: 120000, estadoDoc: 'TITULAR', antiguedad: 42000, zona: 24000,
      presentismo: 12000, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 20000, otros: 0, itemArraigo: 19200, itemEspec: 0,
      sueldoBruto: 237200, difParit: 0, brutTotal: 237200,
      salFam: 18000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 12000, conectiv: 4000, otrosNoRem: 0,
      totalHab: 271200,
      jubilacion: 26092, obraSocial: 7116, sindicato: 4744, cajaCompl: 2372, otrosDesc: 0, totalDesc: 40324,
      neto: 230876,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    // Fila 3: Legajo vacio
    {
      colegio: 'P-001', legajo: '', // ERROR: legajo vacio (obligatorio)
      nombre: 'TORRES, PABLO', cuil: '20301234567',
      cargo: 'PROFESOR DE MATEMATICAS', puntaje: 82, horas: 18, asist: 21,
      anosAnt: 9, mesAnt: 5, porcAnt: 45,
      anosArraigo: 6, porcArraigo: 30, hsArraigo: 18,
      asigClase: 135000, estadoDoc: 'TITULAR', antiguedad: 60750, zona: 27000,
      presentismo: 12886, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 22500, otros: 0, itemArraigo: 32400, itemEspec: 0,
      sueldoBruto: 290536, difParit: 0, brutTotal: 290536,
      salFam: 0, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 13500, conectiv: 4500, otrosNoRem: 0,
      totalHab: 308536,
      jubilacion: 31959, obraSocial: 8716, sindicato: 5811, cajaCompl: 2905, otrosDesc: 0, totalDesc: 49391,
      neto: 259145,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    // Fila 4: Horas negativas
    {
      colegio: 'P-001', legajo: '004', nombre: 'DIAZ, CAROLINA', cuil: '27267890123',
      cargo: 'MAESTRA JARDINERA', puntaje: 70, horas: -5, // ERROR: horas negativas
      asist: 22,
      anosAnt: 3, mesAnt: 2, porcAnt: 15,
      anosArraigo: 2, porcArraigo: 10, hsArraigo: 20,
      asigClase: 150000, estadoDoc: 'SUPLENTE', antiguedad: 22500, zona: 30000,
      presentismo: 15000, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 25000, otros: 0, itemArraigo: 12000, itemEspec: 0,
      sueldoBruto: 254500, difParit: 0, brutTotal: 254500,
      salFam: 24000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 15000, conectiv: 5000, otrosNoRem: 0,
      totalHab: 298500,
      jubilacion: 27995, obraSocial: 7635, sindicato: 5090, cajaCompl: 2545, otrosDesc: 0, totalDesc: 43265,
      neto: 255235,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    // Fila 5: Nivel invalido
    {
      colegio: 'P-001', legajo: '005', nombre: 'GOMEZ, FEDERICO', cuil: '20289012345',
      cargo: 'PROFESOR DE HISTORIA', puntaje: 77, horas: 14, asist: 22,
      anosAnt: 7, mesAnt: 10, porcAnt: 40,
      anosArraigo: 5, porcArraigo: 25, hsArraigo: 14,
      asigClase: 105000, estadoDoc: 'TITULAR', antiguedad: 42000, zona: 21000,
      presentismo: 10500, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 17500, otros: 0, itemArraigo: 21000, itemEspec: 0,
      sueldoBruto: 217000, difParit: 0, brutTotal: 217000,
      salFam: 12000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 10500, conectiv: 3500, otrosNoRem: 0,
      totalHab: 243000,
      jubilacion: 23870, obraSocial: 6510, sindicato: 4340, cajaCompl: 2170, otrosDesc: 0, totalDesc: 36890,
      neto: 206110,
      nivel: 'PRIMARIO', // ERROR: nivel debe ser P, no PRIMARIO
      tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    },
    // Fila 6: Sueldo bruto texto en vez de numero
    {
      colegio: 'P-001', legajo: '006', nombre: 'RUIZ, VERONICA', cuil: '27256789012',
      cargo: 'BIBLIOTECARIA', puntaje: 65, horas: 20, asist: 22,
      anosAnt: 4, mesAnt: 6, porcAnt: 20,
      anosArraigo: 3, porcArraigo: 15, hsArraigo: 20,
      asigClase: 140000, estadoDoc: 'TITULAR', antiguedad: 28000, zona: 28000,
      presentismo: 14000, bonoRemun: 0, adicDirectivo: 0, gtiaRemun: 0,
      itemAula: 23333, otros: 0, itemArraigo: 16800, itemEspec: 0,
      sueldoBruto: 'DOSCIENTOS MIL', // ERROR: texto en vez de numero
      difParit: 0, brutTotal: 250133,
      salFam: 18000, ayudaEsc: 0, ayudaUtil: 0, noRemunNac: 0,
      noRemunProv: 0, noRemunDif: 0, bonoNoRemun: 0,
      incentDoc: 14000, conectiv: 4667, otrosNoRem: 0,
      totalHab: 286800,
      jubilacion: 27515, obraSocial: 7504, sindicato: 5003, cajaCompl: 2501, otrosDesc: 0, totalDesc: 42523,
      neto: 244277,
      nivel: 'P', tipoPlanta: 'DOCENTE', tipoLiq: 'MENSUAL'
    }
  ];

  // Agregar filas de datos con errores
  datosConErrores.forEach(d => {
    hoja.addRow([
      d.colegio, d.legajo, d.nombre, d.cuil, d.cargo, d.puntaje, d.horas, d.asist,
      d.anosAnt, d.mesAnt, d.porcAnt,
      d.anosArraigo, d.porcArraigo, d.hsArraigo,
      d.asigClase, d.estadoDoc, d.antiguedad, d.zona, d.presentismo, d.bonoRemun,
      d.adicDirectivo, d.gtiaRemun, d.itemAula, d.otros, d.itemArraigo, d.itemEspec,
      d.sueldoBruto, d.difParit, d.brutTotal,
      d.salFam, d.ayudaEsc, d.ayudaUtil, d.noRemunNac,
      d.noRemunProv, d.noRemunDif, d.bonoNoRemun,
      d.incentDoc, d.conectiv, d.otrosNoRem,
      d.totalHab,
      d.jubilacion, d.obraSocial, d.sindicato, d.cajaCompl, d.otrosDesc, d.totalDesc,
      d.neto,
      d.nivel, d.tipoPlanta, d.tipoLiq
    ]);
  });

  // Resaltar filas con errores conocidos
  [2, 3, 4, 5, 6, 7].forEach(filaNum => {
    const fila = hoja.getRow(filaNum);
    fila.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' } // Amarillo advertencia
      };
    });
  });

  // Guardar archivo
  const rutaArchivo = path.join(__dirname, 'P-001_con_errores_prueba.xlsx');
  await workbook.xlsx.writeFile(rutaArchivo);
  console.log(`Archivo con errores creado: ${rutaArchivo}`);
  return rutaArchivo;
}

async function main() {
  console.log('Generando archivos Excel de prueba...\n');

  try {
    await generarExcelCorrecto();
    await generarExcelConErrores();

    console.log('\n=== RESUMEN DE ARCHIVOS CREADOS ===');
    console.log('1. P-001_correcto_prueba.xlsx - 5 registros validos');
    console.log('2. P-001_con_errores_prueba.xlsx - 6 registros con errores:\n');
    console.log('   ERRORES ESPERADOS:');
    console.log('   - Fila 2: CUIL con 10 digitos (debe tener 11)');
    console.log('   - Fila 3: Codigo de colegio invalido (PRIMARIO-001)');
    console.log('   - Fila 4: Legajo vacio (campo obligatorio)');
    console.log('   - Fila 5: Horas negativas (-5)');
    console.log('   - Fila 6: Nivel invalido (PRIMARIO en vez de P)');
    console.log('   - Fila 7: Sueldo bruto como texto');

  } catch (error) {
    console.error('Error generando archivos:', error);
    process.exit(1);
  }
}

main();
