-- AlterTable
ALTER TABLE `user` ADD COLUMN `stravaAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `stravaRefreshToken` VARCHAR(191) NULL;
