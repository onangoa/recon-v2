import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await mobileRequirePermission(request, 'roles:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId || null;
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!role) {
      return mobileError('Role not found', 404);
    }

    if (role.contractorId && role.contractorId !== contractorId && permCheck.user?.role !== 'superadmin') {
      return mobileError('Role not found', 404);
    }

    return mobileSuccess(role);
  } catch (error) {
    console.error('Failed to fetch role:', error);
    return mobileError('Failed to fetch role', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await mobileRequirePermission(request, 'roles:update');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId || null;
    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return mobileError('Role not found', 404);
    }

    if (existingRole.contractorId && existingRole.contractorId !== contractorId) {
      return mobileError('Role not found', 404);
    }

    if (existingRole.scope === 'platform' && permCheck.user?.role !== 'superadmin') {
      return mobileError('Cannot edit system roles', 403);
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

    return mobileSuccess(role, 'Role updated');
  } catch (error) {
    console.error('Failed to update role:', error);
    return mobileError('Failed to update role', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await mobileRequirePermission(request, 'roles:delete');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId || null;
    const { id } = await params;
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return mobileError('Role not found', 404);
    }

    if (existingRole.contractorId && existingRole.contractorId !== contractorId) {
      return mobileError('Role not found', 404);
    }

    if (existingRole.scope === 'platform' && permCheck.user?.role !== 'superadmin') {
      return mobileError('Cannot delete system roles', 403);
    }

    await prisma.role.delete({
      where: { id }
    });

    return mobileSuccess(null, 'Role deleted');
  } catch (error) {
    console.error('Failed to delete role:', error);
    return mobileError('Failed to delete role', 500);
  }
}
