/*
  Warnings:

  - Added the required column `author` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('task_created', 'task_updated', 'task_deleted', 'task_completed', 'task_reactivated', 'query_asked', 'query_answered', 'ai_prompted', 'reminder_created', 'reminder_triggered', 'reminder_dismissed', 'app_opened', 'app_closed', 'pomodoro_started', 'pomodoro_paused', 'pomodoro_resumed', 'pomodoro_cancelled', 'pomodoro_completed', 'settings_updated', 'profile_updated');

-- CreateEnum
CREATE TYPE "LogAuthor" AS ENUM ('User', 'Bot', 'Model', 'App');

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "author" "LogAuthor" NOT NULL,
ADD COLUMN     "taskId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "LogType" NOT NULL;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
