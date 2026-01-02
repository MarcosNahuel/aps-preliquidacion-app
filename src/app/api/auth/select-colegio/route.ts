import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es AUDITOR (solo auditores pueden cambiar de colegio)
    const { data: userData, error: userError } = await supabase
      .from('aps_usuarios')
      .select('rol')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData || userData.rol !== 'AUDITOR') {
      return NextResponse.json({ error: 'Solo auditores pueden cambiar de colegio' }, { status: 403 });
    }

    const { colegioId } = await request.json();

    if (!colegioId) {
      return NextResponse.json({ error: 'Debe especificar un colegio' }, { status: 400 });
    }

    // Verificar que el colegio existe
    const { data: colegio, error: colegioError } = await supabase
      .from('aps_colegios')
      .select('*')
      .eq('id', colegioId)
      .eq('activo', true)
      .single();

    if (colegioError || !colegio) {
      return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 });
    }

    // Guardar el colegio seleccionado en una cookie
    const cookieStore = await cookies();
    cookieStore.set('selected_colegio_id', colegioId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });

    return NextResponse.json({
      success: true,
      colegio: {
        id: colegio.id,
        codigo_nivel: colegio.codigo_nivel,
        codigo_colegio: colegio.codigo_colegio,
        nombre: colegio.nombre,
        porcentaje_subsidio: colegio.porcentaje_subsidio
      }
    });
  } catch (error) {
    console.error('Error en select-colegio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Limpiar la cookie del colegio seleccionado
    const cookieStore = await cookies();
    cookieStore.delete('selected_colegio_id');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al limpiar colegio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
