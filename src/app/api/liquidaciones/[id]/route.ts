import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// PUT - Actualizar una liquidacion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener la liquidacion actual
    const { data: liquidacion, error: fetchError } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('*, presentacion:aps_presentaciones(*)')
      .eq('id', id)
      .single();

    if (fetchError || !liquidacion) {
      return NextResponse.json({ error: 'Liquidacion no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    if (userData.rol === 'COLEGIO' && liquidacion.id_colegio !== userData.id_colegio) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Solo se pueden editar liquidaciones de presentaciones CARGADAS
    if (liquidacion.presentacion?.estado !== 'CARGADA') {
      return NextResponse.json(
        { error: 'Solo se pueden editar liquidaciones de presentaciones en estado CARGADA' },
        { status: 400 }
      );
    }

    // Obtener datos a actualizar
    const body = await request.json();

    // Campos editables (solo datos basicos y montos)
    const camposEditables = [
      'legajo',
      'apellido_nombres',
      'cuil',
      'cargo',
      'horas',
      'sueldo_bruto',
      'sueldo_neto',
      'item_arraigo',
      'antiguedad_monto',
      'presentismo',
      'zona',
      'adicional_directivo',
      'otros_adicionales',
      'total_remunerativo',
      'jubilacion',
      'obra_social',
      'sindicato',
      'otros_descuentos',
      'total_deducciones'
    ];

    // Filtrar solo campos permitidos
    const datosActualizar: Record<string, unknown> = {};
    for (const campo of camposEditables) {
      if (body[campo] !== undefined) {
        datosActualizar[campo] = body[campo];
      }
    }

    if (Object.keys(datosActualizar).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Actualizar liquidacion
    const { data: updated, error: updateError } = await supabase
      .from('aps_liquidaciones_privadas')
      .update(datosActualizar)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Recalcular totales de la presentacion
    const { data: liquidaciones } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('sueldo_bruto, sueldo_neto, item_arraigo')
      .eq('id_presentacion', liquidacion.id_presentacion);

    if (liquidaciones) {
      const costoTotal = liquidaciones.reduce((sum, l) => sum + (l.sueldo_bruto || 0), 0);

      await supabase
        .from('aps_presentaciones')
        .update({
          costo_total_presentado: costoTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', liquidacion.id_presentacion);
    }

    return NextResponse.json({
      success: true,
      liquidacion: updated,
      mensaje: 'Liquidacion actualizada correctamente'
    });
  } catch (error) {
    console.error('Error actualizando liquidacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar una liquidacion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener la liquidacion
    const { data: liquidacion } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('*, presentacion:aps_presentaciones(*)')
      .eq('id', id)
      .single();

    if (!liquidacion) {
      return NextResponse.json({ error: 'Liquidacion no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    if (userData.rol === 'COLEGIO' && liquidacion.id_colegio !== userData.id_colegio) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Solo se pueden eliminar liquidaciones de presentaciones CARGADAS
    if (liquidacion.presentacion?.estado !== 'CARGADA') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar liquidaciones de presentaciones en estado CARGADA' },
        { status: 400 }
      );
    }

    const idPresentacion = liquidacion.id_presentacion;

    // Eliminar liquidacion
    const { error: deleteError } = await supabase
      .from('aps_liquidaciones_privadas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Recalcular totales de la presentacion
    const { data: liquidacionesRestantes } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('sueldo_bruto')
      .eq('id_presentacion', idPresentacion);

    const costoTotal = liquidacionesRestantes?.reduce((sum, l) => sum + (l.sueldo_bruto || 0), 0) || 0;
    const totalFilas = liquidacionesRestantes?.length || 0;

    await supabase
      .from('aps_presentaciones')
      .update({
        costo_total_presentado: costoTotal,
        total_filas: totalFilas,
        updated_at: new Date().toISOString()
      })
      .eq('id', idPresentacion);

    return NextResponse.json({
      success: true,
      mensaje: 'Liquidacion eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando liquidacion:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
