-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "defaultReminderTime" "ReminderTimeOption" DEFAULT 'at_time',
ADD COLUMN     "longBreakDuration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pomodoroDuration" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "shortBreakDuration" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "soundEnabled" BOOLEAN NOT NULL DEFAULT true;
