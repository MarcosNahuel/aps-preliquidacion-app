import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';
import { NIVELES, TIPOS_LIQUIDACION, TIPOS_PLANTA } from '@/types/database';

// Mapear codigo de nivel a nombre completo
function getNivelCompleto(codigo: string | null): string {
  if (!codigo) return '';
  const nivel = NIVELES.find(n => n.codigo === codigo);
  return nivel?.nombre || codigo;
}

// Mapear codigo de tipo liquidacion a nombre
function getTipoLiquidacionNombre(codigo: string | null): string {
  if (!codigo) return '';
  const tipo = TIPOS_LIQUIDACION.find(t => t.codigo === codigo);
  return tipo?.nombre || codigo;
}

// Mapear codigo de tipo planta a nombre
function getTipoPlantaNombre(codigo: string | null): string {
  if (!codigo) return 'Planta Titular'; // Valor por defecto para presentaciones antiguas
  const tipo = TIPOS_PLANTA.find(t => t.codigo === codigo);
  return tipo?.nombre || codigo;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener usuario
    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*, colegio:aps_colegios(*)')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener presentacion
    const { data: presentacion, error: presError } = await supabase
      .from('aps_presentaciones')
      .select('*, colegio:aps_colegios(*)')
      .eq('id', id)
      .single();

    if (presError || !presentacion) {
      return NextResponse.json({ error: 'Presentacion no encontrada' }, { status: 404 });
    }

    // Verificar acceso (colegio solo ve sus presentaciones)
    if (userData.rol === 'COLEGIO' && presentacion.id_colegio !== userData.id_colegio) {
      return NextResponse.json({ error: 'Sin acceso a esta presentacion' }, { status: 403 });
    }

    // Obtener liquidaciones
    const { data: liquidaciones, error: liqError } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('*')
      .eq('id_presentacion', id)
      .order('fila_excel', { ascending: true });

    if (liqError) {
      return NextResponse.json({ error: 'Error al obtener liquidaciones' }, { status: 500 });
    }

    // Crear Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PRELIQ-DGE';
    workbook.created = new Date();

    const hoja = workbook.addWorksheet('Liquidaciones');

    // Configurar columnas
    hoja.columns = [
      { header: 'Colegio', key: 'colegio', width: 12 },
      { header: 'Nivel', key: 'nivel_completo', width: 15 },
      { header: 'Legajo', key: 'legajo', width: 10 },
      { header: 'Clave Docente', key: 'clave_docente', width: 15 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Nombres', key: 'nombres', width: 25 },
      { header: 'DNI', key: 'dni', width: 12 },
      { header: 'CUIL', key: 'cuil', width: 15 },
      { header: 'Cargo', key: 'cargo', width: 30 },
      { header: 'Sit. Revista', key: 'situacion_revista', width: 12 },
      { header: 'Horas', key: 'horas', width: 8 },
      { header: 'Asistencia', key: 'asistencia_dias', width: 10 },
      { header: 'Antiguedad', key: 'antiguedad_anos', width: 10 },
      { header: 'Sueldo Basico', key: 'sueldo_basico', width: 15 },
      { header: 'Antiguedad Monto', key: 'antiguedad_monto', width: 15 },
      { header: 'Presentismo', key: 'presentismo', width: 12 },
      { header: 'Zona', key: 'zona', width: 10 },
      { header: 'Item Arraigo', key: 'item_arraigo', width: 12 },
      { header: 'Adicional Directivo', key: 'adicional_directivo', width: 15 },
      { header: 'Otros Adicionales', key: 'otros_adicionales', width: 15 },
      { header: 'Total Remunerativo', key: 'total_remunerativo', width: 18 },
      { header: 'Jubilacion', key: 'jubilacion', width: 12 },
      { header: 'Obra Social', key: 'obra_social', width: 12 },
      { header: 'Sindicato', key: 'sindicato', width: 12 },
      { header: 'Otros Descuentos', key: 'otros_descuentos', width: 15 },
      { header: 'Total Deducciones', key: 'total_deducciones', width: 15 },
      { header: 'Sueldo Neto', key: 'sueldo_neto', width: 15 },
      { header: 'Tipo Planta', key: 'tipo_planta', width: 15 },
      { header: 'Tipo Liquidacion', key: 'tipo_liquidacion_nombre', width: 20 },
    ];

    // Estilo de encabezados
    const headerRow = hoja.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Agregar datos
    liquidaciones?.forEach((liq: Record<string, unknown>) => {
      hoja.addRow({
        ...liq,
        nivel_completo: getNivelCompleto(liq.nivel as string),
        tipo_planta: getTipoPlantaNombre(presentacion.tipo_planta),
        tipo_liquidacion_nombre: getTipoLiquidacionNombre(presentacion.tipo_liquidacion),
      });
    });

    // Formato de moneda para columnas de importes
    const columnasMonto = ['sueldo_basico', 'antiguedad_monto', 'presentismo', 'zona', 'item_arraigo',
                          'adicional_directivo', 'otros_adicionales', 'total_remunerativo',
                          'jubilacion', 'obra_social', 'sindicato', 'otros_descuentos',
                          'total_deducciones', 'sueldo_neto'];

    hoja.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      columnasMonto.forEach(col => {
        const cell = row.getCell(col);
        if (cell.value) {
          cell.numFmt = '$#,##0.00';
        }
      });
    });

    // Agregar fila de totales
    const totales = {
      colegio: 'TOTALES',
      nivel_completo: '',
      legajo: '',
      clave_docente: '',
      apellido: '',
      nombres: '',
      dni: '',
      cuil: '',
      cargo: '',
      situacion_revista: '',
      horas: liquidaciones?.reduce((sum, l) => sum + (l.horas || 0), 0),
      asistencia_dias: '',
      antiguedad_anos: '',
      sueldo_basico: liquidaciones?.reduce((sum, l) => sum + (l.sueldo_basico || 0), 0),
      antiguedad_monto: liquidaciones?.reduce((sum, l) => sum + (l.antiguedad_monto || 0), 0),
      presentismo: liquidaciones?.reduce((sum, l) => sum + (l.presentismo || 0), 0),
      zona: liquidaciones?.reduce((sum, l) => sum + (l.zona || 0), 0),
      item_arraigo: liquidaciones?.reduce((sum, l) => sum + (l.item_arraigo || 0), 0),
      adicional_directivo: liquidaciones?.reduce((sum, l) => sum + (l.adicional_directivo || 0), 0),
      otros_adicionales: liquidaciones?.reduce((sum, l) => sum + (l.otros_adicionales || 0), 0),
      total_remunerativo: liquidaciones?.reduce((sum, l) => sum + (l.total_remunerativo || 0), 0),
      jubilacion: liquidaciones?.reduce((sum, l) => sum + (l.jubilacion || 0), 0),
      obra_social: liquidaciones?.reduce((sum, l) => sum + (l.obra_social || 0), 0),
      sindicato: liquidaciones?.reduce((sum, l) => sum + (l.sindicato || 0), 0),
      otros_descuentos: liquidaciones?.reduce((sum, l) => sum + (l.otros_descuentos || 0), 0),
      total_deducciones: liquidaciones?.reduce((sum, l) => sum + (l.total_deducciones || 0), 0),
      sueldo_neto: liquidaciones?.reduce((sum, l) => sum + (l.sueldo_neto || 0), 0),
      tipo_planta: '',
      tipo_liquidacion_nombre: '',
    };

    const totalRow = hoja.addRow(totales);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Nombre del archivo
    const colegioCode = `${presentacion.colegio?.codigo_nivel}-${presentacion.colegio?.codigo_colegio}`;
    const periodo = presentacion.periodo;
    const nombreArchivo = `liquidacion_${colegioCode}_${periodo}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    });

  } catch (error) {
    console.error('Error generando Excel:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
