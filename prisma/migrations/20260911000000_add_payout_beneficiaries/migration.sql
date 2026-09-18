-- Add PayoutBeneficiary (saved payout destinations / address book)
CREATE TABLE `PayoutBeneficiary` (
    `id` VARCHAR(191) NOT NULL,
    `contractorId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `accountRef` VARCHAR(191) NULL,
    `bankCode` VARCHAR(191) NULL,
    `recipientName` VARCHAR(191) NULL,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `lastUsedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayoutBeneficiary_contractorId_idx`(`contractorId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `PayoutBeneficiary_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `Contractor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
