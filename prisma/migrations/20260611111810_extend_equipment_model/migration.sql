-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT,
    "serialNo" TEXT,
    "condition" TEXT,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "lastMaintenanceDate" DATETIME,
    "nextMaintenanceDate" DATETIME,
    "rentalCost" REAL,
    "dailyRate" REAL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("createdAt", "dailyRate", "id", "name", "rentalCost", "serialNo", "siteId", "status", "type", "updatedAt") SELECT "createdAt", "dailyRate", "id", "name", "rentalCost", "serialNo", "siteId", "status", "type", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_siteId_idx" ON "Equipment"("siteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
