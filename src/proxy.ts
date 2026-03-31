import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

const PUBLIC_PATHS = ['/login', '/forgot-password'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname.includes('.') // Files like favicon.ico
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // 1. Unauthenticated User
  if (!session) {
    if (!isPublicPath) {
      // Redirect to login if trying to access protected route
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Authenticated User
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });

    // If visiting login while authenticated, redirect to dashboard based on role
    if (isPublicPath) {
      const role = payload.role as string;
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Role-Based Access Control
    const role = payload.role as string;
    
    // 1. Super Admin trying to access /admin routes
    if (role === 'SUPER_ADMIN' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }

    // 2. Non-Super Admin trying to access /super-admin routes
    if (role !== 'SUPER_ADMIN' && pathname.startsWith('/super-admin')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Pass role in header for server components (optional convenience)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);
    requestHeaders.set('x-user-id', payload.userId as string);
    if (payload.schoolId) {
      requestHeaders.set('x-school-id', payload.schoolId as string);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Middleware auth error:', error);
    // Invalid token, force logout/redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    response.cookies.delete('refresh_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
