/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Session_userId_idx";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "accountReference" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "callbackReceivedAt" DATETIME;
ALTER TABLE "Transaction" ADD COLUMN "checkoutRequestId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "merchantRequestId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "mpesaReceiptNumber" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "mpesaTransactionId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "originatorConversationId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "rawApiResponse" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "rawCallbackData" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "remarks" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "resultCode" INTEGER;
ALTER TABLE "Transaction" ADD COLUMN "resultDesc" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "transactionDesc" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "transactionType" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "contractorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "InventoryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryCategory_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryCategory" ("createdAt", "description", "id", "name", "parentId", "slug", "updatedAt") SELECT "createdAt", "description", "id", "name", "parentId", "slug", "updatedAt" FROM "InventoryCategory";
DROP TABLE "InventoryCategory";
ALTER TABLE "new_InventoryCategory" RENAME TO "InventoryCategory";
CREATE UNIQUE INDEX "InventoryCategory_slug_key" ON "InventoryCategory"("slug");
CREATE INDEX "InventoryCategory_parentId_idx" ON "InventoryCategory"("parentId");
CREATE INDEX "InventoryCategory_contractorId_idx" ON "InventoryCategory"("contractorId");
CREATE TABLE "new_Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'contractor',
    "contractorId" TEXT,
    CONSTRAINT "Role_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Role" ("contractorId", "description", "id", "name") SELECT "contractorId", "description", "id", "name" FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE INDEX "Role_contractorId_idx" ON "Role"("contractorId");
CREATE TABLE "new_Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'active',
    "contractorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wallet" ("balance", "contractorId", "createdAt", "currency", "description", "id", "name", "status", "updatedAt") SELECT "balance", "contractorId", "createdAt", "currency", "description", "id", "name", "status", "updatedAt" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE INDEX "Wallet_contractorId_idx" ON "Wallet"("contractorId");
CREATE TABLE "new_Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "designationId" TEXT,
    "shiftId" TEXT,
    "paymentMode" TEXT NOT NULL DEFAULT 'manual',
    "paymentPhone" TEXT,
    "paymentAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "enrollId" TEXT,
    CONSTRAINT "Worker_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Worker_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Worker_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Worker" ("contractorId", "createdAt", "designationId", "email", "enrollId", "id", "joinedAt", "name", "nationalId", "phone", "shiftId", "status", "updatedAt") SELECT "contractorId", "createdAt", "designationId", "email", "enrollId", "id", "joinedAt", "name", "nationalId", "phone", "shiftId", "status", "updatedAt" FROM "Worker";
DROP TABLE "Worker";
ALTER TABLE "new_Worker" RENAME TO "Worker";
CREATE UNIQUE INDEX "Worker_nationalId_key" ON "Worker"("nationalId");
CREATE UNIQUE INDEX "Worker_enrollId_key" ON "Worker"("enrollId");
CREATE INDEX "Worker_contractorId_idx" ON "Worker"("contractorId");
CREATE INDEX "Worker_designationId_idx" ON "Worker"("designationId");
CREATE INDEX "Worker_shiftId_idx" ON "Worker"("shiftId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Transaction_mpesaTransactionId_idx" ON "Transaction"("mpesaTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_checkoutRequestId_idx" ON "Transaction"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Transaction_merchantRequestId_idx" ON "Transaction"("merchantRequestId");

-- CreateIndex
CREATE INDEX "Transaction_conversationId_idx" ON "Transaction"("conversationId");

-- CreateIndex
CREATE INDEX "Transaction_originatorConversationId_idx" ON "Transaction"("originatorConversationId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_transactionType_idx" ON "Transaction"("transactionType");
