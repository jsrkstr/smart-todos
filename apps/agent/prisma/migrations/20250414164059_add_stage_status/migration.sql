-- CreateEnum
CREATE TYPE "TaskStageStatus" AS ENUM ('NotStarted', 'InProgress', 'QuestionAsked', 'Completed');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "stageStatus" "TaskStageStatus" NOT NULL DEFAULT 'NotStarted';
