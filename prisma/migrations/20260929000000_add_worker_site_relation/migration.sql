-- AlterTable: add nullable siteId to Worker so existing rows are unaffected.
-- Workers are enrolled per site; legacy rows are backfilled by
-- scripts/assign-workers-to-sites.ts (attendance/device-based).
ALTER TABLE `Worker` ADD COLUMN `siteId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Worker_siteId_idx` ON `Worker`(`siteId`);

-- AddForeignKey: a worker is enrolled to a site; dropping the site nulls the link.
ALTER TABLE `Worker` ADD CONSTRAINT `Worker_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
