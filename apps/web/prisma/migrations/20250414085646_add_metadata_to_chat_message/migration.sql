-- AlterEnum
ALTER TYPE "ChatMessageRole" ADD VALUE 'system';

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "metadata" JSONB;
