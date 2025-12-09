import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Este endpoint crea un usuario auditor con email auto-confirmado
// Solo debe usarse en desarrollo o por un super admin
export async function POST(request: NextRequest) {
  try {
    // Verificar clave de administrador
    const { adminKey, email, password, nombre } = await request.json();

    // Clave simple para proteger el endpoint (en produccion usar algo mas seguro)
    if (adminKey !== 'DGE_ADMIN_2024') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 }
      );
    }

    // Usar service role key para crear usuario con email confirmado
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Crear usuario en auth con email confirmado
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombre: nombre || 'Auditor DGE',
        rol: 'AUDITOR',
        id_colegio: null
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

    // Esperar a que el trigger cree el registro en aps_usuarios
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar que el perfil se creo
    const { data: userData } = await supabaseAdmin
      .from('aps_usuarios')
      .select('id, email, nombre, rol')
      .eq('auth_user_id', authData.user.id)
      .single();

    return NextResponse.json({
      success: true,
      mensaje: 'Usuario auditor creado exitosamente',
      usuario: userData || {
        email: authData.user.email,
        nombre: nombre || 'Auditor DGE',
        rol: 'AUDITOR'
      },
      credenciales: {
        email,
        password
      }
    });

  } catch (error) {
    console.error('Error en create-auditor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
