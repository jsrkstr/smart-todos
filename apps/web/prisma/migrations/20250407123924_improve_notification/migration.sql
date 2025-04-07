/*
  Warnings:

  - The values [Push,Email,Chat] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('FixedTime', 'RelativeTime', 'Location');

-- CreateEnum
CREATE TYPE "NotificationMode" AS ENUM ('Push', 'Email', 'Chat');

-- CreateEnum
CREATE TYPE "NotificationRelativeTimeUnit" AS ENUM ('Minutes', 'Hours', 'Days');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('Reminder', 'Question', 'Info');
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
ALTER TABLE "Notification" ALTER COLUMN "type" SET DEFAULT 'Reminder';
COMMIT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "mode" "NotificationMode" NOT NULL DEFAULT 'Push',
ADD COLUMN     "relativeTimeUnit" "NotificationRelativeTimeUnit",
ADD COLUMN     "relativeTimeValue" INTEGER,
ADD COLUMN     "trigger" "NotificationTrigger" NOT NULL DEFAULT 'RelativeTime',
ALTER COLUMN "type" SET DEFAULT 'Reminder';
