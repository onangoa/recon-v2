-- National ID uniqueness is per contractor, not global: the same person
-- (same national ID) may legitimately work for several contractor accounts.
-- Previously a global unique index blocked re-adding a worker whose ID was
-- still held by an invisible row (e.g. another contractor's worker).
ALTER TABLE `Worker` DROP INDEX `Worker_nationalId_key`;

ALTER TABLE `Worker` ADD UNIQUE INDEX `Worker_contractorId_nationalId_key`(`contractorId`, `nationalId`);
