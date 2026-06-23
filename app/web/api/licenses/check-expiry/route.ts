import { NextRequest, NextResponse } from 'next/server';
import { LicenseExpiryService } from '@/lib/license-expiry-service';

export async function GET(request: NextRequest) {
  // Allow either a shared CRON_SECRET header (for external schedulers) or an
  // authenticated superadmin request (manual trigger from the UI).
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('x-cron-secret');

  const isCronAuthorized = expectedSecret && providedSecret === expectedSecret;

  let isSuperAdmin = false;
  if (!isCronAuthorized) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (accessToken) {
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me');
        const { payload } = await jwtVerify(accessToken, secret);
        isSuperAdmin = (payload as any).role === 'superadmin';
      } catch {
        isSuperAdmin = false;
      }
    }
  }

  if (!isCronAuthorized && !isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await LicenseExpiryService.run();
    return NextResponse.json(result);
  } catch (error) {
    console.error('License expiry check failed:', error);
    return NextResponse.json(
      { error: 'License expiry check failed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}