import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
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

    const { data: presentacion, error } = await supabase
      .from('aps_presentaciones')
      .select(`
        *,
        colegio:aps_colegios(*),
        usuario:aps_usuarios(id, nombre, email)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Verificar acceso si es rol COLEGIO
    if (userData.rol === 'COLEGIO' && presentacion.id_colegio !== userData.id_colegio) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener liquidaciones
    const { data: liquidaciones } = await supabase
      .from('aps_liquidaciones_privadas')
      .select('*')
      .eq('id_presentacion', params.id)
      .order('fila_excel');

    return NextResponse.json({
      presentacion,
      liquidaciones: liquidaciones || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Solo se pueden eliminar presentaciones CARGADAS
    if (presentacion.estado !== 'CARGADA') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar presentaciones en estado CARGADA' },
        { status: 400 }
      );
    }

    // Eliminar (las liquidaciones se eliminan en cascada)
    const { error } = await supabase
      .from('aps_presentaciones')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
