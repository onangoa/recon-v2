import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        user: true,
        subscriptionPlan: true,
        projects: true,
      },
    });
    return NextResponse.json(contractors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
