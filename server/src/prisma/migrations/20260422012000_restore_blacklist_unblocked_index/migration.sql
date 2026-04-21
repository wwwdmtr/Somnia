CREATE INDEX IF NOT EXISTS "CommunityBlacklist_userId_unblockedNotifiedAt_idx"
ON "CommunityBlacklist"("userId", "unblockedNotifiedAt");
