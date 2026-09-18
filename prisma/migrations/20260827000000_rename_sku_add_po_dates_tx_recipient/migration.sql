-- Rename Inventory.sku -> productId (preserve data + unique constraint)
ALTER TABLE `Inventory` DROP INDEX `Inventory_sku_key`;
ALTER TABLE `Inventory` CHANGE COLUMN `sku` `productId` VARCHAR(191) NULL;
ALTER TABLE `Inventory` ADD UNIQUE INDEX `Inventory_productId_key`(`productId`);

-- Add delivery receipt fields to PurchaseOrder
ALTER TABLE `PurchaseOrder` ADD COLUMN `partiallyReceivedDate` DATETIME(3) NULL;
ALTER TABLE `PurchaseOrder` ADD COLUMN `receivedInFullDate` DATETIME(3) NULL;
ALTER TABLE `PurchaseOrder` ADD COLUMN `deliveryNoteUrl` VARCHAR(191) NULL;
ALTER TABLE `PurchaseOrder` ADD COLUMN `deliveryNoteFileName` VARCHAR(191) NULL;

-- Add payment recipient + proof document fields to Transaction
ALTER TABLE `Transaction` ADD COLUMN `recipientName` VARCHAR(191) NULL;
ALTER TABLE `Transaction` ADD COLUMN `proofDocumentUrl` VARCHAR(191) NULL;
ALTER TABLE `Transaction` ADD COLUMN `proofDocumentName` VARCHAR(191) NULL;
