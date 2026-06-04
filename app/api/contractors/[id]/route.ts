import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        user: true,
        subscriptionPlan: true,
        projects: true,
      },
    });
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }
    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contractor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const contractor = await prisma.contractor.update({
      where: { id },
      data: body,
      include: {
        user: true,
        subscriptionPlan: true,
      },
    });
    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contractor.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Contractor deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
