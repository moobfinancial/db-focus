/*
  Warnings:

  - You are about to drop the column `botProfile` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `dailyBotsSessionId` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `llmProvider` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `modes` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `ttsProvider` on the `Assistant` table. All the data in the column will be lost.
  - The `provider` column on the `Assistant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `voiceProvider` column on the `Assistant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `assistantId` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LLMProvider" AS ENUM ('OPEN_AI', 'ANTHROPIC', 'GOOGLE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VoiceProvider" AS ENUM ('CARTESIA', 'ELEVEN_LABS', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_contactId_fkey";

-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "botProfile",
DROP COLUMN "dailyBotsSessionId",
DROP COLUMN "llmProvider",
DROP COLUMN "modes",
DROP COLUMN "ttsProvider",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ALTER COLUMN "systemPrompt" DROP NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "LLMProvider" NOT NULL DEFAULT 'OPEN_AI',
ALTER COLUMN "model" DROP DEFAULT,
DROP COLUMN "voiceProvider",
ADD COLUMN     "voiceProvider" "VoiceProvider" NOT NULL DEFAULT 'CARTESIA';

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "assistantId" TEXT NOT NULL,
ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "contactId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Call_assistantId_idx" ON "Call"("assistantId");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
