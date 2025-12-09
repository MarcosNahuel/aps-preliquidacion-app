// Script para generar 5 archivos Excel de prueba
// Ejecutar con: node scripts/generar-excel-prueba.js

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Nombre de hoja esperado
const NOMBRE_HOJA = 'Libro Primario';

// Columnas exactas según columns.ts
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
  'Neto', 'Firmas'
];

// Datos de docentes de prueba
const DOCENTES_BASE = [
  {
    apellido: 'GONZALEZ MARIA ELENA',
    cuil: '27234567891',
    cargo: 'MAESTRA DE GRADO',
    puntaje: 85,
    horas: 20,
    asistencia: 22,
    anos: 15,
    mes: 6,
    porcentajeAnt: 45,
    anosArraigo: 12,
    porcArraigo: 36,
    hsArraigo: 20
  },
  {
    apellido: 'RODRIGUEZ JUAN CARLOS',
    cuil: '20187654329',
    cargo: 'PROFESOR DE MATEMATICAS',
    puntaje: 92,
    horas: 18,
    asistencia: 20,
    anos: 20,
    mes: 3,
    porcentajeAnt: 60,
    anosArraigo: 18,
    porcArraigo: 54,
    hsArraigo: 18
  },
  {
    apellido: 'FERNANDEZ ANA LUCIA',
    cuil: '27298765432',
    cargo: 'DIRECTORA',
    puntaje: 98,
    horas: 36,
    asistencia: 22,
    anos: 25,
    mes: 0,
    porcentajeAnt: 75,
    anosArraigo: 22,
    porcArraigo: 66,
    hsArraigo: 36
  },
  {
    apellido: 'MARTINEZ PEDRO PABLO',
    cuil: '20156789012',
    cargo: 'PRECEPTOR',
    puntaje: 78,
    horas: 30,
    asistencia: 21,
    anos: 10,
    mes: 8,
    porcentajeAnt: 30,
    anosArraigo: 8,
    porcArraigo: 24,
    hsArraigo: 30
  },
  {
    apellido: 'LOPEZ SANDRA BEATRIZ',
    cuil: '27321098765',
    cargo: 'PROFESORA DE LENGUA',
    puntaje: 88,
    horas: 24,
    asistencia: 22,
    anos: 18,
    mes: 4,
    porcentajeAnt: 54,
    anosArraigo: 15,
    porcArraigo: 45,
    hsArraigo: 24
  }
];

// Función para crear fila de datos
function crearFilaDatos(colegio, legajo, docente) {
  // Calcular valores monetarios basados en horas y antigüedad
  const sueldoBase = docente.horas * 15000;
  const antiguedadMonto = sueldoBase * (docente.porcentajeAnt / 100);
  const zona = sueldoBase * 0.05;
  const presentismo = sueldoBase * 0.10;
  const bonoRemun = 25000;
  const itemAula = docente.horas >= 20 ? 35000 : 20000;
  const itemArraigo = docente.hsArraigo * 1200;

  const sueldoBruto = sueldoBase + antiguedadMonto + zona + presentismo + bonoRemun + itemAula + itemArraigo;
  const difParitarias = sueldoBruto * 0.02;
  const sueldoBrutoTotal = sueldoBruto + difParitarias;

  const salarioFamiliar = 15000;
  const incentivo = 8500;
  const conectividad = 5000;

  const totalHaberes = sueldoBrutoTotal + salarioFamiliar + incentivo + conectividad;

  const jubilacion = sueldoBrutoTotal * 0.11;
  const obraSocial = sueldoBrutoTotal * 0.03;
  const sindicato = sueldoBrutoTotal * 0.02;
  const cajaComplem = sueldoBrutoTotal * 0.02;

  const totalDescuentos = jubilacion + obraSocial + sindicato + cajaComplem;
  const neto = totalHaberes - totalDescuentos;

  return {
    colegio: colegio,
    legajo: legajo.toString().padStart(3, '0'),
    apellido: docente.apellido,
    cuil: docente.cuil,
    cargo: docente.cargo,
    puntaje: docente.puntaje,
    horas: docente.horas,
    asistencia: docente.asistencia,
    anos: docente.anos,
    mes: docente.mes,
    porcentajeAnt: docente.porcentajeAnt,
    anosArraigo: docente.anosArraigo,
    porcArraigo: docente.porcArraigo,
    hsArraigo: docente.hsArraigo,
    asignacionClase: sueldoBase,
    estadoDocente: 'ACTIVO',
    antiguedadMonto: Math.round(antiguedadMonto),
    zona: Math.round(zona),
    presentismo: Math.round(presentismo),
    bonoRemun: bonoRemun,
    adicDirectivo: 0,
    garantiaRemun: 0,
    itemAula: itemAula,
    otros: 0,
    itemArraigo: Math.round(itemArraigo),
    itemEspecializacion: 0,
    sueldoBruto: Math.round(sueldoBruto),
    difParitarias: Math.round(difParitarias),
    sueldoBrutoTotal: Math.round(sueldoBrutoTotal),
    salarioFamiliar: salarioFamiliar,
    ayudaEscolar: 0,
    ayudaUtiles: 0,
    noRemunGtiaNac: 0,
    noRemunGtiaProv: 0,
    noRemunDif: 0,
    bonoNoRemunOtros: 0,
    incentivoDocente: incentivo,
    conectividad: conectividad,
    otrosNoRemun: 0,
    totalHaberes: Math.round(totalHaberes),
    jubilacion: Math.round(jubilacion),
    obraSocial: Math.round(obraSocial),
    sindicato: Math.round(sindicato),
    cajaComplem: Math.round(cajaComplem),
    otrosDescuentos: 0,
    totalDescuentos: Math.round(totalDescuentos),
    neto: Math.round(neto),
    firmas: ''
  };
}

