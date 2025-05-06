/*
  Warnings:

  - The values [pomodoro_paused,pomodoro_resumed] on the enum `LogType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LogType_new" AS ENUM ('user_created', 'user_login', 'user_logout', 'user_settings_updated', 'task_created', 'task_updated', 'task_deleted', 'task_completed', 'task_reactivated', 'pomodoro_started', 'pomodoro_completed', 'pomodoro_cancelled', 'reward_claimed', 'streak_started', 'streak_continued', 'streak_broken', 'streak_reset', 'flash_card_created', 'flash_card_reviewed', 'quiz_started', 'quiz_completed', 'coach_feedback_received', 'accountability_partnership_created', 'tasks_prioritized', 'query_asked', 'query_answered', 'ai_prompted', 'reminder_created', 'reminder_triggered', 'reminder_dismissed', 'app_opened', 'app_closed', 'settings_updated', 'profile_updated', 'user_register');
ALTER TABLE "Log" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
ALTER TYPE "LogType" RENAME TO "LogType_old";
ALTER TYPE "LogType_new" RENAME TO "LogType";
DROP TYPE "LogType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "priorityReason" TEXT;
