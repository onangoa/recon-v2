import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permCheck = await requirePermission(request, 'settings:read');

    if (!permCheck.authorized) return permCheck.error;

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

    if (contractor.userId !== permCheck.userId) {
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