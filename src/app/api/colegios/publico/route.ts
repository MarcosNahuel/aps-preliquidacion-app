import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente con anon key para consultas públicas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nivel = searchParams.get('nivel');

    let query = supabase
      .from('aps_colegios')
      .select('id, codigo_nivel, codigo_colegio, nombre, porcentaje_subsidio')
      .eq('activo', true)
      .order('codigo_colegio');

    if (nivel) {
      query = query.eq('codigo_nivel', nivel);
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
