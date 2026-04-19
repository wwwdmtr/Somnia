-- CreateTable
CREATE TABLE "CommunitySubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "CommunitySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunitySubscription_communityId_userId_key" ON "CommunitySubscription"("communityId", "userId");

-- CreateIndex
CREATE INDEX "CommunitySubscription_userId_createdAt_idx" ON "CommunitySubscription"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunitySubscription_communityId_idx" ON "CommunitySubscription"("communityId");

-- Backfill
INSERT INTO "CommunitySubscription" ("id", "createdAt", "userId", "communityId")
SELECT
    md5(random()::text || clock_timestamp()::text),
    CURRENT_TIMESTAMP,
    c."ownerId",
    c."id"
FROM "Community" c
WHERE NOT EXISTS (
    SELECT 1
    FROM "CommunitySubscription" cs
    WHERE cs."communityId" = c."id"
      AND cs."userId" = c."ownerId"
);

-- AddForeignKey
ALTER TABLE "CommunitySubscription" ADD CONSTRAINT "CommunitySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunitySubscription" ADD CONSTRAINT "CommunitySubscription_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
