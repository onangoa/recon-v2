import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'roles:read');
    if (!permCheck.authorized) return permCheck.error;

    const user = await prisma.user.findUnique({
      where: { id: permCheck.userId! },
      select: { role: true },
    });
    const contractorId = permCheck.contractorId || null;
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

    // Allow access if role belongs to this contractor or is a shared/platform role
    if (role.contractorId && role.contractorId !== contractorId && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Failed to fetch role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'roles:update');
    if (!permCheck.authorized) return permCheck.error;

    const user = await prisma.user.findUnique({
      where: { id: permCheck.userId! },
      select: { role: true },
    });
    const contractorId = permCheck.contractorId || null;
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.contractorId && existingRole.contractorId !== contractorId) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.scope === 'platform' && user?.role !== 'superadmin') {
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'roles:delete');
    if (!permCheck.authorized) return permCheck.error;

    const user = await prisma.user.findUnique({
      where: { id: permCheck.userId! },
      select: { role: true },
    });
    const contractorId = permCheck.contractorId || null;
    const { id } = await params;
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.contractorId && existingRole.contractorId !== contractorId) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.scope === 'platform' && user?.role !== 'superadmin') {
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
