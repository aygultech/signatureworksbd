import { NextResponse } from 'next/server'
import { parseSession, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

const SECTION_PATHS = {
  contacts: ['/admin/contacts'],
  bookings: ['/admin/bookings'],
  portfolio: ['/admin/portfolio'],
  blog: ['/admin/blog'],
  settings: ['/admin/settings'],
  media: ['/admin/media'],
  users: ['/admin/users'],
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (PUBLIC_ADMIN_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const session = await parseSession(request.cookies.get(COOKIE_NAME)?.value)
  if (!session) return NextResponse.redirect(new URL('/admin/login', request.url))

  // Dashboard, change-password always accessible when logged in
  if (pathname === '/admin' || pathname === '/admin/change-password') return NextResponse.next()

  // Super admin has full access
  if (session.role === 'super_admin') return NextResponse.next()

  // Check section permissions for regular admins
  for (const [section, paths] of Object.entries(SECTION_PATHS)) {
    if (paths.some(p => pathname.startsWith(p))) {
      if (!session.permissions?.[section]) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
