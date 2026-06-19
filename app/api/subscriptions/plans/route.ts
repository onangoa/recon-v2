import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });

  return mobileSuccess(plans.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    billing_period: p.interval || 'monthly',
    description: p.description,
  })));
}