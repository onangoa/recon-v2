import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

function extractBearer(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/docs',
];

const AUTH_API_PATHS = [
  '/web/api/auth/login',
  '/web/api/auth/register',
  '/web/api/auth/register-contractor',
  '/web/api/auth/refresh',
  '/web/api/auth/forgot-password',
  '/web/api/auth/reset-password',
  '/web/api/subscription-plans',
  '/web/api/payments',
  '/web/api/mpesa',
  '/web/api/callbacks',
  '/web/api/attendance/biometric',
  '/web/api/licenses/check-expiry',
  '/api/config',
  '/api/users/authenticate',
  '/api/users/register',
  '/api/users/forgot-password',
  '/api/subscriptions/plans',
  '/v1/ext/ipn',
  '/mobile/api/auth/login',
  '/mobile/api/auth/refresh',
  '/mobile/api/auth/forgot-password',
  '/mobile/api/auth/reset-password',
  '/mobile/api/subscription-plans',
];

async function verifyTokenEdge(token: string) {
  try {
    const secret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      userId: string;
      email: string;
      role: string;
      contractorId: string | null;
    };
  } catch {
    return null;
  }
}

function isAuthApiPath(pathname: string): boolean {
  return AUTH_API_PATHS.some(p => pathname.startsWith(p));
}

function isStaticOrPublic(pathname: string): boolean {
  return pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple') ||
    pathname.startsWith('/android') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/workbox') ||
    pathname.includes('.png') ||
    pathname.includes('.svg') ||
    pathname.includes('.ico') ||
    pathname.includes('.jpg') ||
    pathname.includes('.jpeg') ||
    pathname.includes('.webp') ;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrPublic(pathname)) {
    return NextResponse.next();
  }

  if (isAuthApiPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  let isAuthenticated = false;
  let tokenPayload: { userId: string; email: string; role: string; contractorId: string | null } | null = null;

  if (accessToken) {
    const payload = await verifyTokenEdge(accessToken);
    if (payload) {
      isAuthenticated = true;
      tokenPayload = payload;
    }
  }

  if (pathname.startsWith('/web/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Mobile API routes use Bearer token auth – check Authorization header
  if (pathname.startsWith('/mobile/api/')) {
    if (!isAuthApiPath(pathname)) {
      const bearerToken = extractBearer(request.headers.get('authorization'));
      if (!bearerToken) {
        return NextResponse.json({ message: 'Unauthenticated.', error: 'Unauthenticated' }, { status: 401 });
      }
      const payload = await verifyTokenEdge(bearerToken);
      if (!payload) {
        return NextResponse.json({ message: 'Unauthenticated.', error: 'Unauthenticated' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // Legacy API routes use Bearer token auth – check Authorization header
  if (pathname.startsWith('/api/')) {
    if (!isAuthApiPath(pathname)) {
      const bearerToken = extractBearer(request.headers.get('authorization'));
      if (!bearerToken && !accessToken) {
        return NextResponse.json({ message: 'Unauthenticated.', error: 'Unauthenticated' }, { status: 401 });
      }
      if (bearerToken) {
        const payload = await verifyTokenEdge(bearerToken);
        if (!payload) {
          return NextResponse.json({ message: 'Unauthenticated.', error: 'Unauthenticated' }, { status: 401 });
        }
      } else if (!isAuthenticated) {
        return NextResponse.json({ message: 'Unauthenticated.', error: 'Unauthenticated' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  const isPublicPath = pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/docs');

  if (isPublicPath) {
    if (isAuthenticated && tokenPayload && (pathname === '/login' || pathname === '/register')) {
      const redirectPath = tokenPayload.role === 'superadmin' ? '/superadmin' : '/contractor';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (tokenPayload) {
    if (pathname.startsWith('/superadmin') && tokenPayload.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/contractor', request.url));
    }
    if (pathname.startsWith('/contractor') && tokenPayload.role === 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-light-32x32.png|icon-dark-32x32.png|apple-icon.png|android-chrome.*\\.png|manifest\\.json|sw\\.js|workbox-.*\\.js).*)',
  ],
};
