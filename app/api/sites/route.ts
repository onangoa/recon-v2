import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      include: {
        project: true,
      },
    });
    return NextResponse.json(sites);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const site = await prisma.site.create({
      data: {
        name: body.name,
        location: body.location,
        projectId: body.projectId,
        description: body.description,
        coordinates: body.coordinates,
      },
    });
    return NextResponse.json(site);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
