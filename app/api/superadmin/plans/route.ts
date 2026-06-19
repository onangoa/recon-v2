import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { contractors: true }
        }
      },
      orderBy: {
        price: 'asc',
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const body = await request.json();
    const { name, price, maxSites, maxTeamMembers, features, isActive } = body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: parseFloat(price),
        maxSites: parseInt(maxSites),
        maxTeamMembers: parseInt(maxTeamMembers),
        features: JSON.stringify(features),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Create plan error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A plan with this name already exists',
        field: 'name'
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
