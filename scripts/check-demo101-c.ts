import { prisma } from '../lib/prisma';

async function main() {
  const demoRoleRows = await prisma.$queryRawUnsafe(
    "SELECT id, name, description, scope, contractorId FROM Role WHERE LOWER(name) LIKE '%demo%'"
  ) as any[];
  const demoRoles = await prisma.role.findMany({
    where: { id: { in: demoRoleRows.map((r) => r.id) } },
    include: {
      permissions: { select: { id: true, name: true } },
      users: { select: { id: true, email: true, name: true, role: true } },
      teamMembers: { select: { id: true, name: true, email: true, userId: true } },
      contractor: { select: { id: true, companyName: true } },
    },
  });

  console.log(`Found ${demoRoles.length} role(s) matching 'demo':\n`);
  demoRoles.forEach((r) => {
    console.log('ROLE:', r.name, '| id:', r.id, '| contractor:', r.contractor?.companyName ?? r.contractorId ?? 'platform', '| scope:', r.scope);
    console.log('  description:', r.description ?? '(none)');
    console.log('  permissions (' + r.permissions.length + '):', r.permissions.map((p) => p.name).join(', ') || '(none)');
    console.log('  assigned users:', r.users.map((u) => `${u.email} (${u.role})`).join(', ') || '(none)');
    console.log('  assigned team members:', r.teamMembers.map((m) => `${m.name} <${m.email}> userId=${m.userId}`).join(', ') || '(none)');
    console.log('');
  });

  const rawJoin = await prisma.$queryRawUnsafe(
    "SELECT rp.B AS roleId, p.name AS permName FROM _RolePermissions rp JOIN Permission p ON p.id = rp.A WHERE rp.B IN (SELECT id FROM Role WHERE LOWER(name) LIKE '%demo%') ORDER BY rp.B, p.name"
  ) as any[];
  console.log('RAW _RolePermissions join rows for demo roles:');
  rawJoin.forEach((row) => console.log(' ', row.roleId, '->', row.permName));
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
