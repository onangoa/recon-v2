import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { hashPassword } from '@/lib/jwt';
import { EmailService } from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requireContractorPermission(request, 'team:read');
    if (!permCheck.authorized) return permCheck.error;
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = { contractorId };
    
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

export async function POST(request: NextRequest) {
  try {
    const permCheck = await requireContractorPermission(request, 'team:create');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId!;
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const temporaryPassword = body.password || Math.random().toString(36).slice(-10) + 'A1!';
    const hashedPassword = await hashPassword(temporaryPassword);

    let userId = null;
    if (body.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: body.email,
            password: hashedPassword,
            name: body.name,
            role: 'team_member',
            roleId: body.roleId || null,
          }
        });
        userId = newUser.id;

        const appUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3010').replace(/\/$/, '');
        await EmailService.send({
          to: body.email,
          subject: 'Welcome to ReconSMI – Your Account Has Been Created',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #1e40af;">Welcome to ReconSMI!</h2>
              <p>Hello <strong>${body.name}</strong>,</p>
              <p>An account has been created for you on ReconSMI. Here are your login details:</p>
              <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Email:</strong> ${body.email}</p>
                <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
              </div>
              <p style="margin-top: 16px;">
                <a href="${appUrl}/login" style="background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                  Log In Now
                </a>
              </p>
              <p style="margin-top: 16px; font-size: 13px; color: #64748b;">
                Please change your password after your first login for security purposes.
              </p>
              <hr style="margin-top: 24px; border-color: #e2e8f0;" />
              <p style="font-size: 12px; color: #94a3b8;">If you did not expect this email, please ignore it.</p>
            </div>
          `,
        }).catch(err => console.error('Welcome email error:', err));
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

    if (body.siteId) {
      const site = await prisma.site.findUnique({ where: { id: body.siteId }});
      if (!site || site.contractorId !== contractorId) {
        return NextResponse.json({ error: 'Invalid site' }, { status: 400 });
      }
    }

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
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
