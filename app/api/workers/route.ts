import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  if (!body.name) return mobileError('Worker name is required', 400);

  const worker = await prisma.worker.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      nationalId: body.national_id || body.nationalId || null,
      designationId: body.designation_id || null,
      shiftId: body.shift_id || null,
      paymentMode: body.payment_mode || 'manual',
      paymentPhone: body.payment_phone || null,
      paymentAccount: body.payment_account || null,
      status: body.status || 'Active',
      contractorId,
    },
  });

  return mobileSuccess({
    id: worker.id,
    name: worker.name,
    email: worker.email,
    phone: worker.phone,
    status: worker.status,
  }, 'Worker created successfully');
}