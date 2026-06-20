/*
  Warnings:

  - You are about to drop the column `schoolAddress` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `schoolEmail` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `schoolPhone` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `schoolWebsite` on the `app_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_settings" DROP COLUMN "schoolAddress",
DROP COLUMN "schoolEmail",
DROP COLUMN "schoolName",
DROP COLUMN "schoolPhone",
DROP COLUMN "schoolWebsite",
ADD COLUMN     "classAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "classEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "className" TEXT NOT NULL DEFAULT 'My Coaching Class',
ADD COLUMN     "classPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "classWebsite" TEXT NOT NULL DEFAULT '';
