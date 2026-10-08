import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, requireContractorPermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'roles:read');
    if (!permCheck.authorized) return permCheck.error;

    const user = await prisma.user.findUnique({
      where: { id: permCheck.userId! },
      select: { role: true },
    });
    const contractorId = permCheck.contractorId || null;

    const where: any = {};
    if (user?.role === 'superadmin') {
      // Superadmin sees all roles
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

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await requireContractorPermission(request, 'roles:create');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId!;

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
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

    return NextResponse.json(role);
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
