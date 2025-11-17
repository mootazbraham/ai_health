-- CreateTable
CREATE TABLE `HealthMetric` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,

    INDEX `HealthMetric_userId_idx`(`userId`),
    UNIQUE INDEX `HealthMetric_userId_type_date_key`(`userId`, `type`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HealthMetric` ADD CONSTRAINT `HealthMetric_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
