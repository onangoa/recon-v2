-- CreateTable
CREATE TABLE `WorkerShift` (
    `id` VARCHAR(191) NOT NULL,
    `workerId` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WorkerShift_workerId_shiftId_key`(`workerId`, `shiftId`),
    INDEX `WorkerShift_workerId_idx`(`workerId`),
    INDEX `WorkerShift_shiftId_idx`(`shiftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkerShift` ADD CONSTRAINT `WorkerShift_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `Worker`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WorkerShift` ADD CONSTRAINT `WorkerShift_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: mirror existing single-shift assignments into the join table.
INSERT INTO `WorkerShift` (`id`, `workerId`, `shiftId`, `createdAt`)
SELECT REPLACE(CAST(UUID() AS CHAR), '-', ''), `w`.`id`, `w`.`shiftId`, CURRENT_TIMESTAMP(3)
FROM `Worker` `w`
WHERE `w`.`shiftId` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `WorkerShift` `ws`
    WHERE `ws`.`workerId` = `w`.`id` AND `ws`.`shiftId` = `w`.`shiftId`
  );
