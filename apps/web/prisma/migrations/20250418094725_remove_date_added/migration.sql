/*
  Warnings:

  - You are about to drop the column `dateAdded` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "dateAdded",
ALTER COLUMN "date" DROP NOT NULL;
