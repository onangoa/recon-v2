import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const designation = await prisma.designation.findUnique({
      where: { id },
    });
    if (!designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }
    return NextResponse.json(designation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch designation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // For demo/dev purposes, get the first contractor if ID is missing or placeholder
    let contractorId = body.contractorId;
    if (contractorId === 'placeholder-id') {
      const firstContractor = await prisma.contractor.findFirst();
      contractorId = firstContractor?.id;
    }

    const designation = await prisma.designation.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        salary: body.salary,
        paymentFrequency: body.paymentFrequency,
        isActive: body.isActive,
        contractorId: contractorId, // Update if provided/resolved
      },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: designation.contractorId,
      action: 'UPDATE',
      module: 'DESIGNATIONS',
      description: `Updated designation: ${designation.title}`,
      targetId: designation.id,
      details: { title: designation.title, active: designation.isActive }
    });

    return NextResponse.json(designation);
  } catch (error) {
    console.error('Failed to update designation:', error);
    return NextResponse.json({ error: 'Failed to update designation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const designation = await prisma.designation.delete({
      where: { id },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: designation.contractorId,
      action: 'DELETE',
      module: 'DESIGNATIONS',
      description: `Deleted designation: ${designation.title}`,
      targetId: designation.id,
    });

    return NextResponse.json({ message: 'Designation deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete designation' }, { status: 500 });
  }
}
