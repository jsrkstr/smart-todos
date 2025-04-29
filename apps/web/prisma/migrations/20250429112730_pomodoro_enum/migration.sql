/*
  Warnings:

  - The values [short_break,long_break] on the enum `PomodoroType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PomodoroType_new" AS ENUM ('focus', 'shortBreak', 'longBreak');
ALTER TABLE "Pomodoro" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Pomodoro" ALTER COLUMN "type" TYPE "PomodoroType_new" USING ("type"::text::"PomodoroType_new");
ALTER TYPE "PomodoroType" RENAME TO "PomodoroType_old";
ALTER TYPE "PomodoroType_new" RENAME TO "PomodoroType";
DROP TYPE "PomodoroType_old";
ALTER TABLE "Pomodoro" ALTER COLUMN "type" SET DEFAULT 'focus';
COMMIT;
