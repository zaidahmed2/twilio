import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('twiolo_session')?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Root redirect
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (session.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/agent', req.url));
  }

  // Login page access
  if (pathname === '/login') {
    if (session) {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/agent', req.url));
    }
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/agent', req.url));
    }
    return NextResponse.next();
  }

  // Agent routes protection
  if (pathname.startsWith('/agent')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // API protection
  if (
    pathname.startsWith('/api/leads') ||
    pathname.startsWith('/api/calls') ||
    pathname.startsWith('/api/agents') ||
    pathname.startsWith('/api/assignments') ||
    pathname.startsWith('/api/twilio/token')
  ) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Block agent from admin-only APIs
    if (pathname.startsWith('/api/agents') && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
