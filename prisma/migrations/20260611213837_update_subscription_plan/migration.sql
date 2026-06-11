-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "interval" TEXT,
    "maxProjects" INTEGER,
    "maxSites" INTEGER,
    "maxTeamMembers" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SubscriptionPlan" ("createdAt", "description", "features", "id", "interval", "isActive", "maxProjects", "maxSites", "maxTeamMembers", "name", "price", "updatedAt") SELECT "createdAt", "description", "features", "id", "interval", "isActive", "maxProjects", "maxSites", "maxTeamMembers", "name", "price", "updatedAt" FROM "SubscriptionPlan";
DROP TABLE "SubscriptionPlan";
ALTER TABLE "new_SubscriptionPlan" RENAME TO "SubscriptionPlan";
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
