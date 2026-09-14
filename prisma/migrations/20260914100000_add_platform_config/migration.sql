-- Platform-wide dynamic settings (key/value) for super admins.

CREATE TABLE `PlatformConfig` (
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`key`)
);
