-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('POST', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- DropIndex
DROP INDEX "public"."CommunityBlacklist_userId_unblockedNotifiedAt_idx";

-- CreateTable
CREATE TABLE "UserBlockedUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,

    CONSTRAINT "UserBlockedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlockedCommunity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "UserBlockedCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reporterUserId" TEXT NOT NULL,
    "postId" TEXT,
    "targetUserId" TEXT,
    "handledByUserId" TEXT,
    "handledAt" TIMESTAMP(3),
    "resolutionNote" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBlockedUser_userId_createdAt_idx" ON "UserBlockedUser"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserBlockedUser_blockedUserId_createdAt_idx" ON "UserBlockedUser"("blockedUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlockedUser_userId_blockedUserId_key" ON "UserBlockedUser"("userId", "blockedUserId");

-- CreateIndex
CREATE INDEX "UserBlockedCommunity_userId_createdAt_idx" ON "UserBlockedCommunity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserBlockedCommunity_communityId_createdAt_idx" ON "UserBlockedCommunity"("communityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlockedCommunity_userId_communityId_key" ON "UserBlockedCommunity"("userId", "communityId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_createdAt_idx" ON "Report"("reporterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_targetType_status_createdAt_idx" ON "Report"("reporterUserId", "targetType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_postId_status_createdAt_idx" ON "Report"("reporterUserId", "postId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_targetUserId_status_createdAt_idx" ON "Report"("reporterUserId", "targetUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_postId_createdAt_idx" ON "Report"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_targetUserId_createdAt_idx" ON "Report"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserBlockedUser" ADD CONSTRAINT "UserBlockedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlockedUser" ADD CONSTRAINT "UserBlockedUser_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlockedCommunity" ADD CONSTRAINT "UserBlockedCommunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlockedCommunity" ADD CONSTRAINT "UserBlockedCommunity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
