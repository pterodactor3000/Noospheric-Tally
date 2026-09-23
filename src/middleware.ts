import { createServerClient } from '@supabase/ssr'

import { type NextRequest, NextResponse } from 'next/server'

import { isProtectedPath } from '@/lib/auth/isProtectedPath'
import { getSupabaseEnv } from '@/lib/env'

const AUTH_CACHE_HEADER_NAMES = ['Cache-Control', 'Expires', 'Pragma'] as const

const copyCookiesToResponse = (
  source: NextResponse,
  target: NextResponse,
): NextResponse => {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  AUTH_CACHE_HEADER_NAMES.forEach((headerName) => {
    const headerValue = source.headers.get(headerName)

    if (headerValue) {
      target.headers.set(headerName, headerValue)
    }
  })

  return target
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseEnv = getSupabaseEnv()

  const supabase = createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return copyCookiesToResponse(
      supabaseResponse,
      NextResponse.redirect(loginUrl),
    )
  }

  return supabaseResponse
}

export const runtime = 'experimental-edge'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
