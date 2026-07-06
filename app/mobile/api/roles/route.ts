import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'roles:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;

    const where: any = {};
    if (permCheck.user?.role === 'superadmin') {
    } else if (contractorId) {
      where.OR = [
        { contractorId: contractorId },
        { contractorId: null, scope: 'contractor' }
      ];
    } else {
      where.OR = [
        { contractorId: null, scope: 'contractor' }
      ];
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: true
      }
    });

    return mobileSuccess(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return mobileError('Failed to fetch roles', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'roles:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return mobileError('Role name is required', 400);
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        scope: 'contractor',
        contractorId,
        permissions: {
          connect: permissionIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        permissions: true
      }
    });

    return mobileSuccess(role, 'Role created');
  } catch (error) {
    console.error('Failed to create role:', error);
    return mobileError('Failed to create role', 500);
  }
}
