import { prisma } from './prisma';

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleRelation: {
        include: {
          permissions: true
        }
      }
    }
  });

  if (!user || !user.roleRelation) return false;

  // Contractor Admin has all permissions
  if (user.roleRelation.name === 'Contractor Admin') return true;
  if (user.role === 'superadmin') return true;

  return user.roleRelation.permissions.some(p => p.name === permissionName);
}

export async function getPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleRelation: {
        include: {
          permissions: true
        }
      }
    }
  });

  if (!user || !user.roleRelation) return [];

  // If Contractor Admin, return all permissions (or a special flag)
  if (user.roleRelation.name === 'Contractor Admin' || user.role === 'superadmin') {
    const allPermissions = await prisma.permission.findMany();
    return allPermissions.map(p => p.name);
  }

  return user.roleRelation.permissions.map(p => p.name);
}
