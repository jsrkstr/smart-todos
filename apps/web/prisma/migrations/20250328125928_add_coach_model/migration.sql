-- AlterTable
ALTER TABLE "PsychProfile" ADD COLUMN     "coachId" TEXT,
ADD COLUMN     "reminderTiming" TEXT;

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "image" TEXT DEFAULT '/placeholder.svg?height=100&width=100',
    "description" TEXT,
    "style" TEXT,
    "type" TEXT NOT NULL DEFAULT 'system',
    "matchScore" INTEGER,
    "sampleQuotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "principles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "directness" INTEGER DEFAULT 50,
    "encouragementLevel" INTEGER DEFAULT 70,
    "coachingStyle" TEXT DEFAULT 'balanced',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PsychProfile" ADD CONSTRAINT "PsychProfile_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
