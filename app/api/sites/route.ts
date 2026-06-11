import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

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

    return NextResponse.json({
      sites,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    let contractorId = body.contractorId;
    
    if (!contractorId) {
      const defaultContractor = await prisma.contractor.findFirst();
      if (defaultContractor) {
        contractorId = defaultContractor.id;
      } else {
        return NextResponse.json({ error: 'No contractor found' }, { status: 400 });
      }
    }
    
    const site = await prisma.$transaction(async (tx) => {
      // If this site is being set as primary, unset any other primary sites for this contractor
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
    return NextResponse.json(site);
  } catch (error) {
    console.error('Failed to create site:', error);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
