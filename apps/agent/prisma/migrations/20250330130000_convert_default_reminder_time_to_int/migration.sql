-- Convert defaultReminderTime from enum to integer
-- First create a temporary column
ALTER TABLE "Settings" ADD COLUMN "defaultReminderTime_int" INTEGER DEFAULT 0;

-- Populate the new column with integer values based on the enum values
UPDATE "Settings" SET "defaultReminderTime_int" = 
  CASE 
    WHEN "defaultReminderTime" = 'at_time' THEN 0
    WHEN "defaultReminderTime" = 'five_min_before' THEN 5
    WHEN "defaultReminderTime" = 'fifteen_min_before' THEN 15
    WHEN "defaultReminderTime" = 'thirty_min_before' THEN 30
    WHEN "defaultReminderTime" = 'one_hour_before' THEN 60
    WHEN "defaultReminderTime" = 'one_day_before' THEN 1440
    ELSE 0
  END;

-- Drop the old column and rename the new one
ALTER TABLE "Settings" DROP COLUMN "defaultReminderTime";
ALTER TABLE "Settings" RENAME COLUMN "defaultReminderTime_int" TO "defaultReminderTime";

-- Update schema to reflect the new type
ALTER TABLE "Settings" ALTER COLUMN "defaultReminderTime" SET NOT NULL;
ALTER TABLE "Settings" ALTER COLUMN "defaultReminderTime" SET DEFAULT 0; 