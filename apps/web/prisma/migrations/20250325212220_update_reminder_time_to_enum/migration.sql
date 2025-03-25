/*
  Warnings:

  - The `reminderTime` column on the `Settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `reminderTime` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReminderTimeOption" AS ENUM ('at_time', '5_minutes', '10_minutes', '15_minutes', '30_minutes', '1_hour', '2_hours', '1_day');

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "reminderTime",
ADD COLUMN     "reminderTime" "ReminderTimeOption" NOT NULL DEFAULT 'at_time';

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "reminderTime",
ADD COLUMN     "reminderTime" "ReminderTimeOption" DEFAULT 'at_time';
