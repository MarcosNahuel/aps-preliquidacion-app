import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const nivel = searchParams.get('nivel');
    const activo = searchParams.get('activo');

    let query = supabase
      .from('aps_colegios')
      .select('*')
      .order('codigo_nivel')
      .order('codigo_colegio');

    if (nivel) {
      query = query.eq('codigo_nivel', nivel);
    }

    if (activo !== null) {
      query = query.eq('activo', activo === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ colegios: data });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
