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
  const permCheck = await mobileRequireContractorPermission(request, 'documents:read');
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
        { type: { contains: search } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: {
          uploadedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.document.count({ where })
    ]);

    return mobileList(documents, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return mobileError('Failed to fetch documents', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'documents:create');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      for (const doc of body) {
        if (doc.siteId) {
          const owns = await verifySiteOwnership(contractorId, doc.siteId);
          if (!owns) {
            return mobileError('Site not found', 404);
          }
        }
      }

      const documents = await prisma.$transaction(
        body.map((doc: any) =>
          prisma.document.create({
            data: {
              siteId: doc.siteId,
              name: doc.name,
              type: doc.type,
              fileUrl: doc.fileUrl,
              notes: doc.notes || null,
              uploadedAt: new Date(),
            },
          })
        )
      );

      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId,
        action: 'CREATE',
        module: 'DOCUMENTS',
        description: `Bulk uploaded ${documents.length} documents`,
        details: { count: documents.length }
      });

      return mobileSuccess(documents, 'Documents uploaded');
    } else {
      if (!body.siteId) {
        return mobileError('Site ID is required', 400);
      }

      const owns = await verifySiteOwnership(contractorId, body.siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }

      if (!body.name) {
        return mobileError('Document name is required', 400);
      }

      if (!body.fileUrl) {
        return mobileError('File URL is required', 400);
      }

      if (!body.type) {
        return mobileError('Document type is required', 400);
      }

      const document = await prisma.document.create({
        data: {
          siteId: body.siteId,
          name: body.name,
          type: body.type,
          fileUrl: body.fileUrl,
          notes: body.notes || null,
          uploadedAt: new Date(),
        },
      });

      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId,
        action: 'CREATE',
        module: 'DOCUMENTS',
        description: `Uploaded document: ${document.name}`,
        targetId: document.id,
        details: { name: document.name, type: document.type }
      });

      return mobileSuccess(document, 'Document uploaded');
    }
  } catch (error) {
    console.error('Failed to upload document:', error);
    return mobileError('Failed to upload document', 500);
  }
}
