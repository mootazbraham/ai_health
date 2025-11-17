-- AlterTable
ALTER TABLE `user` ADD COLUMN `googleAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `googleRefreshToken` VARCHAR(191) NULL;
