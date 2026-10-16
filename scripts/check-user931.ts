import { prisma } from '../lib/prisma';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'user931@gmail.com' } });
  if (!user) { console.log('not found'); return; }

  console.log('=== FULL TEAM MEMBER ===');
  const tm = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    include: { roleRelation: true, site: { select: { id: true, name: true } } },
  });
  console.log(JSON.stringify(tm, null, 2));

  console.log('\n=== FULL ACTIVITY LOGS TODAY (with module/target/description) ===');
  const logs = await prisma.activityLog.findMany({
    where: { userId: user.id, createdAt: { gte: new Date('2026-10-12T09:00:00Z') } },
    orderBy: { createdAt: 'asc' },
  });
  logs.forEach((l) =>
    console.log(
      l.createdAt.toISOString(),
      '|', l.module ?? '-', '|', l.action, '|', l.description ?? '-', '| target:', l.targetId ?? '-',
      '| details:', JSON.stringify(l.details)?.slice(0, 150) ?? '-'
    )
  );

  console.log('\n=== ROLE PERMISSIONS COUNT PER ROLE (contractor cms2x2a7o001e68tktd879dbn) ===');
  const roles = await prisma.role.findMany({
    where: { contractorId: 'cms2x2a7o001e68tktd879dbn' },
    include: { permissions: { select: { name: true } }, teamMembers: { select: { id: true, userId: true, name: true } } },
  });
  roles.forEach((r) => {
    console.log(`${r.name} (${r.id}) -> ${r.permissions.length} perms: [${r.permissions.map(p => p.name).join(', ')}]`);
    r.teamMembers.forEach((m) => console.log(`   - member: ${m.name} (${m.userId})`));
  });

  console.log('\n=== PERMISSIONS AVAILABLE (sites:read etc.) ===');
  const perms = await prisma.permission.findMany({ where: { OR: [{ name: { startsWith: 'sites:' } }, { name: { startsWith: 'dashboard' } }] }, select: { name: true, module: true, action: true } });
  perms.forEach((p) => console.log(p.name, '|', p.module, '|', p.action));

  console.log('\n=== CONTRACTOR cms2x2a7o001e68tktd879dbn ===');
  const c = await prisma.contractor.findUnique({ where: { id: 'cms2x2a7o001e68tktd879dbn' }, select: { id: true, companyName: true, purchasedSiteSlots: true, createdAt: true } });
  console.log(c);
  const siteCount = await prisma.site.count({ where: { contractorId: 'cms2x2a7o001e68tktd879dbn' } });
  console.log('sites for contractor:', siteCount);
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
