import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { hasPermission, getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    if (!await hasPermission('team:read')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { role: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        include: {
          roleRelation: {
            include: {
              permissions: true
            }
          },
          site: true
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.teamMember.count({ where })
    ]);

    return NextResponse.json({
      members,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await hasPermission('team:create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const user = await getCurrentUser();
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const contractorId = user?.contractor?.id || user?.teamMember?.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Create User account for team member if email is provided
    let userId = null;
    if (body.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: body.email,
            password: 'password123', // Default password
            name: body.name,
            role: 'team_member',
            roleId: body.roleId || null,
          }
        });
        userId = newUser.id;
      }
    }

    const member = await prisma.teamMember.create({
      data: {
        contractorId: contractorId,
        userId: userId,
        roleId: body.roleId || null,
        name: body.name,
        role: body.role || 'Member',
        email: body.email || null,
        phone: body.phone || null,
        status: body.status || 'Active',
        siteId: body.siteId || null,
      },
    });

    await ActivityLogger.log({
      userId: user?.id || 'system',
      contractorId: contractorId,
      action: 'CREATE',
      module: 'TEAM',
      description: `Added team member: ${member.name}`,
      targetId: member.id,
      details: { name: member.name, role: member.role, email: member.email, phone: body.phone }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to create team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
