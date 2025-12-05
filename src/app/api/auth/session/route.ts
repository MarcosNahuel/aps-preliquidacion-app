import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Session check - Auth user:', user?.id, 'Error:', authError?.message);

    if (authError || !user) {
      console.log('No auth user found, returning 401');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Obtener datos del usuario del sistema
    const { data: userData, error: userError } = await supabase
      .from('aps_usuarios')
      .select('*, colegio:aps_colegios(*)')
      .eq('auth_user_id', user.id)
      .single();

    console.log('User data query - Data:', userData?.email, 'Error:', userError?.message, userError?.code);

    if (userError || !userData) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        rol: userData.rol,
        colegio: userData.colegio,
        activo: userData.activo
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
