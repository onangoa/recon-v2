import { prisma } from '../lib/prisma';

/**
 * One-off migration that introduces the module-agnostic `approve` permission
 * (used to approve / reject pending wallet transactions) and cleans up the
 * legacy per-module `:<module>:approve` rows that the old seed generated.
 *
 * It also grants the new `approve` permission to every existing role that
 * currently holds *all* permissions (i.e. the "Contractor Admin" role created
 * per contractor during registration / superadmin contractor creation) so
 * existing contractor owners keep their approval rights.
 *
 * Non-destructive: it does not delete any other rows or roles.
 */
async function main() {
  // 1. Find or create the standalone `approve` permission.
  let approve = await prisma.permission.findUnique({ where: { name: 'approve' } });
  if (!approve) {
    approve = await prisma.permission.create({
      data: {
        name: 'approve',
        module: 'WALLETS',
        action: 'APPROVE',
        description: 'Can approve pending wallet transactions',
      },
    });
    process.stdout.write(`Created standalone 'approve' permission (${approve.id})\n`);
  } else {
    process.stdout.write(`Standalone 'approve' permission already exists (${approve.id})\n`);
  }

  // 2. Grant it to every role that currently has all permissions
  //    (a reasonable proxy for "Contractor Admin" roles, which were created
  //    with `connect: permissions.map(...)` against all permissions).
  const allPermissionCount = await prisma.permission.count({
    where: { name: { not: { endsWith: ':approve' } } },
  });
  void allPermissionCount;

  const roles = await prisma.role.findMany({
    include: { _count: { select: { permissions: true } } },
  });

  let grantedCount = 0;
  for (const role of roles) {
    if (role.name === 'Contractor Admin') {
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: { connect: { id: approve.id } } },
      });
      grantedCount++;
    } else if (role.name === 'Manager') {
      // Managers historically inherited every permission except DELETE/MANAGE;
      // APPROVE is neither, so keep parity and grant the new approve perm too.
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: { connect: { id: approve.id } } },
      });
      grantedCount++;
    }
  }
  process.stdout.write(`Granted 'approve' to ${grantedCount} role(s)\n`);

  // 3. Remove the obsolete per-module `:<module>:approve` permission rows.
  //    These were never enforced but pollute the permission catalog and the
  //    roles<->permissions join table.
  const legacyApprove = await prisma.permission.findMany({
    where: { action: 'APPROVE', name: { not: 'approve' } },
    select: { id: true, name: true },
  });
  if (legacyApprove.length > 0) {
    // Disconnect them from all roles first (the implicit m:n relation).
    for (const p of legacyApprove) {
      await prisma.permission.update({
        where: { id: p.id },
        data: { roles: { set: [] } },
      });
    }
    const { count } = await prisma.permission.deleteMany({
      where: { id: { in: legacyApprove.map((p) => p.id) } },
    });
    process.stdout.write(`Deleted ${count} legacy per-module :approve permission row(s)\n`);
  } else {
    process.stdout.write(`No legacy per-module :approve permission rows to clean up\n`);
  }

  process.stdout.write('Approve permission migration complete.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });