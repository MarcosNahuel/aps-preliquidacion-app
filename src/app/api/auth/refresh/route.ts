import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Crear cliente de Supabase con manejo de cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Ignorar errores de cookies en el servidor
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              // Ignorar errores de cookies en el servidor
            }
          },
        },
      }
    );

    // Obtener el usuario actual
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Refrescar la sesion
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !session) {
      return NextResponse.json({ error: 'Could not refresh session' }, { status: 401 });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Error en refresh:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
