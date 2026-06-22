import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'No company associated' }, { status: 403 });

  const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } });
  if (!contractor) return Response.json({ error: true, message: 'No active subscription found' }, { status: 404 });

  await prisma.contractor.update({
    where: { id: contractorId },
    data: { subscriptionStatus: 'canceled' },
  });

  return Response.json({ error: false, message: 'Subscription cancelled successfully' });
}