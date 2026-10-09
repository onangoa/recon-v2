import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'dashboard:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Non-superadmin users can only see their own contractor
    const where = permCheck.contractorId ? { id: permCheck.contractorId } : {};

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        where,
        include: {
          user: true,
          subscriptionPlan: true,
          sites: true,
        },
        take: limit,
        skip: skip,
      }),
      prisma.contractor.count({ where })
    ]);

    return NextResponse.json({
      contractors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch contractors:', error);
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'settings:manage');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
    const contractor = await prisma.contractor.create({
      data: {
        userId: body.userId,
        companyName: body.companyName,
        location: body.location,
        phoneNumber: body.phoneNumber,
        licenseNo: body.licenseNo,
        subscriptionPlanId: body.subscriptionPlanId,
      },
      include: {
        user: true,
        subscriptionPlan: true,
      },
    });
    return NextResponse.json(contractor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
