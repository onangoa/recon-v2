ALTER TABLE `Transaction` ADD COLUMN `seq` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE INDEX `Transaction_seq_key`(`seq`);
