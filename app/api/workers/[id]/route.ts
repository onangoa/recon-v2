import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const worker = await prisma.worker.findUnique({
    where: { id },
    include: { designation: true, shift: true },
  });
  if (!worker) return mobileError('Worker not found', 404);

  return mobileSuccess({
    id: worker.id,
    name: worker.name,
    email: worker.email,
    phone: worker.phone,
    national_id: worker.nationalId,
    designation: worker.designation?.title || null,
    designation_id: worker.designationId,
    shift: worker.shift?.name || null,
    shift_id: worker.shiftId,
    payment_mode: worker.paymentMode,
    payment_phone: worker.paymentPhone,
    payment_account: worker.paymentAccount,
    status: worker.status,
    joined_at: worker.joinedAt,
    created_at: worker.createdAt,
    updated_at: worker.updatedAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.national_id !== undefined) data.nationalId = body.national_id;
  if (body.designation_id !== undefined) data.designationId = body.designation_id;
  if (body.shift_id !== undefined) data.shiftId = body.shift_id;
  if (body.payment_mode !== undefined) data.paymentMode = body.payment_mode;
  if (body.payment_phone !== undefined) data.paymentPhone = body.payment_phone;
  if (body.payment_account !== undefined) data.paymentAccount = body.payment_account;
  if (body.status !== undefined) data.status = body.status;

  const worker = await prisma.worker.update({ where: { id }, data });
  return mobileSuccess({ id: worker.id, name: worker.name }, 'Worker updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  await prisma.worker.delete({ where: { id } });
  return mobileSuccess(null, 'Worker deleted successfully');
}