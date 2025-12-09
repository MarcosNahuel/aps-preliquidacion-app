import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Mapeo de subdominios a rutas
const SUBDOMAIN_ROUTES: Record<string, string> = {
  'admin': '/admin',
  'escuela': '/escuela',
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Detectar subdominio
  const subdomain = hostname.split('.')[0]
  const isSubdomain = SUBDOMAIN_ROUTES[subdomain] !== undefined

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Si es un subdominio y la ruta es la raiz, redirigir a la ruta correspondiente
  if (isSubdomain && pathname === '/') {
    const targetRoute = SUBDOMAIN_ROUTES[subdomain]
    const url = request.nextUrl.clone()
    url.pathname = targetRoute
    return NextResponse.rewrite(url)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Usar nombre de cookie unico por tipo de acceso para separar sesiones
          const cookieName = isSubdomain ? `${subdomain}_${name}` : name
          return request.cookies.get(cookieName)?.value || request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieName = isSubdomain ? `${subdomain}_${name}` : name
          request.cookies.set({
            name: cookieName,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name: cookieName,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          const cookieName = isSubdomain ? `${subdomain}_${name}` : name
          request.cookies.set({
            name: cookieName,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name: cookieName,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesion si existe
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
