/*
  Warnings:

  - You are about to drop the column `isSeen` on the `message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `message` DROP COLUMN `isSeen`,
    ADD COLUMN `status` ENUM('SENT', 'DELIVERED', 'SEEN') NOT NULL DEFAULT 'SENT';
