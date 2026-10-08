-- Materials Management: per-row image on each deliveries / materials line
-- item (replaces the fixed shared 5-slot attachments picker on the form).
ALTER TABLE `DailyReportDelivery` ADD COLUMN `photos` JSON NULL;

ALTER TABLE `DailyReportMaterial` ADD COLUMN `photos` JSON NULL;
