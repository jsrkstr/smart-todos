/*
  Warnings:

  - Changed the type of `type` on the `Streak` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Streak" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'new';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "principles" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "inspirations" SET DEFAULT ARRAY[]::TEXT[];
