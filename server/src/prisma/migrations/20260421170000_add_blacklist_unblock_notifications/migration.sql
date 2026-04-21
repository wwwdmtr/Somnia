ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_UNBLACKLISTED';

ALTER TABLE "CommunityBlacklist"
ADD COLUMN "unblockedNotifiedAt" TIMESTAMP(3);

ALTER TABLE "Notification"
ADD COLUMN "details" JSONB;

CREATE INDEX "CommunityBlacklist_userId_unblockedNotifiedAt_idx"
ON "CommunityBlacklist"("userId", "unblockedNotifiedAt");
