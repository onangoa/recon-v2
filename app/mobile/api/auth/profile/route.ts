import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { mobileAuth, mobileSuccess, mobileError } from '@/lib/mobile-auth';

// PUT /mobile/api/auth/profile
// Updates the authenticated user's name / email / phone / avatar to mirror
// the fields editable on the web "Settings > Profile" tab. Contractor phone
// is persisted on the related Contractor row when present.
export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated || !auth.userId) {
    return mobileError('Unauthenticated.', 401);
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { contractor: true, teamMember: true },
    });
    if (!user) {
      return mobileError('User not found', 404);
    }

    return mobileSuccess({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
      contractor:
        user.contractor
          ? {
              id: user.contractor.id,
              companyName: user.contractor.companyName,
              location: user.contractor.location,
              phoneNumber: user.contractor.phoneNumber,
              licenseNo: user.contractor.licenseNo,
            }
          : null,
    });
  } catch (error) {
    console.error('Mobile profile fetch error:', error);
    return mobileError('Failed to fetch profile', 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated || !auth.userId) {
    return mobileError('Unauthenticated.', 401);
  }
  try {
    const body = await request.json();
    const { name, email, phone, avatar } = body;

    const data: any = {};
    if (typeof name === 'string' && name.trim().length > 0) data.name = name.trim();
    if (typeof email === 'string' && email.trim().length > 0) data.email = email.trim();
    if (avatar !== undefined) data.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data,
      include: { contractor: true, teamMember: true },
    });

    // Persist phone onto the contractor (or team member) so it shows up on
    // the company profile too, mirroring the web flow.
    if (typeof phone === 'string') {
      if (user.contractor) {
        await prisma.contractor.update({
          where: { id: user.contractor.id },
          data: { phoneNumber: phone.trim() },
        });
      } else if (user.teamMember) {
        await prisma.teamMember.update({
          where: { id: user.teamMember.id },
          data: { phone: phone.trim() || null },
        });
      }
    }

    try {
      await ActivityLogger.log({
        userId: user.id,
        contractorId: user.contractor?.id ?? '',
        action: 'UPDATE',
        module: 'SETTINGS',
        description: `${user.name} updated their profile (mobile)`,
      });
    } catch (e) {
      console.error('Activity log error:', e);
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      include: { contractor: true, teamMember: true },
    });

    return mobileSuccess(
      {
        id: refreshed!.id,
        name: refreshed!.name,
        email: refreshed!.email,
        avatar: refreshed!.avatar,
        role: refreshed!.role,
        phone:
          refreshed!.teamMember?.phone ||
          refreshed!.contractor?.phoneNumber ||
          null,
        contractor:
          refreshed!.contractor
            ? {
                id: refreshed!.contractor.id,
                companyName: refreshed!.contractor.companyName,
                location: refreshed!.contractor.location,
                phoneNumber: refreshed!.contractor.phoneNumber,
                licenseNo: refreshed!.contractor.licenseNo,
              }
            : null,
      },
      'Profile updated'
    );
  } catch (error) {
    console.error('Mobile profile update error:', error);
    return mobileError('Failed to update profile', 500);
  }
}