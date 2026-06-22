import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const body = await request.json();
  const { plan_id, phone, payment_method } = body;

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'No company associated' }, { status: 403 });

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plan_id } });
  if (!plan) return Response.json({ error: true, message: 'Plan not found' }, { status: 404 });

  const transactionId = `STK-${Date.now()}`;
  const checkoutRequestId = `QR${Date.now()}`;

  await prisma.contractor.update({
    where: { id: contractorId },
    data: {
      subscriptionPlanId: plan_id,
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return Response.json({
    success: true,
    error: false,
    message: 'STK push initiated successfully. Please complete payment on your phone.',
    data: {
      subscription_id: cuidToInt(contractorId),
      transaction_id: transactionId,
      checkout_request_id: checkoutRequestId,
      merchant_request_id: null,
      charging_price: String(plan.price ?? 0),
      charging_currency: 'KES',
      phone_number: phone || null,
      status: 'pending',
    },
  });
}