// Función para crear array de valores de una fila
function filaAArray(fila) {
  return [
    fila.colegio,
    fila.legajo,
    fila.apellido,
    fila.cuil,
    fila.cargo,
    fila.puntaje,
    fila.horas,
    fila.asistencia,
    fila.anos,
    fila.mes,
    fila.porcentajeAnt,
    fila.anosArraigo,
    fila.porcArraigo,
    fila.hsArraigo,
    fila.asignacionClase,
    fila.estadoDocente,
    fila.antiguedadMonto,
    fila.zona,
    fila.presentismo,
    fila.bonoRemun,
    fila.adicDirectivo,
    fila.garantiaRemun,
    fila.itemAula,
    fila.otros,
    fila.itemArraigo,
    fila.itemEspecializacion,
    fila.sueldoBruto,
    fila.difParitarias,
    fila.sueldoBrutoTotal,
    fila.salarioFamiliar,
    fila.ayudaEscolar,
    fila.ayudaUtiles,
    fila.noRemunGtiaNac,
    fila.noRemunGtiaProv,
    fila.noRemunDif,
    fila.bonoNoRemunOtros,
    fila.incentivoDocente,
    fila.conectividad,
    fila.otrosNoRemun,
    fila.totalHaberes,
    fila.jubilacion,
    fila.obraSocial,
    fila.sindicato,
    fila.cajaComplem,
    fila.otrosDescuentos,
    fila.totalDescuentos,
    fila.neto,
    fila.firmas
  ];
}

async function crearExcel(nombreArchivo, codigoColegio, docentes, nombreHoja = NOMBRE_HOJA) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PRELIQ-DGE Test Generator';
  workbook.created = new Date();

  const hoja = workbook.addWorksheet(nombreHoja);

  // Agregar encabezados
  hoja.addRow(COLUMNAS);

  // Estilo de encabezados
  const headerRow = hoja.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Agregar datos
  docentes.forEach((docente, index) => {
    const fila = crearFilaDatos(codigoColegio, index + 1, docente);
    hoja.addRow(filaAArray(fila));
  });

  // Ajustar anchos de columna
  hoja.columns.forEach((col, i) => {
    col.width = Math.max(12, COLUMNAS[i].length + 2);
  });

  // Guardar archivo
  const outputPath = path.join(__dirname, '..', 'test-files', nombreArchivo);

  // Crear directorio si no existe
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await workbook.xlsx.writeFile(outputPath);
  console.log(`✓ Creado: ${nombreArchivo}`);
  return outputPath;
}

async function main() {
  console.log('Generando 5 archivos Excel de prueba...\n');

  // 1. Excel para colegio P-001 (5 docentes) - Nivel Primario
  await crearExcel(
    'prueba_P001_primario.xlsx',
    'P-001',
    DOCENTES_BASE.slice(0, 5),
    'Libro Primario'
  );

  // 2. Excel para colegio PS-001 (3 docentes) - Nivel Secundario
  await crearExcel(
    'prueba_PS001_secundario.xlsx',
    'PS-001',
    DOCENTES_BASE.slice(0, 3),
    'Libro Primario'
  );

  // 3. Excel para colegio PT-001 (4 docentes) - Nivel Terciario
  await crearExcel(
    'prueba_PT001_terciario.xlsx',
    'PT-001',
    DOCENTES_BASE.slice(0, 4),
    'Libro Primario'
  );

  // 4. Excel para colegio P-002 (2 docentes) - Pocos docentes
  await crearExcel(
    'prueba_P002_pocos.xlsx',
    'P-002',
    DOCENTES_BASE.slice(0, 2),
    'Libro Primario'
  );

  // 5. Excel con formato de hoja alternativo (NOV)
  await crearExcel(
    'prueba_P001_nov.xlsx',
    'P-001',
    DOCENTES_BASE.slice(0, 5),
    'NOV'
  );

  console.log('\n✓ Todos los archivos generados en: test-files/');
  console.log('\nArchivos creados:');
  console.log('  1. prueba_P001_primario.xlsx - Colegio P-001, 5 docentes, hoja "Libro Primario"');
  console.log('  2. prueba_PS001_secundario.xlsx - Colegio PS-001, 3 docentes');
  console.log('  3. prueba_PT001_terciario.xlsx - Colegio PT-001, 4 docentes');
  console.log('  4. prueba_P002_pocos.xlsx - Colegio P-002, 2 docentes');
  console.log('  5. prueba_P001_nov.xlsx - Colegio P-001, hoja "NOV"');
}

main().catch(console.error);
