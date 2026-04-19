-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'USER_FOLLOWED';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "postId" DROP NOT NULL;
