/*
  Warnings:

  - You are about to drop the `Publishers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "News" DROP CONSTRAINT "News_publisherUserName_fkey";

-- DropTable
DROP TABLE "Publishers";

-- CreateTable
CREATE TABLE "Publisher" (
    "id" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "profilePicture" TEXT,
    "password" TEXT NOT NULL,
    "status" "PublisherStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_userName_key" ON "Publisher"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_email_key" ON "Publisher"("email");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_publisherUserName_fkey" FOREIGN KEY ("publisherUserName") REFERENCES "Publisher"("userName") ON DELETE RESTRICT ON UPDATE CASCADE;
