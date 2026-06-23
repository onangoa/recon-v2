/**
 * Standalone cron runner: scans licenses and fires expiry/expired alerts.
 *
 * Run daily via your scheduler, e.g.:
 *   tsx scripts/check-license-expiry.ts
 *
 * Make sure DATABASE_URL / SMTP_* env vars are loaded (e.g. via dotenv)
 * before invoking this script.
 */
import { prisma } from '../lib/prisma';
import { LicenseExpiryService } from '../lib/license-expiry-service';

async function main() {
  console.log(`[${new Date().toISOString()}] License expiry check starting...`);
  const result = await LicenseExpiryService.run();
  console.log(
    `Scanned: ${result.scanned}, Notified: ${result.notified}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
  );
  if (result.errors > 0 || process.env.LICENSE_CRON_VERBOSE === '1') {
    console.table(result.details);
  }
}

main()
  .catch((err) => {
    console.error('License expiry cron failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });