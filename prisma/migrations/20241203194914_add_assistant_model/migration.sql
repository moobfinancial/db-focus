/*
  Warnings:

  - You are about to drop the column `isActive` on the `Assistant` table. All the data in the column will be lost.
  - You are about to drop the column `voice` on the `Assistant` table. All the data in the column will be lost.
  - The `tools` column on the `Assistant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `assistantId` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('BUSINESS', 'PERSONAL', 'BOTH');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_userId_fkey";

-- DropIndex
DROP INDEX "Call_assistantId_idx";

-- AlterTable
ALTER TABLE "Assistant" DROP COLUMN "isActive",
DROP COLUMN "voice",
ADD COLUMN     "botProfile" TEXT,
ADD COLUMN     "dailyBotsSessionId" TEXT,
ADD COLUMN     "llmProvider" TEXT,
ADD COLUMN     "ttsProvider" TEXT,
ADD COLUMN     "voiceId" TEXT,
ADD COLUMN     "voiceProvider" TEXT,
ADD COLUMN     "voiceSettings" JSONB,
ALTER COLUMN "firstMessage" DROP NOT NULL,
ALTER COLUMN "provider" SET DEFAULT 'dailybots',
ALTER COLUMN "model" SET DEFAULT 'dailybots-default',
DROP COLUMN "tools",
ADD COLUMN     "tools" TEXT[];

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "assistantId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";

-- DropTable
DROP TABLE "Resource";

-- DropEnum
DROP TYPE "ResourceType";

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "prompt" TEXT,
    "successCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "progress" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "feedback" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "feedback" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dueDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhisperGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "feedback" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dueDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhisperGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "ContactGoal_userId_idx" ON "ContactGoal"("userId");

-- CreateIndex
CREATE INDEX "ContactGoal_contactId_idx" ON "ContactGoal"("contactId");

-- CreateIndex
CREATE INDEX "ContactGoal_goalId_idx" ON "ContactGoal"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactGoal_contactId_goalId_key" ON "ContactGoal"("contactId", "goalId");

-- CreateIndex
CREATE INDEX "WhisperGoal_userId_idx" ON "WhisperGoal"("userId");

-- CreateIndex
CREATE INDEX "WhisperGoal_goalId_idx" ON "WhisperGoal"("goalId");

-- CreateIndex
CREATE INDEX "WhisperGoal_templateId_idx" ON "WhisperGoal"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "WhisperGoal_userId_goalId_templateId_key" ON "WhisperGoal"("userId", "goalId", "templateId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGoal" ADD CONSTRAINT "ContactGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGoal" ADD CONSTRAINT "ContactGoal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGoal" ADD CONSTRAINT "ContactGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhisperGoal" ADD CONSTRAINT "WhisperGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhisperGoal" ADD CONSTRAINT "WhisperGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhisperGoal" ADD CONSTRAINT "WhisperGoal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhisperTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
