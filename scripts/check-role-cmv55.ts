import { prisma } from '../lib/prisma';

async function main() {
  const role = await prisma.role.findUnique({
    where: { id: 'cmv55qrbz00vpxbt9n9ybs43q' },
    include: {
      permissions: { select: { id: true, name: true, module: true, action: true } },
      users: { select: { id: true, email: true, name: true, role: true, roleId: true } },
      teamMembers: { select: { id: true, name: true, email: true, userId: true, roleId: true, role: true } },
      contractor: { select: { id: true, companyName: true } },
    },
  });

  if (!role) { console.log('ROLE NOT FOUND'); return; }

  console.log('=== ROLE cmv55qrbz00vpxbt9n9ybs43q ===');
  console.log({
    name: role.name,
    description: role.description,
    scope: role.scope,
    contractor: role.contractor?.companyName ?? role.contractorId ?? 'platform/shared',
  });
  console.log(`permissions (${role.permissions.length}):`);
  role.permissions.forEach((p) => console.log('  -', p.name, '|', p.module, p.action, '| id:', p.id));
  console.log('assigned users:', role.users.map((u) => `${u.email} (user.role=${u.role}, user.roleId=${u.roleId})`));
  console.log('assigned team members:', role.teamMembers.map((m) => `${m.name} <${m.email}> tm.roleId=${m.roleId} tm.role="${m.role}"`));

  console.log('\n=== ALL ROLES OF CONTRACTOR (Bernhard and Sons cmqqm05vm000cxzephjk5xaou) ===');
  const contractorRoles = await prisma.role.findMany({
    where: { contractorId: 'cmqqm05vm000cxzephjk5xaou' },
    include: { permissions: { select: { name: true } }, users: { select: { email: true } } },
  });
  contractorRoles.forEach((r) =>
    console.log(`${r.id} | "${r.name}" | ${r.permissions.length} perms [${r.permissions.map((p) => p.name).join(', ')}] | users: ${r.users.map((u) => u.email).join(', ') || 'none'}`)
  );

  console.log('\n=== demo101 CURRENT ASSIGNMENT ===');
  const demo = await prisma.user.findUnique({
    where: { email: 'demo101@gmail.com' },
    select: { id: true, email: true, role: true, roleId: true, updatedAt: true },
  });
  console.log(demo);
  const tm = await prisma.teamMember.findFirst({ where: { userId: demo!.id }, select: { id: true, roleId: true, role: true, updatedAt: true } });
  console.log(tm);
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
