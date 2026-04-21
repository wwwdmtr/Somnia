CREATE TYPE "CommunityActionType" AS ENUM (
    'BLACKLIST_ADDED',
    'BLACKLIST_REMOVED',
    'MODERATOR_ASSIGNED',
    'MODERATOR_REVOKED',
    'OWNERSHIP_TRANSFERRED',
    'POST_PUBLISHED',
    'POST_UPDATED',
    'POST_DELETED',
    'COMMUNITY_UPDATED',
    'COMMUNITY_AVATAR_UPDATED'
);

ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_BLACKLISTED';

CREATE TABLE "CommunityBlacklist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "CommunityBlacklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityActionLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" "CommunityActionType" NOT NULL,
    "details" JSONB,
    "communityId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "postId" TEXT,

    CONSTRAINT "CommunityActionLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification"
ADD COLUMN "communityId" TEXT;

CREATE UNIQUE INDEX "CommunityBlacklist_communityId_userId_key" ON "CommunityBlacklist"("communityId", "userId");
CREATE INDEX "CommunityBlacklist_communityId_createdAt_idx" ON "CommunityBlacklist"("communityId", "createdAt");
CREATE INDEX "CommunityBlacklist_userId_expiresAt_idx" ON "CommunityBlacklist"("userId", "expiresAt");

CREATE INDEX "CommunityActionLog_communityId_createdAt_idx" ON "CommunityActionLog"("communityId", "createdAt");
CREATE INDEX "CommunityActionLog_actorUserId_createdAt_idx" ON "CommunityActionLog"("actorUserId", "createdAt");
CREATE INDEX "CommunityActionLog_targetUserId_createdAt_idx" ON "CommunityActionLog"("targetUserId", "createdAt");

CREATE INDEX "Notification_communityId_idx" ON "Notification"("communityId");

ALTER TABLE "CommunityBlacklist"
ADD CONSTRAINT "CommunityBlacklist_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityBlacklist"
ADD CONSTRAINT "CommunityBlacklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityBlacklist"
ADD CONSTRAINT "CommunityBlacklist_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityActionLog"
ADD CONSTRAINT "CommunityActionLog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityActionLog"
ADD CONSTRAINT "CommunityActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunityActionLog"
ADD CONSTRAINT "CommunityActionLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunityActionLog"
ADD CONSTRAINT "CommunityActionLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
