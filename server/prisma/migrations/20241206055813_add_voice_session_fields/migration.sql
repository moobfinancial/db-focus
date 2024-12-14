-- CreateEnum
CREATE TYPE "VoiceSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'FAILED');

-- AlterTable
ALTER TABLE "VoiceSession" ADD COLUMN     "botSessionId" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "voiceSettings" JSONB,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
