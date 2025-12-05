import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validarExtension, validarEstructura, validarDatos, extraerDatos } from '@/lib/excel/validation';
import { generarExcelConErrores } from '@/lib/excel/generator';
import type { TipoLiquidacion } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener usuario del sistema
    const { data: userData, error: userError } = await supabase
      .from('aps_usuarios')
      .select('*, colegio:aps_colegios(*)')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const periodo = formData.get('periodo') as string;
    const tipoLiquidacion = formData.get('tipo_liquidacion') as TipoLiquidacion;
    const idColegio = formData.get('id_colegio') as string;

    if (!file || !periodo || !tipoLiquidacion) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: archivo, periodo y tipo de liquidacion' },
        { status: 400 }
      );
    }

    // Usar el colegio del usuario si es rol COLEGIO, o el proporcionado si es AUDITOR
    const colegioId = userData.rol === 'COLEGIO' ? userData.id_colegio : idColegio;

    if (!colegioId) {
      return NextResponse.json(
        { error: 'Debe especificar el colegio' },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Validar extension
    const validacionExtension = validarExtension(file.name);
    if (!validacionExtension.valido) {
      // Registrar rechazo estructural
      const { data: presentacion } = await supabase
        .from('aps_presentaciones')
        .insert({
          id_colegio: colegioId,
          periodo,
          tipo_liquidacion: tipoLiquidacion,
          estado: 'RECHAZADA',
          tipo_error: 'ESTRUCTURAL',
          motivo_rechazo: validacionExtension.mensaje,
          id_usuario: userData.id,
          ip_origen: ip,
        })
        .select()
        .single();

      return NextResponse.json({
        success: false,
        tipo_error: 'ESTRUCTURAL',
        mensaje: validacionExtension.mensaje,
        detalles: validacionExtension.detalles,
        presentacion_id: presentacion?.id
      }, { status: 400 });
    }

    // Leer archivo como buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validar estructura
    const validacionEstructura = await validarEstructura(buffer);
    if (!validacionEstructura.valido) {
      // Registrar rechazo estructural
      const { data: presentacion } = await supabase
        .from('aps_presentaciones')
        .insert({
          id_colegio: colegioId,
          periodo,
          tipo_liquidacion: tipoLiquidacion,
          estado: 'RECHAZADA',
          tipo_error: 'ESTRUCTURAL',
          motivo_rechazo: validacionEstructura.mensaje,
          id_usuario: userData.id,
          ip_origen: ip,
        })
        .select()
        .single();

      return NextResponse.json({
        success: false,
        tipo_error: 'ESTRUCTURAL',
        mensaje: validacionEstructura.mensaje,
        detalles: validacionEstructura.detalles,
        presentacion_id: presentacion?.id
      }, { status: 400 });
    }

    // Validar datos
    const resultadoValidacion = await validarDatos(buffer);

    if (!resultadoValidacion.valido) {
      // Generar Excel con errores
      const excelErrores = await generarExcelConErrores(buffer, resultadoValidacion.errores);

      // Guardar archivo de errores en storage
      const nombreArchivoErrores = `errores_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('archivos-errores')
        .upload(nombreArchivoErrores, excelErrores, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      // Registrar rechazo por datos
      const { data: presentacion } = await supabase
        .from('aps_presentaciones')
        .insert({
          id_colegio: colegioId,
          periodo,
          tipo_liquidacion: tipoLiquidacion,
          estado: 'RECHAZADA',
          tipo_error: 'DATOS',
          motivo_rechazo: `Se encontraron ${resultadoValidacion.filasConError} filas con errores de un total de ${resultadoValidacion.totalFilas} filas`,
          total_filas: resultadoValidacion.totalFilas,
          filas_con_error: resultadoValidacion.filasConError,
          id_usuario: userData.id,
          ip_origen: ip,
          ruta_archivo_errores: uploadData?.path || null,
        })
        .select()
        .single();

      return NextResponse.json({
        success: false,
        tipo_error: 'DATOS',
        mensaje: `El archivo contiene ${resultadoValidacion.filasConError} filas con errores de un total de ${resultadoValidacion.totalFilas} filas.`,
        total_filas: resultadoValidacion.totalFilas,
        filas_con_error: resultadoValidacion.filasConError,
        errores: resultadoValidacion.errores.slice(0, 20), // Mostrar solo primeros 20
        tiene_mas_errores: resultadoValidacion.errores.length > 20,
        presentacion_id: presentacion?.id,
        archivo_errores: uploadData?.path
      }, { status: 400 });
    }

    // Archivo valido - guardar archivo original
    const nombreArchivoOriginal = `original_${Date.now()}_${file.name}`;
    const { data: uploadOriginal } = await supabase.storage
      .from('archivos-originales')
      .upload(nombreArchivoOriginal, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    // Extraer datos
    const datosExcel = await extraerDatos(buffer);

    // Calcular costo total
    const costoTotal = datosExcel.reduce((sum, fila) => sum + (fila.total_remunerativo || 0), 0);

    // Crear presentacion
    const { data: presentacion, error: presentacionError } = await supabase
      .from('aps_presentaciones')
      .insert({
        id_colegio: colegioId,
        periodo,
        tipo_liquidacion: tipoLiquidacion,
        estado: 'CARGADA',
        total_filas: datosExcel.length,
        costo_total_presentado: costoTotal,
        id_usuario: userData.id,
        ip_origen: ip,
        ruta_archivo_original: uploadOriginal?.path || null,
      })
      .select()
      .single();

    if (presentacionError) {
      return NextResponse.json(
        { error: 'Error al crear la presentacion: ' + presentacionError.message },
        { status: 500 }
      );
    }

    // Insertar liquidaciones
    const liquidaciones = datosExcel.map(fila => ({
      id_presentacion: presentacion.id,
      id_colegio: colegioId,
      fila_excel: fila.fila,
      colegio: fila.colegio,
      nivel: fila.nivel,
      legajo: fila.legajo,
      clave_docente: fila.dni && fila.legajo ? `${fila.dni}${fila.legajo.padStart(3, '0')}` : null,
      apellido: fila.apellido,
      nombres: fila.nombres,
      dni: fila.dni,
      cuil: fila.cuil,
      fecha_nacimiento: fila.fecha_nacimiento instanceof Date
        ? fila.fecha_nacimiento.toISOString().split('T')[0]
        : fila.fecha_nacimiento,
      situacion_revista: fila.situacion_revista,
      cargo: fila.cargo,
      puntaje: fila.puntaje,
      horas: fila.horas,
      asistencia_dias: fila.asistencia_dias,
      inasistencia_dias: fila.inasistencia_dias,
      antiguedad_anos: fila.antiguedad_anos,
      sueldo_basico: fila.sueldo_basico,
      antiguedad_monto: fila.antiguedad_monto,
      presentismo: fila.presentismo,
      zona: fila.zona,
      item_arraigo: fila.item_arraigo,
      adicional_directivo: fila.adicional_directivo,
      otros_adicionales: fila.otros_adicionales,
      total_remunerativo: fila.total_remunerativo,
      jubilacion: fila.jubilacion,
      obra_social: fila.obra_social,
      sindicato: fila.sindicato,
      otros_descuentos: fila.otros_descuentos,
      total_deducciones: fila.total_deducciones,
      sueldo_neto: fila.sueldo_neto,
    }));

    const { error: liquidacionesError } = await supabase
      .from('aps_liquidaciones_privadas')
      .insert(liquidaciones);

    if (liquidacionesError) {
      // Eliminar presentacion si falla la carga de liquidaciones
      await supabase.from('aps_presentaciones').delete().eq('id', presentacion.id);
      return NextResponse.json(
        { error: 'Error al guardar las liquidaciones: ' + liquidacionesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: `Archivo cargado exitosamente. Se procesaron ${datosExcel.length} filas.`,
      presentacion_id: presentacion.id,
      total_filas: datosExcel.length,
      costo_total: costoTotal
    });

  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
