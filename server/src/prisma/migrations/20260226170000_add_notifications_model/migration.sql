-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_LIKED', 'POST_COMMENTED', 'COMMENT_REPLIED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "commentId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_actorId_createdAt_idx" ON "Notification"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_postId_idx" ON "Notification"("postId");

-- CreateIndex
CREATE INDEX "Notification_commentId_idx" ON "Notification"("commentId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
