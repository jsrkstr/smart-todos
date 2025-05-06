/*
  Warnings:

  - You are about to drop the column `reminderTiming` on the `PsychProfile` table. All the data in the column will be lost.
  - You are about to drop the column `selectedCoach` on the `PsychProfile` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - The `priority` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `PomodoroTask` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TaskStage" AS ENUM ('Refinement', 'Breakdown', 'Planning', 'Execution', 'Reflection');

-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('google', 'ical', 'outlook', 'apple', 'custom');

-- DropForeignKey
ALTER TABLE "PomodoroTask" DROP CONSTRAINT "PomodoroTask_pomodoroId_fkey";

-- DropForeignKey
ALTER TABLE "PomodoroTask" DROP CONSTRAINT "PomodoroTask_taskId_fkey";

-- AlterTable
ALTER TABLE "PsychProfile" DROP COLUMN "reminderTiming",
DROP COLUMN "selectedCoach";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "status",
ADD COLUMN     "externalEventId" TEXT,
ADD COLUMN     "isCalendarEvent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stage" "TaskStage" NOT NULL DEFAULT 'Refinement',
DROP COLUMN "priority",
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'medium';

-- DropTable
DROP TABLE "PomodoroTask";

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "calendarId" TEXT,
    "syncToken" TEXT,
    "lastSynced" TIMESTAMP(3),
    "icalUrl" TEXT,
    "syncFrequency" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "lastModified" TIMESTAMP(3) NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "linkedTaskId" TEXT,
    "externalData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PomodoroTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PomodoroTasks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarConnection_userId_provider_calendarId_key" ON "CalendarConnection"("userId", "provider", "calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_calendarConnectionId_externalId_key" ON "CalendarEvent"("calendarConnectionId", "externalId");

-- CreateIndex
CREATE INDEX "_PomodoroTasks_B_index" ON "_PomodoroTasks"("B");

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PomodoroTasks" ADD CONSTRAINT "_PomodoroTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Pomodoro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PomodoroTasks" ADD CONSTRAINT "_PomodoroTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
