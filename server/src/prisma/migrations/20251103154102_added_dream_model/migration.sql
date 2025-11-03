-- CreateTable
CREATE TABLE "Dream" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "titile" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dream_nickname_key" ON "Dream"("nickname");
