import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'team:read');
    if (!permCheck.authorized) return permCheck.error!;
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const member = await prisma.teamMember.findFirst({
      where: { id, contractorId },
    });

    if (!member) {
      return mobileError('Team member not found', 404);
    }

    return mobileSuccess(member);
  } catch (error) {
    console.error('Failed to fetch team member:', error);
    return mobileError('Failed to fetch team member', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'team:update');
    if (!permCheck.authorized) return permCheck.error!;
    const contractorId = permCheck.contractorId!;

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.teamMember.findFirst({
      where: { id, contractorId },
    });
    if (!existing) {
      return mobileError('Team member not found', 404);
    }

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

    return mobileSuccess(member, 'Team member updated');
  } catch (error) {
    console.error('Failed to update team member:', error);
    return mobileError('Failed to update team member', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'team:delete');
    if (!permCheck.authorized) return permCheck.error!;
    const contractorId = permCheck.contractorId!;

    const { id } = await params;
    const member = await prisma.teamMember.findFirst({
      where: { id, contractorId }
    });

    if (!member) {
      return mobileError('Team member not found', 404);
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

    if (member.userId) {
      await prisma.user.delete({
        where: { id: member.userId }
      });
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    return mobileSuccess(null, 'Team member deleted');
  } catch (error) {
    console.error('Failed to delete team member:', error);
    return mobileError('Failed to delete team member', 500);
  }
}
