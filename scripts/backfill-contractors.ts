import { prisma } from '../lib/prisma';

async function main() {
  const allPermissions = await prisma.permission.findMany({ select: { id: true } });

  const contractors = await prisma.contractor.findMany({
    include: {
      user: {
        select: { id: true, roleId: true, name: true, email: true, role: true },
      },
    },
  });

  const affected = contractors.filter(
    (c) => c.user && c.user.roleId === null && c.user.role === 'contractor'
  );

  process.stdout.write(`Found ${affected.length} contractor(s) missing a role\n`);

  for (const c of affected) {
    const role = await prisma.role.create({
      data: {
        name: 'Contractor Admin',
        description: 'Full access to contractor dashboard',
        scope: 'contractor',
        contractorId: c.id,
        permissions: {
          connect: allPermissions.map((p) => ({ id: p.id })),
        },
      },
    });

    await prisma.user.update({
      where: { id: c.user.id },
      data: { roleId: role.id },
    });

    process.stdout.write(`Backfilled ${c.user.email} (${c.user.id}) -> role ${role.id}\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });