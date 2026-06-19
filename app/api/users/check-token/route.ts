import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  return mobileSuccess({
    id: auth.user!.id,
    first_name: auth.user!.name?.split(' ')[0] || '',
    last_name: auth.user!.name?.split(' ').slice(1).join(' ') || '',
    email: auth.user!.email,
    phone: auth.user!.phone,
    photo: auth.user!.avatar,
    role: auth.user!.role === 'superadmin' ? 'admin' : auth.user!.role,
    status: true,
  });
}