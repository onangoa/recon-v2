import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'designations:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = { contractorId };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [designations, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.designation.count({ where })
    ]);

    return mobileList(designations, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch designations error:', error);
    return mobileError('Failed to fetch designations', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'designations:create');
    if (!permCheck.authorized) return permCheck.error!;

    const body = await request.json();
    const contractorId = permCheck.contractorId!;

    const designation = await prisma.designation.create({
      data: {
        title: body.title,
        description: body.description,
        salary: body.salary,
        paymentFrequency: body.paymentFrequency,
        isActive: body.isActive ?? true,
        contractorId: contractorId,
      },
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: contractorId,
      action: 'CREATE',
      module: 'DESIGNATIONS',
      description: `Created designation: ${designation.title}`,
      targetId: designation.id,
      details: { title: designation.title, salary: designation.salary }
    });

    return mobileSuccess(designation, 'Designation created');
  } catch (error) {
    console.error('Mobile create designation error:', error);
    return mobileError('Failed to create designation', 500);
  }
}
