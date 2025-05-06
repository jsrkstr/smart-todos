/*
  Warnings:

  - Added the required column `type` to the `Pomodoro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Pomodoro` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pomodoro" DROP CONSTRAINT "Pomodoro_taskId_fkey";

-- AlterTable
ALTER TABLE "Pomodoro" ADD COLUMN     "settings" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "taskMode" TEXT DEFAULT 'single',
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "taskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SubTask" ALTER COLUMN "position" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "estimatedPomodoros" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PomodoroTask" (
    "id" TEXT NOT NULL,
    "pomodoroId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PomodoroTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PomodoroTask_pomodoroId_idx" ON "PomodoroTask"("pomodoroId");

-- CreateIndex
CREATE INDEX "PomodoroTask_taskId_idx" ON "PomodoroTask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "PomodoroTask_pomodoroId_taskId_key" ON "PomodoroTask"("pomodoroId", "taskId");

-- AddForeignKey
ALTER TABLE "Pomodoro" ADD CONSTRAINT "Pomodoro_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pomodoro" ADD CONSTRAINT "Pomodoro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PomodoroTask" ADD CONSTRAINT "PomodoroTask_pomodoroId_fkey" FOREIGN KEY ("pomodoroId") REFERENCES "Pomodoro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PomodoroTask" ADD CONSTRAINT "PomodoroTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
