-- Remove the subscription model: open registration, no plans or billing cycles.

ALTER TABLE `Contractor` DROP FOREIGN KEY `Contractor_subscriptionPlanId_fkey`;

ALTER TABLE `Contractor` DROP INDEX `Contractor_subscriptionPlanId_idx`;

ALTER TABLE `Contractor` DROP COLUMN `subscriptionPlanId`;
ALTER TABLE `Contractor` DROP COLUMN `subscriptionStatus`;
ALTER TABLE `Contractor` DROP COLUMN `subscriptionEndDate`;
ALTER TABLE `Contractor` DROP COLUMN `purchasedSiteSlots`;

DROP TABLE `SubscriptionPlan`;
