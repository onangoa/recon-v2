/*
  Warnings:

  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseOrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SafetyIncident` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalarySlipDetail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Visitor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ipAddress` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `safetyScore` on the `Contractor` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEndDate` on the `Contractor` table. All the data in the column will be lost.
  - You are about to drop the column `condition` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `dailyRate` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `lastMaintenanceDate` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `nextMaintenanceDate` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `purchasePrice` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `rentalCost` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `serialNo` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `InventoryCategory` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `License` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `emailEnabled` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `pushEnabled` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `paymentFrequency` on the `PayrollPeriod` table. All the data in the column will be lost.
  - You are about to drop the column `calculationType` on the `SalaryComponent` table. All the data in the column will be lost.
  - You are about to drop the column `deductionType` on the `SalaryComponent` table. All the data in the column will be lost.
  - You are about to drop the column `isStatutory` on the `SalaryComponent` table. All the data in the column will be lost.
  - You are about to drop the column `isTaxable` on the `SalaryComponent` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `SalaryComponent` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `SalaryComponent` table. All the data in the column will be lost.
  - You are about to drop the column `attainedDays` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `attainedHours` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `chargeableIncome` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `employerCosts` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `lateDays` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `lateHours` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `leaveDays` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `leaveHours` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `payeTax` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `personalRelief` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `totalAllowance` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `workingDays` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `SalarySlip` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the column `maxSites` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `maxTeamMembers` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `TeamMember` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Document_siteId_idx";

-- DropIndex
DROP INDEX "Material_supplierId_idx";

-- DropIndex
DROP INDEX "Material_categoryId_idx";

-- DropIndex
DROP INDEX "Material_siteId_idx";

-- DropIndex
DROP INDEX "Metric_type_idx";

-- DropIndex
DROP INDEX "Metric_siteId_idx";

-- DropIndex
DROP INDEX "Photo_projectId_key";

-- DropIndex
DROP INDEX "PurchaseOrder_siteId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_supplierId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_orderNumber_key";

-- DropIndex
DROP INDEX "PurchaseOrderItem_purchaseOrderId_idx";

-- DropIndex
DROP INDEX "SafetyIncident_siteId_idx";

-- DropIndex
DROP INDEX "SalarySlipDetail_salaryComponentId_idx";

-- DropIndex
DROP INDEX "SalarySlipDetail_salarySlipId_idx";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "StockMovement_materialId_idx";

-- DropIndex
DROP INDEX "Transaction_externalId_idx";

-- DropIndex
DROP INDEX "Transaction_type_idx";

-- DropIndex
DROP INDEX "Transaction_walletId_idx";

-- DropIndex
DROP INDEX "Visitor_siteId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Document";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Material";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Metric";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Photo";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PurchaseOrder";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PurchaseOrderItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SafetyIncident";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SalarySlipDetail";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StockMovement";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Supplier";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Visitor";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Wallet";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendanceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "deviceName" TEXT,
    CONSTRAINT "AttendanceLog_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "purpose" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "checkInTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitorLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SafetyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SafetyLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "supplier" TEXT,
    "deliveredBy" TEXT,
    "receivedBy" TEXT,
    "cost" REAL,
    "notes" TEXT,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "contractorId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "categoryId" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "minStock" REAL NOT NULL DEFAULT 0,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in-stock',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("action", "contractorId", "createdAt", "description", "details", "id", "module", "targetId", "userId") SELECT "action", "contractorId", "createdAt", "description", "details", "id", "module", "targetId", "userId" FROM "ActivityLog";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";
CREATE INDEX "ActivityLog_contractorId_idx" ON "ActivityLog"("contractorId");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_module_idx" ON "ActivityLog"("module");
CREATE TABLE "new_Contractor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "licenseNo" TEXT,
    "logo" TEXT,
    "subscriptionPlanId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contractor_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contractor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contractor" ("companyName", "createdAt", "id", "licenseNo", "location", "phoneNumber", "subscriptionPlanId", "subscriptionStatus", "updatedAt", "userId") SELECT "companyName", "createdAt", "id", "licenseNo", "location", "phoneNumber", "subscriptionPlanId", "subscriptionStatus", "updatedAt", "userId" FROM "Contractor";
DROP TABLE "Contractor";
ALTER TABLE "new_Contractor" RENAME TO "Contractor";
CREATE UNIQUE INDEX "Contractor_userId_key" ON "Contractor"("userId");
CREATE INDEX "Contractor_subscriptionPlanId_idx" ON "Contractor"("subscriptionPlanId");
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "lastService" DATETIME,
    "nextService" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("createdAt", "id", "name", "siteId", "status", "updatedAt") SELECT "createdAt", "id", "name", "siteId", "status", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_siteId_idx" ON "Equipment"("siteId");
CREATE TABLE "new_InventoryCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InventoryCategory" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "InventoryCategory";
DROP TABLE "InventoryCategory";
ALTER TABLE "new_InventoryCategory" RENAME TO "InventoryCategory";
CREATE UNIQUE INDEX "InventoryCategory_slug_key" ON "InventoryCategory"("slug");
CREATE TABLE "new_License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "type" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fileName" TEXT,
    "fileData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_License" ("category", "createdAt", "expiryDate", "fileData", "fileName", "id", "issueDate", "issuingAuthority", "licenseNumber", "name", "siteId", "status", "type", "updatedAt") SELECT "category", "createdAt", "expiryDate", "fileData", "fileName", "id", "issueDate", "issuingAuthority", "licenseNumber", "name", "siteId", "status", "type", "updatedAt" FROM "License";
DROP TABLE "License";
ALTER TABLE "new_License" RENAME TO "License";
CREATE UNIQUE INDEX "License_licenseNumber_key" ON "License"("licenseNumber");
CREATE INDEX "License_siteId_idx" ON "License"("siteId");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "isRead", "message", "title", "type", "userId") SELECT "createdAt", "id", "isRead", "message", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE TABLE "new_NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationPreference_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NotificationPreference" ("contractorId", "createdAt", "id", "type", "updatedAt") SELECT "contractorId", "createdAt", "id", "type", "updatedAt" FROM "NotificationPreference";
DROP TABLE "NotificationPreference";
ALTER TABLE "new_NotificationPreference" RENAME TO "NotificationPreference";
CREATE INDEX "NotificationPreference_contractorId_idx" ON "NotificationPreference"("contractorId");
CREATE TABLE "new_PayrollPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "totalGrossPay" REAL NOT NULL DEFAULT 0,
    "totalNetPay" REAL NOT NULL DEFAULT 0,
    "totalDeductions" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdByWorkerId" TEXT,
    CONSTRAINT "PayrollPeriod_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollPeriod_createdByWorkerId_fkey" FOREIGN KEY ("createdByWorkerId") REFERENCES "Worker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PayrollPeriod" ("contractorId", "createdAt", "createdByWorkerId", "description", "endDate", "id", "name", "startDate", "status", "totalDeductions", "totalEmployees", "totalGrossPay", "totalNetPay", "updatedAt") SELECT "contractorId", "createdAt", "createdByWorkerId", "description", "endDate", "id", "name", "startDate", "status", "totalDeductions", "totalEmployees", "totalGrossPay", "totalNetPay", "updatedAt" FROM "PayrollPeriod";
DROP TABLE "PayrollPeriod";
ALTER TABLE "new_PayrollPeriod" RENAME TO "PayrollPeriod";
CREATE INDEX "PayrollPeriod_contractorId_idx" ON "PayrollPeriod"("contractorId");
CREATE INDEX "PayrollPeriod_createdByWorkerId_idx" ON "PayrollPeriod"("createdByWorkerId");
CREATE TABLE "new_SalaryComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryComponent_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SalaryComponent" ("amount", "contractorId", "createdAt", "description", "id", "isActive", "name", "type", "updatedAt") SELECT "amount", "contractorId", "createdAt", "description", "id", "isActive", "name", "type", "updatedAt" FROM "SalaryComponent";
DROP TABLE "SalaryComponent";
ALTER TABLE "new_SalaryComponent" RENAME TO "SalaryComponent";
CREATE INDEX "SalaryComponent_contractorId_idx" ON "SalaryComponent"("contractorId");
CREATE TABLE "new_SalarySlip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "basicSalary" REAL NOT NULL,
    "grossPay" REAL NOT NULL,
    "netPay" REAL NOT NULL,
    "totalDeductions" REAL NOT NULL,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "overtimePay" REAL NOT NULL DEFAULT 0,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" DATETIME,
    "mpesaReceipt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "designationId" TEXT,
    CONSTRAINT "SalarySlip_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalarySlip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalarySlip_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalarySlip_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalarySlip" ("basicSalary", "contractorId", "createdAt", "designationId", "grossPay", "id", "netPay", "overtimeHours", "payrollPeriodId", "totalDeductions", "updatedAt", "workerId") SELECT "basicSalary", "contractorId", "createdAt", "designationId", "grossPay", "id", "netPay", "overtimeHours", "payrollPeriodId", "totalDeductions", "updatedAt", "workerId" FROM "SalarySlip";
DROP TABLE "SalarySlip";
ALTER TABLE "new_SalarySlip" RENAME TO "SalarySlip";
CREATE INDEX "SalarySlip_contractorId_idx" ON "SalarySlip"("contractorId");
CREATE INDEX "SalarySlip_workerId_idx" ON "SalarySlip"("workerId");
CREATE INDEX "SalarySlip_payrollPeriodId_idx" ON "SalarySlip"("payrollPeriodId");
CREATE INDEX "SalarySlip_designationId_idx" ON "SalarySlip"("designationId");
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("contractorId", "createdAt", "id", "isPrimary", "location", "name", "updatedAt") SELECT "contractorId", "createdAt", "id", "isPrimary", "location", "name", "updatedAt" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE INDEX "Site_contractorId_idx" ON "Site"("contractorId");
CREATE TABLE "new_SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "interval" TEXT,
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SubscriptionPlan" ("createdAt", "features", "id", "isActive", "name", "price", "updatedAt") SELECT "createdAt", "features", "id", "isActive", "name", "price", "updatedAt" FROM "SubscriptionPlan";
DROP TABLE "SubscriptionPlan";
ALTER TABLE "new_SubscriptionPlan" RENAME TO "SubscriptionPlan";
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "description", "dueDate", "id", "priority", "siteId", "status", "title", "updatedAt") SELECT "createdAt", "description", "dueDate", "id", "priority", "siteId", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_siteId_idx" ON "Task"("siteId");
CREATE TABLE "new_TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "siteId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamMember_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamMember" ("contractorId", "createdAt", "email", "id", "name", "role", "status", "updatedAt") SELECT "contractorId", "createdAt", "email", "id", "name", "role", "status", "updatedAt" FROM "TeamMember";
DROP TABLE "TeamMember";
ALTER TABLE "new_TeamMember" RENAME TO "TeamMember";
CREATE INDEX "TeamMember_contractorId_idx" ON "TeamMember"("contractorId");
CREATE INDEX "TeamMember_siteId_idx" ON "TeamMember"("siteId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AttendanceLog_attendanceId_idx" ON "AttendanceLog"("attendanceId");

-- CreateIndex
CREATE INDEX "VisitorLog_siteId_idx" ON "VisitorLog"("siteId");

-- CreateIndex
CREATE INDEX "SafetyLog_siteId_idx" ON "SafetyLog"("siteId");

-- CreateIndex
CREATE INDEX "MaterialLog_siteId_idx" ON "MaterialLog"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_sku_key" ON "Inventory"("sku");

-- CreateIndex
CREATE INDEX "Inventory_siteId_idx" ON "Inventory"("siteId");

-- CreateIndex
CREATE INDEX "Inventory_categoryId_idx" ON "Inventory"("categoryId");

-- CreateIndex
CREATE INDEX "Project_siteId_idx" ON "Project"("siteId");
