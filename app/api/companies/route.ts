import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        user: true,
      },
    });
    return NextResponse.json(contractors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contractor = await prisma.contractor.create({
      data: {
        companyName: body.companyName,
        location: body.location,
        phoneNumber: body.phoneNumber,
        licenseNo: body.licenseNo,
        userId: body.userId,
        subscriptionPlanId: body.subscriptionPlanId,
      },
    });
    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company profile' }, { status: 500 });
  }
}
