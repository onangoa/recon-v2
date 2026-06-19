import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  const { plan_id, phone, payment_method } = body;

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plan_id } });
  if (!plan) return mobileError('Plan not found', 404);

  await prisma.contractor.update({
    where: { id: contractorId },
    data: {
      subscriptionPlanId: plan_id,
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return mobileSuccess({ plan_id, status: 'active' }, 'Subscription initiated successfully');
}