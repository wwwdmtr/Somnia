-- CreateEnum
CREATE TYPE "UserPermission" AS ENUM ('DELETE_POST', 'ALL');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" "UserPermission"[];
