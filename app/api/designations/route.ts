import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    const designations = await prisma.designation.findMany({
      where: contractorId ? { contractorId } : {},
    });
    return NextResponse.json(designations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch designations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
