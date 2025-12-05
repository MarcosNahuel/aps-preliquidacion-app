import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Obtener presentacion
    const { data: presentacion } = await supabase
      .from('aps_presentaciones')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!presentacion) {
      return NextResponse.json({ error: 'Presentacion no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    if (userData.rol === 'COLEGIO' && presentacion.id_colegio !== userData.id_colegio) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Solo se pueden cerrar presentaciones CARGADAS
    if (presentacion.estado !== 'CARGADA') {
      return NextResponse.json(
        { error: 'Solo se pueden cerrar presentaciones en estado CARGADA' },
        { status: 400 }
      );
    }

    // Verificar que no exista otra MENSUAL cerrada para el mismo colegio/periodo
    if (presentacion.tipo_liquidacion === 'MENSUAL') {
      const { data: existente } = await supabase
        .from('aps_presentaciones')
        .select('id')
        .eq('id_colegio', presentacion.id_colegio)
        .eq('periodo', presentacion.periodo)
        .eq('tipo_liquidacion', 'MENSUAL')
        .eq('estado', 'CERRADA')
        .single();

      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe una liquidacion MENSUAL cerrada para este colegio y periodo' },
          { status: 400 }
        );
      }
    }

    // Cerrar presentacion
    const { data: updated, error } = await supabase
      .from('aps_presentaciones')
      .update({
        estado: 'CERRADA',
        fecha_cierre: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      presentacion: updated
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
