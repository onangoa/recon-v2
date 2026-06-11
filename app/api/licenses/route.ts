import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({
      licenses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch licenses:', error);
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'License name is required' }, { status: 400 });
    }

    if (!body.licenseNumber) {
      return NextResponse.json({ error: 'License number is required' }, { status: 400 });
    }

    const license = await prisma.license.create({
      data: {
        siteId: body.siteId || null,
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
        notes: body.notes || null,
      },
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error('Failed to create license:', error);
    return NextResponse.json({ error: 'Failed to create license' }, { status: 500 });
  }
}