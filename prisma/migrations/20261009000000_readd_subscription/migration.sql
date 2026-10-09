-- Re-introduce the subscription plan system (reverts 20260914000000_remove_subscription).

CREATE TABLE `SubscriptionPlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL,
    `interval` VARCHAR(191) NULL,
    `maxProjects` INTEGER NULL,
    `maxSites` INTEGER NULL,
    `maxTeamMembers` INTEGER NOT NULL,
    `features` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPlan_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `SubscriptionPlan` (`id`, `name`, `price`, `maxSites`, `maxTeamMembers`, `features`, `isActive`, `createdAt`, `updatedAt`) VALUES
    ('plan_basic', 'Basic', 2999, 1, 3, '["Up to 5 sites","Basic reporting","Email support"]', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('plan_professional', 'Professional', 7999, 1, 15, '["Unlimited sites","Advanced reporting","Priority support","Team management"]', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    ('plan_enterprise', 'Enterprise', 19999, 1, 999, '["Unlimited sites","Custom reporting","24/7 support","Advanced features"]', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

ALTER TABLE `Contractor`
    ADD COLUMN `subscriptionPlanId` VARCHAR(191) NULL,
    ADD COLUMN `subscriptionStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    ADD COLUMN `subscriptionEndDate` DATETIME(3) NULL,
    ADD COLUMN `purchasedSiteSlots` INTEGER NOT NULL DEFAULT 1;

UPDATE `Contractor` SET `subscriptionPlanId` = 'plan_basic' WHERE `subscriptionPlanId` IS NULL;

-- Grandfather contractors that registered during the free window:
-- grant one slot per existing site (minimum 1) so nobody gets blocked.
UPDATE `Contractor` `c`
LEFT JOIN (
    SELECT `contractorId`, COUNT(*) AS `siteCount`
    FROM `Site`
    GROUP BY `contractorId`
) `s` ON `s`.`contractorId` = `c`.`id`
SET `c`.`purchasedSiteSlots` = GREATEST(1, COALESCE(`s`.`siteCount`, 0));

ALTER TABLE `Contractor`
    MODIFY `subscriptionPlanId` VARCHAR(191) NOT NULL,
    ADD INDEX `Contractor_subscriptionPlanId_idx`(`subscriptionPlanId`);

ALTER TABLE `Contractor` ADD CONSTRAINT `Contractor_subscriptionPlanId_fkey` FOREIGN KEY (`subscriptionPlanId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
