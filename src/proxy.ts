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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublicAsset(pathname)) {
    return NextResponse.next({ request })
  }

  if (pathname === '/') {
    const target = request.nextUrl.clone()
    target.pathname = '/orders'
    target.search = search
    return NextResponse.redirect(target)
  }

  if (pathname === '/v2' || pathname.startsWith('/v2/')) {
    const target = request.nextUrl.clone()
    target.pathname = stripV2Prefix(pathname)
    target.search = search
    return NextResponse.redirect(target)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
