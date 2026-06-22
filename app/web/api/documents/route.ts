import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: Request) {
  const permCheck = await requireContractorPermission(request as any, 'documents:read');
  if (!permCheck.authorized) return permCheck.error;
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
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
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

    return NextResponse.json({
      documents,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const permCheck = await requireContractorPermission(request as any, 'documents:create');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk upload - verify all site IDs
      for (const doc of body) {
        if (doc.siteId) {
          const owns = await verifySiteOwnership(contractorId, doc.siteId);
          if (!owns) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
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

      return NextResponse.json(documents);
    } else {
      // Single upload
      if (!body.siteId) {
        return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
      }

      const owns = await verifySiteOwnership(contractorId, body.siteId);
      if (!owns) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }

      if (!body.name) {
        return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
      }

      if (!body.fileUrl) {
        return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
      }

      if (!body.type) {
        return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
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

      return NextResponse.json(document);
    }
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}