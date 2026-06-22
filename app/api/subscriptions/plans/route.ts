import { NextRequest } from 'next/server';
import { cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });

  return Response.json({
    error: false,
    message: 'Subscription plans retrieved successfully',
    data: plans.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price ?? 0,
      maxSites: p.maxSites ?? -1,
      maxTeamMembers: p.maxTeamMembers ?? -1,
      maxProjects: p.maxProjects ?? -1,
      features: typeof p.features === 'string' ? p.features : JSON.stringify(p.features || []),
      max_sites: p.maxSites ?? -1,
      max_clients: p.maxProjects ?? -1,
      max_team_members: p.maxTeamMembers ?? -1,
      max_companies: -1,
      plan_type: p.price === 0 ? 'free' : 'paid',
      modules: ['clients', 'workers', 'attendance', 'inventory', 'suppliers', 'visitors', 'licenses', 'machines', 'purchase_orders', 'material_deliveries', 'reports'],
      monthly_price: String(p.price ?? 0),
      monthly_discounted_price: String(p.price ?? 0),
      yearly_price: String(p.price ?? 0),
      yearly_discounted_price: String(p.price ?? 0),
      lifetime_price: String(p.price ?? 0),
      lifetime_discounted_price: String(p.price ?? 0),
      status: p.isActive ? 'active' : 'inactive',
    })),
  });
}