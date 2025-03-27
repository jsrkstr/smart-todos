/*
  Warnings:

  - The values [5_minutes,10_minutes,15_minutes,30_minutes,1_hour,2_hours,1_day] on the enum `ReminderTimeOption` will be removed. If these variants are still used in the database, this will fail.
  - The values [planned] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `subtaskId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `Log` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `mode` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `subtaskId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `trigger` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `triggerAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Pomodoro` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Pomodoro` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Pomodoro` table. All the data in the column will be lost.
  - You are about to drop the column `longBreakDuration` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `notificationsEnabled` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `pomodoroDuration` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `reminderTime` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `shortBreakDuration` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `soundEnabled` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `SubTask` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTimeMinutes` on the `SubTask` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `SubTask` table. All the data in the column will be lost.
  - The `status` column on the `SubTask` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `categoryId` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `UserInsight` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `UserInsight` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserInsight` table. All the data in the column will be lost.
  - You are about to drop the `Principle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrincipleSource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TagCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `data` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Made the column `taskId` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `data` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `taskId` on table `Pomodoro` required. This step will fail if there are existing NULL values in that column.
  - Made the column `position` on table `SubTask` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `Tag` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `data` to the `UserInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `UserInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `UserInsight` table without a default value. This is not possible if the table is not empty.

*/
-- First, handle existing data
UPDATE "SubTask" SET "position" = 0 WHERE "position" IS NULL;
UPDATE "Tag" SET "color" = '#000000' WHERE "color" IS NULL;

-- Create new enums
CREATE TYPE "ReminderTimeOption_new" AS ENUM ('at_time', 'five_min_before', 'fifteen_min_before', 'thirty_min_before', 'one_hour_before', 'one_day_before');
CREATE TYPE "TaskStatus_new" AS ENUM ('new', 'in_progress', 'completed', 'cancelled');

-- Update existing data to match new enums
UPDATE "Task" SET "status" = 'new' WHERE "status" = 'planned';
UPDATE "Task" SET "reminderTime" = 'at_time' WHERE "reminderTime" IN ('5_minutes', '10_minutes', '15_minutes', '30_minutes', '1_hour', '2_hours', '1_day');

-- Handle SubTask status conversion from boolean to enum
ALTER TABLE "SubTask" ADD COLUMN "status_new" "TaskStatus_new";
UPDATE "SubTask" SET "status_new" = CASE 
  WHEN "status" = true THEN 'completed'::"TaskStatus_new"
  ELSE 'new'::"TaskStatus_new"
END;
ALTER TABLE "SubTask" DROP COLUMN "status";
ALTER TABLE "SubTask" RENAME COLUMN "status_new" TO "status";

-- Drop default values
ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "reminderTime" DROP DEFAULT;
ALTER TABLE "Settings" ALTER COLUMN "reminderTime" DROP DEFAULT;

-- Apply enum changes
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TABLE "Task" ALTER COLUMN "reminderTime" TYPE "ReminderTimeOption_new" USING ("reminderTime"::text::"ReminderTimeOption_new");
ALTER TABLE "Settings" ALTER COLUMN "reminderTime" TYPE "ReminderTimeOption_new" USING ("reminderTime"::text::"ReminderTimeOption_new");

-- Drop old enums
DROP TYPE IF EXISTS "TaskStatus" CASCADE;
DROP TYPE IF EXISTS "ReminderTimeOption" CASCADE;

-- Rename new enums
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
ALTER TYPE "ReminderTimeOption_new" RENAME TO "ReminderTimeOption";

-- Set new default values
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'new';
ALTER TABLE "Task" ALTER COLUMN "reminderTime" SET DEFAULT 'at_time';
ALTER TABLE "SubTask" ALTER COLUMN "status" SET DEFAULT 'new';

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_subtaskId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_subtaskId_fkey";

-- DropForeignKey
ALTER TABLE "Pomodoro" DROP CONSTRAINT "Pomodoro_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Principle" DROP CONSTRAINT "Principle_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "SubTask" DROP CONSTRAINT "SubTask_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "UserInsight" DROP CONSTRAINT "UserInsight_authorId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "description",
DROP COLUMN "end",
DROP COLUMN "recurrence",
DROP COLUMN "start",
DROP COLUMN "subtaskId",
DROP COLUMN "summary",
DROP COLUMN "updatedAt",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "createdBy",
DROP COLUMN "metadata",
DROP COLUMN "taskId",
ADD COLUMN     "data" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "location",
DROP COLUMN "metadata",
DROP COLUMN "mode",
DROP COLUMN "status",
DROP COLUMN "subtaskId",
DROP COLUMN "subtitle",
DROP COLUMN "title",
DROP COLUMN "trigger",
DROP COLUMN "triggerAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Pomodoro" DROP COLUMN "status",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
ALTER COLUMN "taskId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "longBreakDuration",
DROP COLUMN "notificationsEnabled",
DROP COLUMN "pomodoroDuration",
DROP COLUMN "reminderTime",
DROP COLUMN "shortBreakDuration",
DROP COLUMN "soundEnabled",
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ALTER COLUMN "emailNotifications" SET DEFAULT true;

-- AlterTable
ALTER TABLE "SubTask" DROP COLUMN "date",
DROP COLUMN "estimatedTimeMinutes",
DROP COLUMN "rank",
ALTER COLUMN "position" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'new';

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "categoryId",
ALTER COLUMN "color" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserInsight" DROP COLUMN "authorId",
DROP COLUMN "content",
DROP COLUMN "updatedAt",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Principle";

-- DropTable
DROP TABLE "PrincipleSource";

-- DropTable
DROP TABLE "TagCategory";

-- DropEnum
DROP TYPE "NotificationMode";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "PomodoroStatus";

-- DropEnum
DROP TYPE "PomodoroType";

-- DropEnum
DROP TYPE "TriggerType";

-- CreateTable
CREATE TABLE "PsychProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productivityTime" TEXT NOT NULL,
    "communicationPref" TEXT NOT NULL,
    "taskApproach" TEXT NOT NULL,
    "difficultyPreference" TEXT NOT NULL,
    "selectedCoach" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "lastDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Excuse" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Excuse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mood" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "answer" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountabilityPartnership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountabilityPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompetitionParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompetitionParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsychProfile_userId_key" ON "PsychProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_taskId_key" ON "Reward"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_taskId_key" ON "Quiz"("taskId");

-- CreateIndex
CREATE INDEX "_CompetitionParticipants_B_index" ON "_CompetitionParticipants"("B");

-- AddForeignKey
ALTER TABLE "PsychProfile" ADD CONSTRAINT "PsychProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInsight" ADD CONSTRAINT "UserInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pomodoro" ADD CONSTRAINT "Pomodoro_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Excuse" ADD CONSTRAINT "Excuse_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mood" ADD CONSTRAINT "Mood_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountabilityPartnership" ADD CONSTRAINT "AccountabilityPartnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetitionParticipants" ADD CONSTRAINT "_CompetitionParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetitionParticipants" ADD CONSTRAINT "_CompetitionParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
