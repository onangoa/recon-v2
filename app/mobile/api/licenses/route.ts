import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { verifySiteOwnership } from '@/lib/contractor-isolation';
import { LicenseExpiryService } from '@/lib/license-expiry-service';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'licenses:read');
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
        { licenseNumber: { contains: search } },
        { issuingAuthority: { contains: search } },
      ];
    }

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        orderBy: {
          expiryDate: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.license.count({ where })
    ]);

    return mobileList(licenses, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch licenses:', error);
    return mobileError('Failed to fetch licenses', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'licenses:create');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();

    if (!body.name) {
      return mobileError('License name is required', 400);
    }

    if (!body.licenseNumber) {
      return mobileError('License number is required', 400);
    }

    if (body.siteId) {
      const owns = await verifySiteOwnership(contractorId, body.siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
    }

    const license = await prisma.license.create({
      data: {
        site: body.siteId ? { connect: { id: body.siteId } } : undefined,
        name: body.name,
        licenseNumber: body.licenseNumber,
        issuingAuthority: body.issuingAuthority || null,
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        type: body.type || null,
        category: body.category || null,
        status: body.status || 'active',
        fileName: body.fileName || null,
        fileData: body.fileData || null,
      },
    });

    if (body.siteId) {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId,
        action: 'CREATE',
        module: 'DOCUMENTS',
        description: `Added license: ${license.name}`,
        targetId: license.id,
        details: { name: license.name, licenseNumber: license.licenseNumber, status: license.status }
      });
    }

    if (license.expiryDate) {
      try {
        await LicenseExpiryService.checkOne(license.id);
      } catch (err) {
        console.error('License expiry immediate-check failed (create):', err);
      }
    }

    return mobileSuccess(license, 'License created');
  } catch (error) {
    console.error('Failed to create license:', error);
    return mobileError('Failed to create license', 500);
  }
}
