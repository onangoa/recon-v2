/*
  Warnings:

  - You are about to drop the column `maxSalary` on the `Designation` table. All the data in the column will be lost.
  - You are about to drop the column `minSalary` on the `Designation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Designation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "salary" REAL,
    "paymentFrequency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Designation_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Designation" ("contractorId", "createdAt", "description", "id", "isActive", "title", "updatedAt") SELECT "contractorId", "createdAt", "description", "id", "isActive", "title", "updatedAt" FROM "Designation";
DROP TABLE "Designation";
ALTER TABLE "new_Designation" RENAME TO "Designation";
CREATE INDEX "Designation_contractorId_idx" ON "Designation"("contractorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
