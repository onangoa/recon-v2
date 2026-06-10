import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = {
      ...(contractorId ? { contractorId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { nationalId: { contains: search } },
        ]
      } : {})
    };

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        include: { designation: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.worker.count({ where })
    ]);

    return NextResponse.json({
      workers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch workers:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const worker = await prisma.worker.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        nationalId: body.nationalId,
        designationId: body.designationId,
        contractorId: body.contractorId,
        status: body.status || 'Active',
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
      },
      include: {
        designation: true,
      },
    });
    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error('Failed to create worker:', error);
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
