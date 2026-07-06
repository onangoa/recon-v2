import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'settings:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor not found', 404);
    }

    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId },
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
      return mobileError('Contractor not found', 404);
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

export async function PUT(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'settings:update');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor not found', 404);
    }

    const body = await request.json();

    if (!body.name) {
      return mobileError('Company name is required', 400);
    }

    const contractor = await prisma.contractor.update({
      where: { id: contractorId },
      data: {
        companyName: body.name,
        phoneNumber: body.phone,
        licenseNo: body.licenseNo,
        location: body.location
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    return mobileSuccess({
      id: contractor.id,
      name: contractor.companyName,
      email: contractor.user.email,
      phone: contractor.phoneNumber,
      licenseNo: contractor.licenseNo,
      location: contractor.location,
      createdAt: contractor.createdAt,
      updatedAt: contractor.updatedAt
    }, 'Company updated');
  } catch (error) {
    console.error('Failed to update company:', error);
    return mobileError('Failed to update company', 500);
  }
}
