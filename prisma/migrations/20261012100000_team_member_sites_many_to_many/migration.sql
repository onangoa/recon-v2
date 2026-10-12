/*
  Warnings:

  - You are about to drop the column `siteId` on the `TeamMember` table, which
    is not fully covered by the migration below (see the backfill step).
    All data is preserved via the backfill INSERT into `_SiteToTeamMember`.

*/
-- Create join table for the TeamMember <-> Site many-to-many relation.
-- A team member can now be attached to one or more sites; switching the
-- active site filters the workforce accordingly.
CREATE TABLE `_SiteToTeamMember` (
  `A` VARCHAR(191) NOT NULL,
  `B` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `_SiteToTeamMember_AB_unique`(`A`, `B`),
  INDEX `_SiteToTeamMember_B_index`(`B`),

  FOREIGN KEY (`A`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`B`) REFERENCES `TeamMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: carry over any legacy single-site assignments into the join
-- table before the column is dropped (idempotent; safe on re-runs).
INSERT IGNORE INTO `_SiteToTeamMember` (`A`, `B`)
SELECT `siteId`, `id` FROM `TeamMember` WHERE `siteId` IS NOT NULL;

-- DropIndex
ALTER TABLE `TeamMember` DROP FOREIGN KEY `TeamMember_siteId_fkey`;

-- DropIndex
DROP INDEX `TeamMember_siteId_idx` ON `TeamMember`;

-- DropColumn
ALTER TABLE `TeamMember` DROP COLUMN `siteId`;
