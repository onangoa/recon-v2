-- Per-designation overtime rules (Option #3 in overtime.md):
-- day-type banded OT (weekday / rest_day / public_holiday), holiday source
-- and the banded breakdown stored on salary slips.

-- CreateTable
CREATE TABLE `OvertimeRule` (
    `id` VARCHAR(191) NOT NULL,
    `designationId` VARCHAR(191) NOT NULL,
    `dayType` VARCHAR(191) NOT NULL,
    `rateType` VARCHAR(191) NOT NULL DEFAULT 'hourly',
    `rateAmount` DOUBLE NOT NULL DEFAULT 0,
    `capHoursPerDay` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OvertimeRule_designationId_idx`(`designationId`),
    UNIQUE INDEX `OvertimeRule_designationId_dayType_key`(`designationId`, `dayType`),
    PRIMARY KEY (`id`),
    CONSTRAINT `OvertimeRule_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `Designation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holiday` (
    `id` VARCHAR(191) NOT NULL,
    `contractorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Holiday_contractorId_date_idx`(`contractorId`, `date`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Holiday_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `Contractor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `SalarySlip` ADD COLUMN `overtimeBands` TEXT NULL;
