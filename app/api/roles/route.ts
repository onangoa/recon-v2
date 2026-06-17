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
