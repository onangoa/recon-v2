import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'settings:read');

    if (!permCheck.authorized) return permCheck.error;

    if (!permCheck.contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const contractor = await prisma.contractor.findUnique({
      where: { id: permCheck.contractorId },
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
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
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

export async function PUT(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'settings:update');

    if (!permCheck.authorized) return permCheck.error;

    if (!permCheck.contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const contractor = await prisma.contractor.update({
      where: { id: permCheck.contractorId },
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
    console.error('Failed to update company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}