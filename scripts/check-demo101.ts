import { prisma } from '../lib/prisma';

async function main() {
  const email = 'demo101@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      contractor: { select: { id: true, companyName: true, purchasedSiteSlots: true } },
      teamMember: { select: { id: true, contractorId: true, roleId: true, role: true } },
      roleRelation: { include: { permissions: { select: { name: true } } } },
    },
  });

  if (!user) { console.log('USER NOT FOUND:', email); return; }

  console.log('=== USER ===');
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
    roleId: user.roleId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  console.log('=== CONTRACTOR ===');
  console.log(user.contractor ?? 'NO CONTRACTOR RECORD');

  console.log('=== TEAM MEMBER ===');
  console.log(user.teamMember ?? 'NO TEAM MEMBER RECORD');

  console.log('=== ROLE + PERMISSIONS ===');
  if (user.roleRelation) {
    console.log({
      roleId: user.roleRelation.id,
      name: user.roleRelation.name,
      scope: user.roleRelation.scope,
      contractorId: user.roleRelation.contractorId,
      permissionCount: user.roleRelation.permissions.length,
      permissions: user.roleRelation.permissions.map((p) => p.name),
    });
  } else {
    console.log('NO ROLE RELATION');
  }

  if (user.contractor) {
    const siteCount = await prisma.site.count({ where: { contractorId: user.contractor.id } });
    console.log('sites for contractor:', siteCount);
  }

  console.log('\n=== RECENT ACTIVITY LOGS (last 25) ===');
  const logs = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });
  logs.forEach((l) =>
    console.log(l.createdAt.toISOString(), '|', l.module ?? '-', '|', l.action, '|', l.description ?? '-')
  );
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
