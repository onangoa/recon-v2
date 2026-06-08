import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const component = await prisma.salaryComponent.findUnique({
      where: { id },
    });
    if (!component) {
      return NextResponse.json({ error: 'Salary component not found' }, { status: 404 });
    }
    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch salary component' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const component = await prisma.salaryComponent.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update salary component' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.salaryComponent.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Salary component deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salary component' }, { status: 500 });
  }
}
