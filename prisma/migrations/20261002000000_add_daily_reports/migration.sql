-- Daily Site Progress & Next-Day Planning Report (one per site per day).
-- See flutter/NEW PROPOSAL.docx for the report template these tables model.
CREATE TABLE `DailyReport` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Draft',
    `uploads` JSON NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DailyReport_siteId_reportDate_key`(`siteId`, `reportDate`),
    INDEX `DailyReport_siteId_idx`(`siteId`),
    INDEX `DailyReport_reportDate_idx`(`reportDate`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DailyReport_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Section A - Today's Performance activities (max 3 per report).
CREATE TABLE `DailyReportActivity` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `plannedWorkforce` JSON NULL,
    `actualWorkforce` JSON NULL,
    `labourCost` DOUBLE NOT NULL DEFAULT 0,
    `verdict` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `photos` JSON NULL,

    INDEX `DailyReportActivity_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DailyReportActivity_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Section B - Next Day's Target activities (max 2 per report).
CREATE TABLE `DailyReportTarget` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `workforce` JSON NULL,
    `remarks` VARCHAR(191) NULL,
    `uploads` JSON NULL,

    INDEX `DailyReportTarget_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DailyReportTarget_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Materials section - deliveries line items (editable table on the form).
CREATE TABLE `DailyReportDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 1,
    `item` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `DailyReportDelivery_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DailyReportDelivery_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Materials section - materials required line items (editable table).
CREATE TABLE `DailyReportMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 1,
    `item` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `DailyReportMaterial_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `DailyReportMaterial_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
