/*
  Warnings:

  - A unique constraint covering the columns `[seq]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "seq" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Post_seq_key" ON "Post"("seq");
