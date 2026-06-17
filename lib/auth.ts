import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          contractor: true,
          teamMember: true,
          roleRelation: {
            include: {
              permissions: true
            }
          }
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function hasPermission(permissionName: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  // Superadmin has all permissions
  if (user.role === 'superadmin') return true;

  if (!user.roleRelation) return false;

  // Contractor Admin has all permissions for their contractor
  if (user.roleRelation.name === 'Contractor Admin') return true;

  return user.roleRelation.permissions.some(p => p.name === permissionName);
}
