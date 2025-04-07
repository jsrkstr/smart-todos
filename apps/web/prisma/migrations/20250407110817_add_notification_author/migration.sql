-- CreateEnum
CREATE TYPE "NotificationAuthor" AS ENUM ('User', 'Bot', 'Model');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "author" "NotificationAuthor" NOT NULL DEFAULT 'User';
