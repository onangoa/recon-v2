import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const designation = await prisma.designation.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(designation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update designation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.designation.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Designation deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete designation' }, { status: 500 });
  }
}
