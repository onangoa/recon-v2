import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error('Failed to fetch license:', error);
    return NextResponse.json({ error: 'Failed to fetch license' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const license = await prisma.license.update({
      where: { id },
      data: {
        name: body.name,
        licenseNumber: body.licenseNumber,
        issuingAuthority: body.issuingAuthority,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        type: body.type,
        category: body.category,
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error('Failed to update license:', error);
    return NextResponse.json({ error: 'Failed to update license' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.license.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete license:', error);
    return NextResponse.json({ error: 'Failed to delete license' }, { status: 500 });
  }
}
