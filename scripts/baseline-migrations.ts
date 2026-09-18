import { createHash, randomUUID } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../lib/prisma';

const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at DATETIME(3) NULL,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT NULL,
      rolled_back_at DATETIME(3) NULL,
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE = InnoDB
  `);

  // Clear any failed/pending rows (e.g. from an aborted migrate deploy)
  await prisma.$executeRawUnsafe(
    'DELETE FROM _prisma_migrations WHERE finished_at IS NULL'
  );

  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const dir of dirs) {
    const sql = readFileSync(join(MIGRATIONS_DIR, dir, 'migration.sql'));
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = (await prisma.$queryRawUnsafe(
      'SELECT id FROM _prisma_migrations WHERE migration_name = ?',
      dir
    )) as any[];
    if (existing.length > 0) {
      console.log(`skip (already recorded): ${dir}`);
      continue;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
       VALUES (?, ?, NOW(3), ?, NOW(3), 1)`,
      randomUUID(), checksum, dir
    );
    console.log(`recorded as applied: ${dir}`);
  }

  const count = (await prisma.$queryRawUnsafe(
    'SELECT COUNT(*) AS c FROM _prisma_migrations'
  )) as any[];
  console.log(`total recorded: ${count[0].c}`);
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
