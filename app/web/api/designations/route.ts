import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'designations:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = contractorId ? { contractorId } : {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [designations, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.designation.count({ where })
    ]);

    return NextResponse.json({
      designations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch designations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'designations:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
    
    // For demo/dev purposes, get the first contractor if ID is missing or placeholder
    let contractorId = body.contractorId;
    if (!contractorId || contractorId === 'placeholder-id') {
      const firstContractor = await prisma.contractor.findFirst();
      contractorId = firstContractor?.id;
    }

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 });
    }

    const designation = await prisma.designation.create({
      data: {
        title: body.title,
        description: body.description,
        salary: body.salary,
        paymentFrequency: body.paymentFrequency,
        isActive: body.isActive ?? true,
        contractorId: contractorId,
      },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: contractorId,
      action: 'CREATE',
      module: 'DESIGNATIONS',
      description: `Created designation: ${designation.title}`,
      targetId: designation.id,
      details: { title: designation.title, salary: designation.salary }
    });

    return NextResponse.json(designation, { status: 201 });
  } catch (error) {
    console.error('Failed to create designation:', error);
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 });
  }
}
