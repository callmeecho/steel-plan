import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  )
}

function stripV2Prefix(pathname: string) {
  if (!pathname.startsWith('/v2')) return pathname
  const stripped = pathname.replace(/^\/v2/, '')
  return stripped || '/orders'
}

function shouldRewriteToV2(pathname: string) {
  return (
    pathname === '/orders' ||
    pathname === '/generate' ||
    pathname === '/plans' ||
    pathname.startsWith('/params/') ||
    /^\/tasks\/[^/]+\/plans$/.test(pathname) ||
    /^\/tasks\/[^/]+\/compare$/.test(pathname)
  )
}

function applySessionCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })
  return target
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  if (isPublicAsset(pathname)) {
    return supabaseResponse
  }

  if (pathname === '/') {
    const target = request.nextUrl.clone()
    target.pathname = '/orders'
    target.search = search
    return applySessionCookies(NextResponse.redirect(target), supabaseResponse)
  }

  if (pathname === '/v2' || pathname.startsWith('/v2/')) {
    const target = request.nextUrl.clone()
    target.pathname = stripV2Prefix(pathname)
    target.search = search
    return applySessionCookies(NextResponse.redirect(target), supabaseResponse)
  }

  if (shouldRewriteToV2(pathname)) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/v2${pathname}`
    return applySessionCookies(NextResponse.rewrite(rewriteUrl), supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
