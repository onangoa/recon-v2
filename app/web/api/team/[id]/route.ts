import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'team:read');
    if (!permCheck.authorized) return permCheck.error;
    const { id } = await params;
    const member = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to fetch team member:', error);
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'team:update');
    if (!permCheck.authorized) return permCheck.error;

    const { id } = await params;
    const body = await request.json();

    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        roleId: body.roleId,
        email: body.email,
        phone: body.phone,
        status: body.status,
        siteId: body.siteId,
      },
    });

    // Sync with User account if exists
    if (member.userId) {
      await prisma.user.update({
        where: { id: member.userId },
        data: {
          name: body.name,
          email: body.email,
          roleId: body.roleId,
        }
      });
    }

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: member.contractorId,
      action: 'UPDATE',
      module: 'TEAM',
      description: `Updated team member: ${member.name}`,
      targetId: member.id,
      details: { name: member.name, role: member.role, status: member.status }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to update team member:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'team:delete');
    if (!permCheck.authorized) return permCheck.error;

    const { id } = await params;
    const member = await prisma.teamMember.findUnique({
      where: { id }
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: member.contractorId,
      action: 'DELETE',
      module: 'TEAM',
      description: `Deleted team member: ${member.name}`,
      targetId: member.id,
      details: { name: member.name, role: member.role }
    });

    // Delete corresponding user if exists
    if (member.userId) {
      await prisma.user.delete({
        where: { id: member.userId }
      });
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete team member:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
