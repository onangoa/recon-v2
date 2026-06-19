import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const search = request.nextUrl.searchParams.get('search') || '';
  const status = request.nextUrl.searchParams.get('status') || '';

  const where: any = { contractorId };
  if (search) where.name = { contains: search };
  if (status) where.status = status;

  const workers = await prisma.worker.findMany({
    where,
    include: { designation: true, shift: true },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(workers.map(w => ({
    id: w.id,
    name: w.name,
    email: w.email,
    phone: w.phone,
    national_id: w.nationalId,
    designation: w.designation?.title || null,
    designation_id: w.designationId,
    shift: w.shift?.name || null,
    shift_id: w.shiftId,
    payment_mode: w.paymentMode,
    payment_phone: w.paymentPhone,
    payment_account: w.paymentAccount,
    status: w.status,
    joined_at: w.joinedAt,
    created_at: w.createdAt,
  })));
}