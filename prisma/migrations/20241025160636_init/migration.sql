/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Publisher` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phone` on table `Publisher` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Publisher" ALTER COLUMN "phone" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_phone_key" ON "Publisher"("phone");
