import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'No company associated' }, { status: 403 });

  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    include: { subscriptionPlan: true },
  });
  if (!contractor || !contractor.subscriptionPlan) {
    return Response.json({ error: true, message: 'No subscription found' }, { status: 404 });
  }

  const plan = contractor.subscriptionPlan;
  const startsAt = contractor.subscriptionEndDate
    ? new Date(contractor.subscriptionEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    : contractor.createdAt;

  return Response.json({
    error: false,
    message: 'Active subscription retrieved successfully',
    data: {
      id: cuidToInt(contractor.id),
      plan_name: plan.name,
      tenure: plan.interval || 'monthly',
      starts_at: startsAt.toISOString().split('T')[0],
      ends_at: contractor.subscriptionEndDate ? contractor.subscriptionEndDate.toISOString().split('T')[0] : null,
      status: contractor.subscriptionStatus || 'active',
      features: {
        max_sites: plan.maxSites ?? -1,
        max_clients: plan.maxProjects ?? -1,
        max_team_members: plan.maxTeamMembers ?? -1,
        max_companies: -1,
        modules: ['clients', 'workers', 'attendance', 'inventory', 'suppliers', 'visitors', 'licenses', 'machines', 'purchase_orders', 'material_deliveries', 'reports'],
      },
      payment_method: 'offline',
      charging_price: String(plan.price ?? 0),
      charging_currency: 'KES',
    },
  });
}