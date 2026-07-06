import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';
import { withContractorFilter } from '@/lib/contractor-isolation';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'sites:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const baseWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const where = withContractorFilter({ where: baseWhere }, contractorId).where;

    const [sites, totalCount] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.site.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return mobileList(sites, totalCount, {
      page,
      limit,
      pages: totalPages,
    });
  } catch (error) {
    return mobileError('Failed to fetch sites', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'sites:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const body = await request.json();

    const site = await prisma.$transaction(async (tx) => {
      if (body.isPrimary) {
        await tx.site.updateMany({
          where: { contractorId: contractorId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return await tx.site.create({
        data: {
          name: body.name,
          location: body.location,
          contractorId: contractorId,
          description: body.description,
          isPrimary: body.isPrimary || false,
        },
      });
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: contractorId,
      action: 'CREATE',
      module: 'SITES',
      description: `Created new site: ${site.name}`,
      targetId: site.id,
      details: { name: site.name, location: site.location }
    });

    return mobileSuccess(site, 'Site created');
  } catch (error) {
    console.error('Failed to create site:', error);
    return mobileError('Failed to create site', 500);
  }
}
