import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    include: { subscriptionPlan: true },
  });
  if (!contractor) return mobileError('Contractor not found', 404);

  return mobileSuccess({
    id: contractor.id,
    plan_id: contractor.subscriptionPlanId,
    status: contractor.subscriptionStatus,
    starts_at: contractor.createdAt,
    ends_at: contractor.subscriptionEndDate,
  });
}