import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const designation = await prisma.designation.create({
      data: {
        title: body.title,
        description: body.description,
        salary: body.salary,
        paymentFrequency: body.paymentFrequency,
        isActive: body.isActive ?? true,
        contractorId: body.contractorId,
      },
    });
    return NextResponse.json(designation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 });
  }
}
