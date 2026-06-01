import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const visitors = await prisma.visitor.findMany({
      include: {
        project: true,
      },
    });
    return NextResponse.json(visitors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const visitor = await prisma.visitor.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        company: body.company,
        purpose: body.purpose,
        checkInTime: new Date(body.checkInTime),
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : undefined,
      },
      include: {
        project: true,
      },
    });
    return NextResponse.json(visitor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create visitor' }, { status: 500 });
  }
}
