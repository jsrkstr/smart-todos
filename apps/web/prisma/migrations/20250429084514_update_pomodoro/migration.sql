/*
  Warnings:

  - You are about to drop the column `taskId` on the `Pomodoro` table. All the data in the column will be lost.
  - The `status` column on the `Pomodoro` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `taskMode` column on the `Pomodoro` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Pomodoro` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PomodoroStatus" AS ENUM ('active', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "PomodoroType" AS ENUM ('focus', 'short_break', 'long_break');

-- CreateEnum
CREATE TYPE "PomodoroTaskMode" AS ENUM ('single', 'multi', 'free');

-- DropForeignKey
ALTER TABLE "Pomodoro" DROP CONSTRAINT "Pomodoro_taskId_fkey";

-- AlterTable
ALTER TABLE "Pomodoro" DROP COLUMN "taskId",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "PomodoroStatus" NOT NULL DEFAULT 'active',
DROP COLUMN "taskMode",
ADD COLUMN     "taskMode" "PomodoroTaskMode" NOT NULL DEFAULT 'single',
DROP COLUMN "type",
ADD COLUMN     "type" "PomodoroType" NOT NULL DEFAULT 'focus';
