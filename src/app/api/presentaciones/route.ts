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

    // Obtener usuario del sistema
    const { data: userData } = await supabase
      .from('aps_usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const idColegio = searchParams.get('id_colegio');
    const periodo = searchParams.get('periodo');
    const estado = searchParams.get('estado');
    const tipoLiquidacion = searchParams.get('tipo_liquidacion');

    let query = supabase
      .from('aps_presentaciones')
      .select(`
        *,
        colegio:aps_colegios(*),
        usuario:aps_usuarios(id, nombre, email)
      `)
      .order('fecha_subida', { ascending: false });

    // Si es rol COLEGIO, solo puede ver sus presentaciones
    if (userData.rol === 'COLEGIO') {
      query = query.eq('id_colegio', userData.id_colegio);
    } else if (idColegio) {
      query = query.eq('id_colegio', idColegio);
    }

    if (periodo) {
      query = query.eq('periodo', periodo);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (tipoLiquidacion) {
      query = query.eq('tipo_liquidacion', tipoLiquidacion);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ presentaciones: data });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
