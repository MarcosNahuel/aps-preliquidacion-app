import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirigir a la pagina siguiente
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Si hay error o no hay codigo, redirigir al login
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
