import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Cliente Supabase con anon key - crear dentro de la funcion para evitar problemas en build
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { email, password, nombre, rol, id_colegio } = body;

    if (!email || !password || !rol) {
      return NextResponse.json(
        { error: 'Email, password y rol son requeridos' },
        { status: 400 }
      );
    }

    if (rol === 'COLEGIO' && !id_colegio) {
      return NextResponse.json(
        { error: 'Debe seleccionar un colegio para usuarios tipo COLEGIO' },
        { status: 400 }
      );
    }

    // Crear usuario en Supabase Auth usando signUp publico
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre || email.split('@')[0],
          rol,
          id_colegio: rol === 'COLEGIO' ? id_colegio : null
        }
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 400 }
      );
    }

    // El perfil en aps_usuarios se crea automaticamente via trigger en la DB
    // Esperamos un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verificar que el perfil se creó correctamente
    const { data: userData, error: userError } = await supabase
      .from('aps_usuarios')
      .select('id, email, nombre, rol')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error verificando perfil:', userError);
      // El usuario se creó en auth, pero podemos continuar
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Usuario creado exitosamente. Revise su correo para confirmar la cuenta.',
      usuario: userData || {
        email: authData.user.email,
        nombre: nombre || email.split('@')[0],
        rol
      }
    });

  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
