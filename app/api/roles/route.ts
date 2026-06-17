import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorId = user.contractor?.id || user.teamMember?.contractorId;
    
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { contractorId: contractorId },
          { contractorId: null } // System roles
        ]
      },
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorId = user.contractor?.id || user.teamMember?.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
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
