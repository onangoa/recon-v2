-- Weekly Progress Report data on sites (SAMPLE REPORT.docx template):
-- project identity, dates, progress stats and the project team shown on
-- the weekly progress report PDF. All nullable - existing sites keep
-- working and the report falls back to name/contractor data when blank.
-- AlterTable
ALTER TABLE `site` ADD COLUMN `architect` VARCHAR(191) NULL,
    ADD COLUMN `builtUpArea` VARCHAR(191) NULL,
    ADD COLUMN `client` VARCHAR(191) NULL,
    ADD COLUMN `commencementDate` DATETIME(3) NULL,
    ADD COLUMN `contractPeriodMonths` INTEGER NULL,
    ADD COLUMN `electricalEngineer` VARCHAR(191) NULL,
    ADD COLUMN `expectedCompletionDate` DATETIME(3) NULL,
    ADD COLUMN `mainContractor` VARCHAR(191) NULL,
    ADD COLUMN `mechanicalEngineer` VARCHAR(191) NULL,
    ADD COLUMN `numberOfFloors` INTEGER NULL,
    ADD COLUMN `occupancyCategory` VARCHAR(191) NULL,
    ADD COLUMN `overallProgress` DOUBLE NULL,
    ADD COLUMN `plotNumber` VARCHAR(191) NULL,
    ADD COLUMN `progressDescription` VARCHAR(191) NULL,
    ADD COLUMN `quantitySurveyor` VARCHAR(191) NULL,
    ADD COLUMN `reportTitle` VARCHAR(191) NULL,
    ADD COLUMN `siteEngineer` VARCHAR(191) NULL,
    ADD COLUMN `structuralEngineer` VARCHAR(191) NULL,
    ADD COLUMN `subcontractors` VARCHAR(191) NULL;
