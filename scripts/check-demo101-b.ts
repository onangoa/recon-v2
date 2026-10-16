import { prisma } from '../lib/prisma';

async function main() {
  const c = await prisma.contractor.findUnique({
    where: { id: 'cmqqm05vm000cxzephjk5xaou' },
    select: { id: true, companyName: true, purchasedSiteSlots: true },
  });
  console.log('contractor:', c);
  const siteCount = await prisma.site.count({ where: { contractorId: 'cmqqm05vm000cxzephjk5xaou' } });
  console.log('sites for contractor:', siteCount);

  const rolePerms = await prisma.role.findUnique({
    where: { id: 'cmv55nkd7000t4eog7co0sik3' },
    select: { name: true, permissions: { select: { name: true } } },
  });
  console.log('DEMO Role perms:', rolePerms?.permissions.map((p) => p.name));
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
