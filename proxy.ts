import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
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
    pathname.includes('.webp');
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

  if (!isAuthenticated) {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(new URL('/web/api/auth/refresh', request.url), {
          method: 'POST',
          headers: { cookie: request.headers.get('cookie') || '' },
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.user) {
            isAuthenticated = true;
            tokenPayload = {
              userId: data.user.id,
              email: data.user.email,
              role: data.user.role,
              contractorId: data.contractor?.id || null,
            };

            const response = NextResponse.next();
            if (data.accessToken) {
              response.cookies.set('accessToken', data.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60,
                path: '/',
              });
            }
            const setCookieHeader = refreshResponse.headers.get('set-cookie');
            if (setCookieHeader) {
              response.headers.set('set-cookie', setCookieHeader);
            }
            return response;
          }
        }
      } catch {}
    }
  }

  if (pathname.startsWith('/web/api/')) {
    if (!isAuthenticated && !isAuthApiPath(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Mobile API routes use Bearer token auth – check Authorization header
  if (pathname.startsWith('/api/')) {
    if (!isAuthApiPath(pathname)) {
      const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');
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
    pathname.startsWith('/reset-password');

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
