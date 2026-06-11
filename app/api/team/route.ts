import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
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
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const contractor = await prisma.contractor.findFirst();
    if (!contractor) {
      return NextResponse.json({ error: 'No contractor found' }, { status: 404 });
    }

    const member = await prisma.teamMember.create({
      data: {
        contractorId: contractor.id,
        name: body.name,
        role: body.role,
        email: body.email || null,
        phone: body.phone || null,
        status: body.status || 'Active',
      },
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: contractor.id,
      action: 'CREATE',
      module: 'TEAM',
      description: `Added team member: ${member.name}`,
      targetId: member.id,
      details: { name: member.name, role: member.role, email: member.email, phone: member.phone }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to create team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
