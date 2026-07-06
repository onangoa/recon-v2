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
    const { id } = await params;
    const permCheck = await mobileRequirePermission(request, 'settings:read');
    if (!permCheck.authorized) return permCheck.error!;

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
      return mobileError('Company not found', 404);
    }

    if (contractor.userId !== permCheck.userId) {
      return mobileError('Forbidden', 403);
    }

    return mobileSuccess({
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
    return mobileError('Failed to fetch company', 500);
  }
}
