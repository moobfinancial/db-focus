/*
  Warnings:

  - You are about to drop the column `voiceSettings` on the `VoiceSession` table. All the data in the column will be lost.
  - The `status` column on the `VoiceSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LLMProvider" ADD VALUE 'OPENAI';
ALTER TYPE "LLMProvider" ADD VALUE 'GROK';
ALTER TYPE "LLMProvider" ADD VALUE 'GEMINI';
ALTER TYPE "LLMProvider" ADD VALUE 'TOGETHER';

-- AlterEnum
ALTER TYPE "VoiceProvider" ADD VALUE 'DEEPGRAM';

-- AlterTable
ALTER TABLE "Assistant" ADD COLUMN     "config" JSONB,
ALTER COLUMN "provider" SET DEFAULT 'OPEN_AI',
ALTER COLUMN "model" SET DEFAULT 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
ALTER COLUMN "tools" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "voiceProvider" SET DEFAULT 'ELEVEN_LABS';

-- AlterTable
ALTER TABLE "VoiceSession" DROP COLUMN "voiceSettings",
ADD COLUMN     "config" JSONB,
ADD COLUMN     "rtviClientVersion" TEXT,
ADD COLUMN     "services" JSONB,
ALTER COLUMN "roomUrl" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "VoiceSessionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Assistant_userId_idx" ON "Assistant"("userId");

-- CreateIndex
CREATE INDEX "Call_userId_idx" ON "Call"("userId");

-- CreateIndex
CREATE INDEX "Call_assistantId_idx" ON "Call"("assistantId");

-- CreateIndex
CREATE INDEX "VoiceSession_userId_idx" ON "VoiceSession"("userId");

-- CreateIndex
CREATE INDEX "VoiceSession_assistantId_idx" ON "VoiceSession"("assistantId");
