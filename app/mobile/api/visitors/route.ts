import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { verifySiteOwnership } from '@/lib/contractor-isolation';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'visitors:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const siteId = searchParams.get('siteId');
    const skip = (page - 1) * limit;

    const where: any = { site: { contractorId } };

    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
      where.siteId = siteId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { purpose: { contains: search } },
      ];
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        orderBy: {
          checkInTime: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.visitor.count({ where })
    ]);

    return mobileList(visitors, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
    return mobileError('Failed to fetch visitors', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'visitors:create');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();

    if (!body.siteId) {
      return mobileError('Site ID is required', 400);
    }

    const owns = await verifySiteOwnership(contractorId, body.siteId);
    if (!owns) {
      return mobileError('Site not found', 404);
    }

    if (!body.name) {
      return mobileError('Visitor name is required', 400);
    }

    if (!body.purpose) {
      return mobileError('Purpose is required', 400);
    }

    const visitor = await prisma.visitor.create({
      data: {
        site: {
          connect: { id: body.siteId }
        },
        name: body.name,
        company: body.company || null,
        purpose: body.purpose,
        checkInTime: new Date(body.checkInTime || new Date()),
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        projectId: body.projectId || null,
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'VISITORS',
      description: `Checked in visitor: ${visitor.name}`,
      targetId: visitor.id,
      details: { name: visitor.name, company: visitor.company, purpose: visitor.purpose }
    });

    return mobileSuccess(visitor, 'Visitor checked in');
  } catch (error) {
    console.error('Failed to create visitor:', error);
    return mobileError('Failed to create visitor', 500);
  }
}
