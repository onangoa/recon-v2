import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorId = session.contractor?.id;

    const where: any = {};
    if (session.user.role === 'superadmin') {
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

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorId = session.contractor?.id;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

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