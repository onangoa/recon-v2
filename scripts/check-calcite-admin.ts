import { prisma } from '../lib/prisma';

async function main() {
  const contractor = await prisma.contractor.findUnique({
    where: { id: 'cms2x2a7o001e68tktd879dbn' },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, roleId: true, createdAt: true } },
    },
  });

  console.log('=== CONTRACTOR (CALCITE CONSTRUCTION) OWNER ===');
  console.log(contractor?.user);

  console.log('\n=== ALL TEAM MEMBERS OF THIS CONTRACTOR ===');
  const members = await prisma.teamMember.findMany({
    where: { contractorId: 'cms2x2a7o001e68tktd879dbn' },
    include: {
      roleRelation: { select: { name: true } },
      user: { select: { email: true, role: true } },
    },
  });
  members.forEach((m) =>
    console.log(
      m.name, '| tm.email:', m.email, '| role:', m.role,
      '| login email:', m.user?.email ?? '(no login)',
      '| user.role:', m.user?.role ?? '-', '| status:', m.status
    )
  );

  console.log('\n=== USERS WITH THIS CONTRACTOR ID IN JWT-ELIGIBLE WAY (users whose roleId points to this contractor\'s Contractor Admin role) ===');
  const adminRole = await prisma.role.findFirst({
    where: { contractorId: 'cms2x2a7o001e68tktd879dbn', name: 'Contractor Admin' },
    include: { users: { select: { email: true, name: true, role: true } }, teamMembers: { select: { name: true, email: true } } },
  });
  console.log('Contractor Admin role:', adminRole?.id);
  console.log('users on it:', adminRole?.users.map((u) => `${u.name} <${u.email}> (${u.role})`));
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
