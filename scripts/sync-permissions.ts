import { prisma } from '../lib/prisma';

/**
 * One-off sync: keeps the permission catalog and existing roles in step
 * after new permission keys are introduced (e.g. the `roles:*` keys that the
 * Settings -> Roles pages now enforce on /web/api/roles and /web/api/permissions).
 *
 * What it does (idempotent - safe to re-run):
 *   1. Creates any catalog permission rows that are missing in the DB
 *      (modules x actions, plus the standalone `approve` permission).
 *   2. Grants the newly added permissions to roles that should keep full
 *      access, so existing users do not lose features they already had:
 *        - roles named "Contractor Admin" (these get all permissions), and
 *        - any role that already held EVERY permission that existed before
 *          this sync ran (i.e. full-access custom roles).
 *
 * Non-destructive: never removes permissions from any role; roles with a
 * partial permission set are left untouched and reported.
 */

const MODULES = [
  'WORKERS', 'ATTENDANCE', 'PAYROLL', 'PROJECTS', 'SITES', 'TASKS',
  'INVENTORY', 'EQUIPMENT', 'SAFETY', 'TEAM', 'WALLETS', 'REPORTS', 'SETTINGS',
  'PURCHASE_ORDERS', 'SUPPLIERS', 'MATERIALS', 'VISITORS', 'DESIGNATIONS',
  'SHIFTS', 'SALARY_COMPONENTS', 'SALARY_SLIPS', 'DOCUMENTS', 'LICENSES', 'DASHBOARD',
  'ACTIVITY_LOGS', 'NOTIFICATIONS', 'CONTRACTORS', 'ROLES', 'MPESA', 'APPROVALS',
];
const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'];

const CATALOG: { name: string; module: string; action: string; description: string }[] = [];

for (const moduleName of MODULES) {
  for (const action of ACTIONS) {
    CATALOG.push({
      name: `${moduleName.toLowerCase()}:${action.toLowerCase()}`,
      module: moduleName,
      action,
      description: `Can ${action.toLowerCase()} ${moduleName.toLowerCase()}`,
    });
  }
}

// Module-agnostic approval right (kept in line with prisma/seed.ts).
CATALOG.push({
  name: 'approve',
  module: 'WALLETS',
  action: 'APPROVE',
  description: 'Can approve pending wallet transactions',
});

async function main() {
  // 1. Snapshot what already exists, so "full-access" roles are detected
  //    against the pre-sync catalog only.
  const existingPermissions = await prisma.permission.findMany({
    select: { id: true, name: true },
  });
  const existingNames = new Set(existingPermissions.map((p) => p.name));
  const preSyncNames = new Set(existingPermissions.map((p) => p.name));

  // 2. Create the missing catalog rows.
  const created: string[] = [];
  for (const entry of CATALOG) {
    if (existingNames.has(entry.name)) continue;
    await prisma.permission.create({ data: entry });
    created.push(entry.name);
    existingNames.add(entry.name);
  }

  process.stdout.write(
    `Catalog: ${CATALOG.length} keys expected, ${existingPermissions.length} already present, ${created.length} created\n`
  );
  for (const name of created) {
    process.stdout.write(`  + ${name}\n`);
  }

  // 3. Keep full-access roles in sync.
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      permissions: { select: { name: true } },
    },
  });

  let updatedRoles = 0;
  let untouchedRoles = 0;

  for (const role of roles) {
    const roleNameSet = new Set(role.permissions.map((p) => p.name));
    const isAdminRole = role.name === 'Contractor Admin';
    const hadFullAccess =
      role.permissions.length > 0 &&
      [...preSyncNames].every((name) => roleNameSet.has(name));

    if (!isAdminRole && !hadFullAccess) {
      untouchedRoles++;
      continue;
    }

    const missing = CATALOG.filter((entry) => !roleNameSet.has(entry.name));
    if (missing.length === 0) {
      untouchedRoles++;
      continue;
    }

    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: missing.map((entry) => ({ name: entry.name })),
        },
      },
    });

    updatedRoles++;
    process.stdout.write(
      `  Role "${role.name}" (${role.id}) granted ${missing.length} new permission(s): ${missing
        .map((m) => m.name)
        .join(', ')}\n`
    );
  }

  process.stdout.write(
    `\nDone. ${updatedRoles} role(s) updated, ${untouchedRoles} left untouched, ${created.length} permission row(s) created.\n`
  );
  process.stdout.write(
    `Users on untouched partial roles keep their existing grants - assign the new permissions via Settings -> Roles if needed.\n`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
