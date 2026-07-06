import { NextRequest } from 'next/server';
import { LicenseExpiryService } from '@/lib/license-expiry-service';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('x-cron-secret');

  const isCronAuthorized = expectedSecret && providedSecret === expectedSecret;

  if (!isCronAuthorized) {
    const permCheck = await mobileRequireSuperadmin(request);
    if (!permCheck.authorized) return permCheck.error!;
  }

  try {
    const result = await LicenseExpiryService.run();
    return mobileSuccess(result);
  } catch (error) {
    console.error('License expiry check failed:', error);
    return mobileError('License expiry check failed', 500);
  }
}
