import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'projects:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ],
    } : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          company: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where })
    ]);

    return mobileList(projects, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return mobileError('Failed to fetch projects', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'projects:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();

    if (!body.name) {
      return mobileError('Project name is required', 400);
    }

    if (!body.location) {
      return mobileError('Project location is required', 400);
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        location: body.location,
        description: body.description || null,
        coordinates: body.coordinates || null,
        category: body.category || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status || 'planning',
        companyId: body.companyId || null,
      },
      include: {
        company: true,
      },
    });

    return mobileSuccess(project, 'Project created');
  } catch (error) {
    console.error('Failed to create project:', error);
    return mobileError('Failed to create project', 500);
  }
}
