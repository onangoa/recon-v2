-- AlterTable: add nullable siteId to BiometricDevice so existing rows are unaffected.
ALTER TABLE `BiometricDevice` ADD COLUMN `siteId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `BiometricDevice_siteId_idx` ON `BiometricDevice`(`siteId`);

-- AddForeignKey: a device belongs to a site; dropping the site nulls the link.
ALTER TABLE `BiometricDevice` ADD CONSTRAINT `BiometricDevice_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;