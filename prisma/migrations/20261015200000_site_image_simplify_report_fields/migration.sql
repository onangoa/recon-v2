-- AlterTable
ALTER TABLE `site` DROP COLUMN `architect`,
    DROP COLUMN `client`,
    DROP COLUMN `electricalEngineer`,
    DROP COLUMN `mainContractor`,
    DROP COLUMN `mechanicalEngineer`,
    DROP COLUMN `occupancyCategory`,
    DROP COLUMN `quantitySurveyor`,
    DROP COLUMN `reportTitle`,
    DROP COLUMN `structuralEngineer`,
    DROP COLUMN `subcontractors`,
    ADD COLUMN `image` VARCHAR(191) NULL;

-- Site image (weekly progress report header) replaces the unused report-title,
-- occupancy and project-team columns: the report title now comes from the
-- site name, the category row from Site.category, and the PROJECT TEAM
-- section from the staff (TeamMember) assigned to the site.
