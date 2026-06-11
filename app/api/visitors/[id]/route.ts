import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await prisma.visitor.findUnique({
      where: { id },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Failed to fetch visitor:', error);
    return NextResponse.json({ error: 'Failed to fetch visitor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const visitor = await prisma.visitor.update({
      where: { id },
      data: {
        name: body.name,
        company: body.company,
        purpose: body.purpose,
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        notes: body.notes,
        attachmentName: body.attachmentName,
        attachmentUrl: body.attachmentUrl,
      },
    });

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Failed to update visitor:', error);
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.visitor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete visitor:', error);
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 });
  }
}