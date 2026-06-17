import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Failed to fetch role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body;

    // Ensure user only edits their own roles (or has permission)
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.contractorId === null && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Cannot edit system roles' }, { status: 403 });
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: {
          set: permissionIds?.map((pid: string) => ({ id: pid })) || []
        }
      },
      include: {
        permissions: true
      }
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.contractorId === null && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 });
    }

    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
