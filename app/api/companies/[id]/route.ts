import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (contractor.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      id: contractor.id,
      name: contractor.companyName,
      email: contractor.user.email,
      phone: contractor.phoneNumber,
      licenseNo: contractor.licenseNo,
      location: contractor.location,
      createdAt: contractor.createdAt,
      updatedAt: contractor.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}