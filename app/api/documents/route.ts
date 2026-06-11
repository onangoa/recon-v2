import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const siteId = searchParams.get('siteId');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (siteId) {
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
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk upload
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

      const site = await prisma.site.findUnique({
        where: { id: body[0].siteId }
      });

      if (site) {
        await ActivityLogger.log({
          userId: 'system',
          contractorId: site.contractorId,
          action: 'CREATE',
          module: 'DOCUMENTS',
          description: `Bulk uploaded ${documents.length} documents`,
          details: { count: documents.length }
        });
      }

      return NextResponse.json(documents);
    } else {
      // Single upload
      if (!body.siteId) {
        return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
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

      const site = await prisma.site.findUnique({
        where: { id: body.siteId }
      });

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

      if (site) {
        await ActivityLogger.log({
          userId: 'system',
          contractorId: site.contractorId,
          action: 'CREATE',
          module: 'DOCUMENTS',
          description: `Uploaded document: ${document.name}`,
          targetId: document.id,
          details: { name: document.name, type: document.type }
        });
      }

      return NextResponse.json(document);
    }
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}