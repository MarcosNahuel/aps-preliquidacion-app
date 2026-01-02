import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Autenticar con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError.message);
      return NextResponse.json(
        { error: 'Credenciales incorrectas. Verifique su email y contraseña.' },
        { status: 401 }
      );
    }

    // Obtener datos del usuario de la tabla aps_usuarios
    const { data: userData, error: userError } = await supabase
      .from('aps_usuarios')
      .select('id, rol, activo')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError || !userData) {
      console.error('User error:', userError?.message);
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Usuario no encontrado en el sistema. Contacte al administrador.' },
        { status: 401 }
      );
    }

    if (!userData.activo) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Su cuenta está desactivada. Contacte al administrador.' },
        { status: 401 }
      );
    }

    // Devolver datos del usuario y URL de redireccion
    const redirectUrl = userData.rol === 'AUDITOR' ? '/seleccion-rol' : '/colegio';

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        rol: userData.rol,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
