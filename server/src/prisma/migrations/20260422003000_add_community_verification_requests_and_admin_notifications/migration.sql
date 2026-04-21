CREATE TYPE "CommunityVerificationRequestStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_REPORT';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NEW_COMMUNITY_VERIFICATION_REQUEST';

ALTER TABLE "Community"
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CommunityVerificationRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contact" TEXT NOT NULL,
    "status" "CommunityVerificationRequestStatus" NOT NULL DEFAULT 'OPEN',
    "communityId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "handledByUserId" TEXT,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "CommunityVerificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityVerificationRequest_status_createdAt_idx" ON "CommunityVerificationRequest"("status", "createdAt");
CREATE INDEX "CommunityVerificationRequest_communityId_createdAt_idx" ON "CommunityVerificationRequest"("communityId", "createdAt");
CREATE INDEX "CommunityVerificationRequest_requesterUserId_createdAt_idx" ON "CommunityVerificationRequest"("requesterUserId", "createdAt");
CREATE INDEX "CommunityVerificationRequest_handledByUserId_createdAt_idx" ON "CommunityVerificationRequest"("handledByUserId", "createdAt");

ALTER TABLE "CommunityVerificationRequest"
ADD CONSTRAINT "CommunityVerificationRequest_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityVerificationRequest"
ADD CONSTRAINT "CommunityVerificationRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityVerificationRequest"
ADD CONSTRAINT "CommunityVerificationRequest_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
