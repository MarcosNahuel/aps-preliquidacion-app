import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea AUDITOR
    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData || userData.rol !== 'AUDITOR') {
      return NextResponse.json({ error: 'Solo auditores pueden descargar consolidados' }, { status: 403 });
    }

    // Obtener parametros de filtro
    const searchParams = request.nextUrl.searchParams;
    const tipoLiquidacion = searchParams.get('tipo_liquidacion');
    const periodo = searchParams.get('periodo');
    const nivel = searchParams.get('nivel');
    const idColegio = searchParams.get('id_colegio');
    const tipoPlanta = searchParams.get('tipo_planta');
    const estado = searchParams.get('estado') || 'CERRADA'; // Por defecto solo cerradas

    // Construir query para presentaciones
    let query = supabase
      .from('aps_presentaciones')
      .select(`
        id,
        periodo,
        tipo_liquidacion,
        tipo_planta,
        estado,
        total_filas,
        costo_total_presentado,
        fecha_subida,
        fecha_cierre,
        colegio:aps_colegios(id, codigo_nivel, codigo_colegio, nombre, porcentaje_subsidio)
      `)
      .eq('estado', estado);

    if (tipoLiquidacion) {
      query = query.eq('tipo_liquidacion', tipoLiquidacion);
    }
    if (periodo) {
      query = query.eq('periodo', periodo);
    }
    if (idColegio) {
      query = query.eq('id_colegio', idColegio);
    }
    if (tipoPlanta) {
      query = query.eq('tipo_planta', tipoPlanta);
    }

    const { data: presentaciones, error: presError } = await query.order('periodo', { ascending: false });

    if (presError) {
      return NextResponse.json({ error: presError.message }, { status: 500 });
    }

    // Filtrar por nivel si es necesario
    let presentacionesFiltradas = presentaciones || [];
    if (nivel) {
      presentacionesFiltradas = presentacionesFiltradas.filter(
        (p: any) => p.colegio?.codigo_nivel === nivel
      );
    }

    if (presentacionesFiltradas.length === 0) {
      return NextResponse.json({ error: 'No hay presentaciones que coincidan con los filtros' }, { status: 404 });
    }

    // Obtener IDs de presentaciones
    const presentacionIds = presentacionesFiltradas.map((p: any) => p.id);

    // Obtener todas las liquidaciones de esas presentaciones
    const { data: liquidaciones, error: liqError } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('*')
      .in('id_presentacion', presentacionIds)
      .order('id_presentacion')
      .order('fila_excel');

    if (liqError) {
      return NextResponse.json({ error: liqError.message }, { status: 500 });
    }

    // Crear mapa de presentaciones para acceso rapido
    const presentacionesMap = new Map<string, any>();
    presentacionesFiltradas.forEach((p: any) => {
      presentacionesMap.set(p.id, p);
    });

    // Crear Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PRELIQ-DGE';
    workbook.created = new Date();

    // Hoja de Resumen
    const hojaResumen = workbook.addWorksheet('Resumen');
    hojaResumen.columns = [
      { header: 'Colegio', key: 'colegio', width: 15 },
      { header: 'Nombre Colegio', key: 'nombre_colegio', width: 30 },
      { header: 'Periodo', key: 'periodo', width: 15 },
      { header: 'Tipo Liquidacion', key: 'tipo_liquidacion', width: 25 },
      { header: 'Total Filas', key: 'total_filas', width: 12 },
      { header: 'Costo Total', key: 'costo_total', width: 18 },
      { header: '% Subsidio', key: 'porcentaje_subsidio', width: 12 },
      { header: 'Monto Subsidio', key: 'monto_subsidio', width: 18 },
      { header: 'Fecha Cierre', key: 'fecha_cierre', width: 15 },
    ];

    // Estilo header resumen
    const headerResumen = hojaResumen.getRow(1);
    headerResumen.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerResumen.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };

    let totalGeneral = 0;
    let totalSubsidio = 0;

    presentacionesFiltradas.forEach((p: any) => {
      const porcentaje = p.colegio?.porcentaje_subsidio || 100;
      const montoSubsidio = (p.costo_total_presentado * porcentaje) / 100;
      totalGeneral += p.costo_total_presentado;
      totalSubsidio += montoSubsidio;

      hojaResumen.addRow({
        colegio: `${p.colegio?.codigo_nivel}-${p.colegio?.codigo_colegio}`,
        nombre_colegio: p.colegio?.nombre || '',
        periodo: formatPeriodo(p.periodo),
        tipo_liquidacion: p.tipo_liquidacion,
        total_filas: p.total_filas,
        costo_total: p.costo_total_presentado,
        porcentaje_subsidio: porcentaje,
        monto_subsidio: montoSubsidio,
        fecha_cierre: p.fecha_cierre ? new Date(p.fecha_cierre).toLocaleDateString('es-AR') : ''
      });
    });

    // Fila de totales en resumen
    const totalRow = hojaResumen.addRow({
      colegio: 'TOTALES',
      nombre_colegio: '',
      periodo: '',
      tipo_liquidacion: '',
      total_filas: presentacionesFiltradas.reduce((sum: number, p: any) => sum + p.total_filas, 0),
      costo_total: totalGeneral,
      porcentaje_subsidio: '',
      monto_subsidio: totalSubsidio,
      fecha_cierre: ''
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    // Formato moneda
    hojaResumen.getColumn('costo_total').numFmt = '"$"#,##0.00';
    hojaResumen.getColumn('monto_subsidio').numFmt = '"$"#,##0.00';

    // Hoja de Detalle de Liquidaciones
    const hojaDetalle = workbook.addWorksheet('Detalle Liquidaciones');
    hojaDetalle.columns = [
      { header: 'Colegio', key: 'colegio', width: 12 },
      { header: 'Periodo', key: 'periodo', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Legajo', key: 'legajo', width: 10 },
      { header: 'Apellido y Nombres', key: 'apellido_nombres', width: 30 },
      { header: 'CUIL', key: 'cuil', width: 15 },
      { header: 'Cargo', key: 'cargo', width: 25 },
      { header: 'Horas', key: 'horas', width: 8 },
      { header: 'Antiguedad Años', key: 'antiguedad_anos', width: 12 },
      { header: 'Sueldo Basico', key: 'sueldo_basico', width: 15 },
      { header: 'Antiguedad $', key: 'antiguedad_monto', width: 15 },
      { header: 'Presentismo', key: 'presentismo', width: 12 },
      { header: 'Zona', key: 'zona', width: 12 },
      { header: 'Item Arraigo', key: 'item_arraigo', width: 15 },
      { header: 'Otros Adic.', key: 'otros_adicionales', width: 12 },
      { header: 'Total Remun.', key: 'total_remunerativo', width: 15 },
      { header: 'Jubilacion', key: 'jubilacion', width: 12 },
      { header: 'Obra Social', key: 'obra_social', width: 12 },
      { header: 'Sindicato', key: 'sindicato', width: 12 },
      { header: 'Otros Desc.', key: 'otros_descuentos', width: 12 },
      { header: 'Total Deduc.', key: 'total_deducciones', width: 15 },
      { header: 'Sueldo Bruto', key: 'sueldo_bruto', width: 15 },
      { header: 'Sueldo Neto', key: 'sueldo_neto', width: 15 },
    ];

    // Estilo header detalle
    const headerDetalle = hojaDetalle.getRow(1);
    headerDetalle.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerDetalle.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }
    };

    // Agregar liquidaciones
    (liquidaciones || []).forEach((liq: any) => {
      const pres = presentacionesMap.get(liq.id_presentacion);
      hojaDetalle.addRow({
        colegio: `${pres?.colegio?.codigo_nivel}-${pres?.colegio?.codigo_colegio}`,
        periodo: formatPeriodo(pres?.periodo || ''),
        tipo: pres?.tipo_liquidacion || '',
        legajo: liq.legajo,
        apellido_nombres: liq.apellido_nombres || `${liq.apellido || ''} ${liq.nombres || ''}`.trim(),
        cuil: liq.cuil,
        cargo: liq.cargo,
        horas: liq.horas,
        antiguedad_anos: liq.antiguedad_anos,
        sueldo_basico: liq.sueldo_basico,
        antiguedad_monto: liq.antiguedad_monto,
        presentismo: liq.presentismo,
        zona: liq.zona,
        item_arraigo: liq.item_arraigo,
        otros_adicionales: liq.otros_adicionales,
        total_remunerativo: liq.total_remunerativo,
        jubilacion: liq.jubilacion,
        obra_social: liq.obra_social,
        sindicato: liq.sindicato,
        otros_descuentos: liq.otros_descuentos,
        total_deducciones: liq.total_deducciones,
        sueldo_bruto: liq.sueldo_bruto,
        sueldo_neto: liq.sueldo_neto,
      });
    });

    // Formato moneda para columnas de detalle
    const columnasMoneda = ['sueldo_basico', 'antiguedad_monto', 'presentismo', 'zona',
      'item_arraigo', 'otros_adicionales', 'total_remunerativo', 'jubilacion',
      'obra_social', 'sindicato', 'otros_descuentos', 'total_deducciones',
      'sueldo_bruto', 'sueldo_neto'];
    columnasMoneda.forEach(col => {
      const column = hojaDetalle.getColumn(col);
      if (column) column.numFmt = '"$"#,##0.00';
    });

    // Hoja de Totales por Colegio (para expediente)
    const hojaTotales = workbook.addWorksheet('Totales por Colegio');
    hojaTotales.columns = [
      { header: 'Codigo Colegio', key: 'codigo', width: 15 },
      { header: 'Nombre Colegio', key: 'nombre', width: 35 },
      { header: 'Nivel', key: 'nivel', width: 10 },
      { header: 'Cant. Docentes', key: 'docentes', width: 15 },
      { header: 'Total Horas', key: 'horas', width: 12 },
      { header: 'Total Bruto', key: 'bruto', width: 18 },
      { header: 'Total Neto', key: 'neto', width: 18 },
      { header: 'Total Arraigo', key: 'arraigo', width: 18 },
      { header: '% Subsidio', key: 'porcentaje', width: 12 },
      { header: 'Monto a Subsidiar', key: 'subsidio', width: 18 },
    ];

    // Estilo header totales
    const headerTotales = hojaTotales.getRow(1);
    headerTotales.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerTotales.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C3AED' }
    };

    // Agrupar por colegio
    const totalesPorColegio = new Map<string, any>();
    (liquidaciones || []).forEach((liq: any) => {
      const pres = presentacionesMap.get(liq.id_presentacion);
      const colegioKey = `${pres?.colegio?.codigo_nivel}-${pres?.colegio?.codigo_colegio}`;

      if (!totalesPorColegio.has(colegioKey)) {
        totalesPorColegio.set(colegioKey, {
          codigo: colegioKey,
          nombre: pres?.colegio?.nombre || '',
          nivel: pres?.colegio?.codigo_nivel || '',
          porcentaje: pres?.colegio?.porcentaje_subsidio || 100,
          docentes: 0,
          horas: 0,
          bruto: 0,
          neto: 0,
          arraigo: 0
        });
      }

      const totales = totalesPorColegio.get(colegioKey);
      totales.docentes++;
      totales.horas += liq.horas || 0;
      totales.bruto += liq.sueldo_bruto || 0;
      totales.neto += liq.sueldo_neto || 0;
      totales.arraigo += liq.item_arraigo || 0;
    });

    let grandTotalBruto = 0;
    let grandTotalNeto = 0;
    let grandTotalArraigo = 0;
    let grandTotalSubsidio = 0;
    let grandTotalDocentes = 0;
    let grandTotalHoras = 0;

    totalesPorColegio.forEach((totales) => {
      const subsidio = (totales.bruto * totales.porcentaje) / 100;
      grandTotalBruto += totales.bruto;
      grandTotalNeto += totales.neto;
      grandTotalArraigo += totales.arraigo;
      grandTotalSubsidio += subsidio;
      grandTotalDocentes += totales.docentes;
      grandTotalHoras += totales.horas;

      hojaTotales.addRow({
        codigo: totales.codigo,
        nombre: totales.nombre,
        nivel: totales.nivel,
        docentes: totales.docentes,
        horas: totales.horas,
        bruto: totales.bruto,
        neto: totales.neto,
        arraigo: totales.arraigo,
        porcentaje: totales.porcentaje,
        subsidio: subsidio
      });
    });

    // Fila de totales generales
    const grandTotalRow = hojaTotales.addRow({
      codigo: 'TOTAL GENERAL',
      nombre: '',
      nivel: '',
      docentes: grandTotalDocentes,
      horas: grandTotalHoras,
      bruto: grandTotalBruto,
      neto: grandTotalNeto,
      arraigo: grandTotalArraigo,
      porcentaje: '',
      subsidio: grandTotalSubsidio
    });
    grandTotalRow.font = { bold: true };
    grandTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    // Formato moneda
    hojaTotales.getColumn('bruto').numFmt = '"$"#,##0.00';
    hojaTotales.getColumn('neto').numFmt = '"$"#,##0.00';
    hojaTotales.getColumn('arraigo').numFmt = '"$"#,##0.00';
    hojaTotales.getColumn('subsidio').numFmt = '"$"#,##0.00';

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generar nombre de archivo
    const fechaHoy = new Date().toISOString().split('T')[0];
    const filtrosNombre = [
      tipoLiquidacion || 'TODOS',
      periodo || 'TODOS-PERIODOS',
      nivel || 'TODOS-NIVELES'
    ].join('_');
    const nombreArchivo = `Consolidado_Expediente_${filtrosNombre}_${fechaHoy}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error('Error generando consolidado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function formatPeriodo(periodo: string): string {
  if (!periodo || periodo.length < 6) return periodo;
  const year = periodo.substring(0, 4);
  const month = parseInt(periodo.substring(4, 6));
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[month - 1]} ${year}`;
}
