/*
  Warnings:

  - A unique constraint covering the columns `[enrollId]` on the table `Worker` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Worker" ADD COLUMN "enrollId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Worker_enrollId_key" ON "Worker"("enrollId");
