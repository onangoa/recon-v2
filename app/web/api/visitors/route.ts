import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: Request) {
  const permCheck = await requireContractorPermission(request as any, 'visitors:read');
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

    return NextResponse.json({
      visitors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const permCheck = await requireContractorPermission(request as any, 'visitors:create');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();
    
    if (!body.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const owns = await verifySiteOwnership(contractorId, body.siteId);
    if (!owns) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    
    if (!body.name) {
      return NextResponse.json({ error: 'Visitor name is required' }, { status: 400 });
    }

    if (!body.purpose) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
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

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Failed to create visitor:', error);
    return NextResponse.json({ error: 'Failed to create visitor' }, { status: 500 });
  }
}